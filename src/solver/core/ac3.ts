import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule } from '@/constraints/contracts';
import { TimeSlot, SLOTS_PER_HOUR, SLOTS_PER_DAY, isSlotRangeFree } from './timeDomain';

export interface EventDomain {
  eventId: string;
  allowedSlotIndices: number[];
}

/**
 * Algoritmo AC-3 y Forward Checking para poda estricta de dominios
 */
export function pruneDomainsAC3(
  unassignedEvents: Event[],
  assignedEvents: Event[],
  weekSlots: TimeSlot[],
  hardRules: HardConstraintRule[],
  context: ConstraintContext
): Map<string, number[]> {
  const domains = new Map<string, number[]>();

  for (const event of unassignedEvents) {
    const neededSlots = Math.ceil(event.durationMinutes / 15);
    const validSlots: number[] = [];

    // Dominio inicial: todos los slots libres donde quepa el evento
    for (let slotIdx = 0; slotIdx <= weekSlots.length - neededSlots; slotIdx++) {
      // Poda 0 inmediata: si el rango de slots ya está ocupado en la cuadrícula, descartar
      if (!isSlotRangeFree(weekSlots, slotIdx, neededSlots)) continue;

      const candidateStart = weekSlots[slotIdx].start;
      const candidateEnd = new Date(candidateStart.getTime() + event.durationMinutes * 60 * 1000);

      // Poda 0.5: Inmutabilidad estricta del pasado.
      // El tiempo que ya pasó, ya pasó: un evento jamás puede comenzar antes de context.currentTime
      if (candidateStart < context.currentTime) continue;

      // Poda 1: Deadline (si tiene fecha límite, no puede terminar después)
      if (event.deadline) {
        const deadlineDate = typeof event.deadline === 'string' ? new Date(event.deadline) : event.deadline;
        if (candidateEnd > deadlineDate) continue;
      }

      // Poda 2: Ventana horaria de conveniencia (si tiene preferredTimeWindow)
      if (event.preferredTimeWindow) {
        const { start: prefStart, end: prefEnd } = event.preferredTimeWindow;
        const [pStartH, pStartM] = prefStart.split(':').map(Number);
        const [pEndH, pEndM] = prefEnd.split(':').map(Number);

        const slotH = candidateStart.getHours();
        const slotM = candidateStart.getMinutes();
        const slotTime = slotH + slotM / 60;
        const windowStartTime = pStartH + pStartM / 60;
        const windowEndTime = pEndH + pEndM / 60;

        if (slotTime < windowStartTime || slotTime > windowEndTime) continue;
      }

      // Poda 3: Evaluación tentativa contra Hard Constraints activas
      const candidateEvent: Event = {
        ...event,
        startTime: candidateStart,
        endTime: candidateEnd,
      };

      const testSchedule = [...assignedEvents, candidateEvent];
      let passesHardRules = true;

      for (const rule of hardRules) {
        const validation = rule.validate(testSchedule, context);
        if (!validation.satisfied) {
          passesHardRules = false;
          break;
        }
      }

      if (passesHardRules) {
        validSlots.push(slotIdx);
      }
    }

    domains.set(event.id, validSlots);
  }

  return domains;
}
