import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule } from '@/constraints/contracts';
import { TimeSlot, SLOTS_PER_DAY, occupySlotRange, slotIndexToDate, isSlotRangeFree } from './timeDomain';

export interface GapFillerResult {
  schedule: Event[];
  addedEvents: Event[];
  addedStudyMinutes: number;
  addedSocialMinutes: number;
  ratioStudy: number;
  ratioSocial: number;
}

/**
 * Rellena de forma determinista y proporcional los huecos libres disponibles de la semana
 * con bloques adicionales de Estudio y Social, respetando la proporción base de la semana.
 */
export function fillAvailableGaps(
  currentSchedule: Event[],
  weekSlots: TimeSlot[],
  mondayDate: Date,
  context: ConstraintContext,
  hardRules: HardConstraintRule[]
): GapFillerResult {
  // 1. Calcular la carga base previa de Estudio y Social en la semana
  let baseStudyMinutes = 0;
  let baseSocialMinutes = 0;

  for (const ev of currentSchedule) {
    const mins = ev.durationMinutes || 60;
    if (ev.categoryId === 'cat-study-float' || ev.categoryId === 'cat-study-fixed') {
      baseStudyMinutes += mins;
    } else if (ev.categoryId === 'cat-social') {
      baseSocialMinutes += mins;
    }
  }

  // 2. Determinar la proporción objetivo (Ratio Estudio vs Social)
  const totalTracked = baseStudyMinutes + baseSocialMinutes;
  let ratioStudy = 0.5;
  let ratioSocial = 0.5;

  if (totalTracked > 0) {
    ratioStudy = baseStudyMinutes / totalTracked;
    ratioSocial = baseSocialMinutes / totalTracked;
  } else {
    // Si no había eventos previos de ninguno, usar la proporción de los MetaSliders
    const academicWeight = context.metaSliders?.academic ?? 1.0;
    const socialWeight = context.metaSliders?.social ?? 1.0;
    const sum = academicWeight + socialWeight;
    ratioStudy = sum > 0 ? academicWeight / sum : 0.5;
    ratioSocial = sum > 0 ? socialWeight / sum : 0.5;
  }

  const addedEvents: Event[] = [];
  const updatedSchedule: Event[] = [...currentSchedule];
  let addedStudyMinutes = 0;
  let addedSocialMinutes = 0;

  // 3. Escanear días de la semana (Lunes = 0 a Domingo = 6)
  // Horario diurno viable: 08:30 (slot 34) a 22:00 (slot 88)
  const DAY_START_SLOT = 34; // 08:30
  const DAY_END_SLOT = 88;   // 22:00

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayOffsetSlots = dayIdx * SLOTS_PER_DAY;
    let slotInDay = DAY_START_SLOT;

    while (slotInDay < DAY_END_SLOT) {
      const globalSlotIdx = dayOffsetSlots + slotInDay;
      const slotDate = slotIndexToDate(globalSlotIdx, mondayDate);

      // Inmutabilidad del pasado: no rellenar tiempos que ya transcurrieron
      if (context.currentTime && slotDate.getTime() < context.currentTime.getTime()) {
        slotInDay++;
        continue;
      }

      // Si el slot está ocupado, avanzar
      if (weekSlots[globalSlotIdx]?.isOccupied) {
        slotInDay++;
        continue;
      }

      // Encontrar la extensión continua del hueco libre
      let freeSlotsCount = 0;
      while (
        slotInDay + freeSlotsCount < DAY_END_SLOT &&
        !weekSlots[dayOffsetSlots + slotInDay + freeSlotsCount]?.isOccupied
      ) {
        freeSlotsCount++;
      }

      const availableMinutes = freeSlotsCount * 15;

      // Descartar huecos menores a 45 minutos (margen/buffer natural)
      if (availableMinutes < 45) {
        slotInDay += freeSlotsCount;
        continue;
      }

      // Determinar tamaño óptimo del bloque (entre 60 y 120 minutos)
      let blockDuration = 90; // Default óptimo
      if (availableMinutes <= 75) {
        blockDuration = availableMinutes;
      } else if (availableMinutes >= 180) {
        blockDuration = 120;
      } else if (availableMinutes >= 120) {
        blockDuration = 90;
      } else {
        blockDuration = availableMinutes;
      }

      const neededSlots = Math.ceil(blockDuration / 15);
      if (!isSlotRangeFree(weekSlots, globalSlotIdx, neededSlots)) {
        slotInDay++;
        continue;
      }

      // 4. Decidir categoría según la proporción acumulada actual
      const currentTotalStudy = baseStudyMinutes + addedStudyMinutes;
      const currentTotalSocial = baseSocialMinutes + addedSocialMinutes;
      const currentCombined = currentTotalStudy + currentTotalSocial;

      const currentStudyShare = currentCombined > 0 ? currentTotalStudy / currentCombined : 0;
      const assignStudy = currentStudyShare <= ratioStudy;

      const blockStart = slotIndexToDate(globalSlotIdx, mondayDate);
      const blockEnd = new Date(blockStart.getTime() + blockDuration * 60 * 1000);

      const candidateEvent: Event = assignStudy
        ? {
            id: `filler-study-${dayIdx}-${slotInDay}`,
            categoryId: 'cat-study-float',
            title: 'Foco y Estudio Adicional (Llenado)',
            startTime: blockStart,
            endTime: blockEnd,
            durationMinutes: blockDuration,
            cognitiveLoad: 2,
            physicalLoad: 0,
            energyDrain: 'normal',
            location: 'Casa',
            isFloating: true,
          }
        : {
            id: `filler-social-${dayIdx}-${slotInDay}`,
            categoryId: 'cat-social',
            title: 'Espacio Social y Ocio (Llenado)',
            startTime: blockStart,
            endTime: blockEnd,
            durationMinutes: blockDuration,
            cognitiveLoad: 0,
            physicalLoad: 0,
            energyDrain: 'low',
            location: 'Casa',
            isFloating: true,
          };

      // 5. Validar reglas duras (Hard Constraints: Overlap, Travel, Sleep, Ban)
      const testSchedule = [...updatedSchedule, candidateEvent];
      let isValid = true;
      for (const rule of hardRules) {
        const res = rule.validate(testSchedule, context);
        if (!res.satisfied) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        occupySlotRange(weekSlots, globalSlotIdx, neededSlots, candidateEvent.id);
        updatedSchedule.push(candidateEvent);
        addedEvents.push(candidateEvent);

        if (assignStudy) {
          addedStudyMinutes += blockDuration;
        } else {
          addedSocialMinutes += blockDuration;
        }

        // Avanzar los slots del bloque asignado más un pequeño respiro de 15 min si sobra tiempo
        slotInDay += neededSlots + 1;
      } else {
        slotInDay++;
      }
    }
  }

  return {
    schedule: updatedSchedule,
    addedEvents,
    addedStudyMinutes,
    addedSocialMinutes,
    ratioStudy,
    ratioSocial,
  };
}
