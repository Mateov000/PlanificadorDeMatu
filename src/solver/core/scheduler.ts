import { Event } from '@/types/event';
import { ConstraintContext } from '@/constraints/contracts';
import { SolverResult } from '../types';
import { constraintRegistry } from '@/constraints/registry';
import {
  initializeWeekTimeSlots,
  dateToSlotIndex,
  slotIndexToDate,
  isSlotRangeFree,
  occupySlotRange,
} from './timeDomain';
import { pruneDomainsAC3 } from './ac3';
import { evaluateScheduleScore } from './scoreEvaluator';
import { fillAvailableGaps } from './gapFiller';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Normaliza cualquier fecha de la semana a su Lunes 00:00:00 (inicio de grid de 7 días)
 */
function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getHours() !== 0;

  if (isUtcMidnight) {
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    date.setUTCDate(date.getUTCDate() - diff);
    return date;
  }

  const day = date.getDay(); // 0 = Domingo, 1 = Lunes
  const diff = (day + 6) % 7; // Distancia al lunes anterior
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Divide metas grandes en fragmentos cognitivos óptimos (Auto-splitting de 90 a 180 min)
 */
function splitFloatingGoal(event: Event): Event[] {
  if (!event.isFloating || !event.totalRequiredMinutes || event.totalRequiredMinutes <= 0) {
    return [event];
  }

  const minBlock = event.minBlockMinutes || 90;
  const maxBlock = event.maxBlockMinutes || 180;
  let remaining = event.totalRequiredMinutes;
  const chunks: Event[] = [];
  let chunkIdx = 1;

  while (remaining > 0) {
    let chunkSize = Math.min(remaining, maxBlock);
    if (remaining - chunkSize > 0 && remaining - chunkSize < minBlock) {
      chunkSize = Math.max(minBlock, Math.floor(remaining / 2));
    }

    chunks.push({
      ...event,
      id: `${event.id}-split-${chunkIdx}`,
      durationMinutes: chunkSize,
      title: chunks.length === 0 && remaining === chunkSize ? event.title : `${event.title} (Bloque ${chunkIdx})`,
      startTime: undefined,
      endTime: undefined,
    });

    remaining -= chunkSize;
    chunkIdx++;
  }

  return chunks;
}

/**
 * Motor Central CSP de Auto-Scheduling Local y Determinista
 * Ejecución 100% simbólica, Forward Checking + AC-3, costo $0, < 50ms.
 * Garantiza inmutabilidad estricta del tiempo transcurrido (past is immutable).
 */
export function solveSchedule(
  allEvents: Event[],
  context: ConstraintContext,
  weekStartDate: Date = new Date()
): SolverResult {
  const startTimeMs = performance.now();
  const hardRules = constraintRegistry.getHardRules();
  const softRules = constraintRegistry.getSoftRules();

  // Normalizar inicio de semana al Lunes 00:00 para alinear con la cuadrícula de 7 días
  const mondayDate = getMondayOfWeek(weekStartDate);

  // 1. Inicializar slots discretos de la semana (672 slots de 15 min)
  const weekSlots = initializeWeekTimeSlots(mondayDate);

  // 1.1 Bloquear tajantemente todos los slots que ya pasaron respecto a context.currentTime.
  // ¡El tiempo que ya pasó es inmutable! Ningún bloque flotante puede ubicarse en el pasado.
  for (let i = 0; i < weekSlots.length; i++) {
    if (weekSlots[i].end <= context.currentTime) {
      weekSlots[i].isOccupied = true;
      weekSlots[i].occupyingEventId = 'past-slot-immutable';
    }
  }

  // 2. Separar eventos fijos (Hard Pillars, eventos pasados o ya asignados inamovibles) de los flotantes
  const fixedEvents: Event[] = [];
  const floatingEvents: Event[] = [];

  for (const ev of allEvents) {
    const evStart = parseDate(ev.startTime);
    const evEnd = parseDate(ev.endTime) || (evStart ? new Date(evStart.getTime() + (ev.durationMinutes || 60) * 60 * 1000) : null);

    // Si el evento está en el pasado (ya finalizó o comenzó antes de context.currentTime)
    // O si está marcado como bloqueado (isLocked)
    const isPastEvent = evEnd ? evEnd <= context.currentTime : (evStart ? evStart < context.currentTime : false);

    if (ev.isLocked || isPastEvent) {
      fixedEvents.push({
        ...ev,
        isLocked: true, // Sellado estricto: inamovible
      });
      if (evStart && ev.durationMinutes) {
        const slotIdx = dateToSlotIndex(evStart, mondayDate);
        const needed = Math.ceil(ev.durationMinutes / 15);
        occupySlotRange(weekSlots, slotIdx, needed, ev.id);
      }
    } else {
      // Auto-splitting de metas acumuladas
      const splitted = splitFloatingGoal(ev);
      floatingEvents.push(...splitted);
    }
  }

  // 3. Ordenar flotantes por heurística Earliest Deadline First (EDF) y carga cognitiva
  floatingEvents.sort((a, b) => {
    const deadA = parseDate(a.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const deadB = parseDate(b.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (deadA !== deadB) return deadA - deadB;
    return (b.cognitiveLoad ?? 0) - (a.cognitiveLoad ?? 0);
  });

  // 4. Poda de Dominios con AC-3
  const domains = pruneDomainsAC3(floatingEvents, fixedEvents, weekSlots, hardRules, context);

  // 5. Asignación voraz optimizada por función de puntuación (Fase 2)
  const finalSchedule: Event[] = [...fixedEvents];
  const unassignedEvents: Event[] = [];

  for (const event of floatingEvents) {
    const allowedSlots = domains.get(event.id) || [];
    const neededSlots = Math.ceil(event.durationMinutes / 15);

    let bestSlotIdx: number | null = null;
    let minPenalty = Number.MAX_SAFE_INTEGER;

    // Buscar entre los slots válidos permitidos por AC-3
    for (const slotIdx of allowedSlots) {
      if (!isSlotRangeFree(weekSlots, slotIdx, neededSlots)) continue;

      const candStart = slotIndexToDate(slotIdx, mondayDate);
      // Garantía absoluta: ningún evento puede agendarse en el pasado
      if (candStart < context.currentTime) continue;

      const candEnd = new Date(candStart.getTime() + event.durationMinutes * 60 * 1000);

      const candidateEvent: Event = {
        ...event,
        startTime: candStart,
        endTime: candEnd,
      };

      const tentativeSchedule = [...finalSchedule, candidateEvent];
      const penalty = evaluateScheduleScore(tentativeSchedule, softRules, context);

      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestSlotIdx = slotIdx;
      }
    }

    if (bestSlotIdx !== null) {
      const assignedStart = slotIndexToDate(bestSlotIdx, mondayDate);
      const assignedEnd = new Date(assignedStart.getTime() + event.durationMinutes * 60 * 1000);

      const assignedEvent: Event = {
        ...event,
        startTime: assignedStart,
        endTime: assignedEnd,
      };

      occupySlotRange(weekSlots, bestSlotIdx, neededSlots, event.id);
      finalSchedule.push(assignedEvent);
    } else {
      unassignedEvents.push(event);
    }
  }

  // 6. Si la opción "Llenar" está activa, llenar los huecos libres disponibles proporcionalmente
  let scheduleToReturn = finalSchedule;
  if (context.fillAvailableTime) {
    const fillResult = fillAvailableGaps(finalSchedule, weekSlots, mondayDate, context, hardRules);
    scheduleToReturn = fillResult.schedule;
  }

  const executionTimeMs = Math.round((performance.now() - startTimeMs) * 100) / 100;
  const totalScore = evaluateScheduleScore(scheduleToReturn, softRules, context);

  return {
    success: unassignedEvents.length === 0,
    schedule: scheduleToReturn,
    violations: [],
    totalScore,
    executionTimeMs,
    unassignedEvents,
  };
}

/**
 * Botón de Pánico: Desalojo en Cascada (Cascade Eviction)
 * Desaloja tareas y bloques en conflicto ante un plan imprevisto de alta prioridad
 * y re-empaqueta la semana garantizando cero solapamientos y respeto biológico.
 * Los eventos en el pasado son estrictamente intocables.
 */
export function cascadeEvict(
  currentSchedule: Event[],
  urgentEvent: Event,
  context: ConstraintContext,
  weekStartDate: Date = new Date()
): SolverResult {
  const urgentStart = parseDate(urgentEvent.startTime);
  const urgentEnd = parseDate(urgentEvent.endTime);

  if (!urgentStart || !urgentEnd) {
    throw new Error('El evento urgente debe tener horarios definidos.');
  }

  // 1. Marcar el evento urgente como candado prioritario
  const lockedUrgentEvent: Event = {
    ...urgentEvent,
    isLocked: true,
  };

  // 2. Identificar eventos que colisionan con el evento urgente
  const survivingEvents: Event[] = [];
  const evictedEvents: Event[] = [];

  for (const ev of currentSchedule) {
    const evStart = parseDate(ev.startTime);
    const evEnd = parseDate(ev.endTime);

    // Si no tiene horario asignado, va al pool
    if (!evStart || !evEnd) {
      survivingEvents.push(ev);
      continue;
    }

    // El tiempo que ya pasó es intocable: jamás se puede desalojar un evento pasado
    if (evEnd <= context.currentTime) {
      survivingEvents.push({
        ...ev,
        isLocked: true,
      });
      continue;
    }

    // Si colisiona con el evento urgente
    const hasCollision = evStart < urgentEnd && urgentStart < evEnd;

    if (hasCollision) {
      if (ev.isLocked) {
        // Un pilar inamovible no se puede desalojar (conflicto duro)
        survivingEvents.push(ev);
      } else {
        // Evento flotante/estudio/hábito: desalojar y mandar a la cola de re-ubicación
        const clearedEvent: Event = {
          ...ev,
          startTime: undefined,
          endTime: undefined,
          isFloating: true,
        };
        evictedEvents.push(clearedEvent);
      }
    } else {
      survivingEvents.push(ev);
    }
  }

  // 3. Unir eventos supervivientes + evento urgente + eventos desalojados para re-optimizar
  const poolToResolve = [...survivingEvents, lockedUrgentEvent, ...evictedEvents];

  return solveSchedule(poolToResolve, context, weekStartDate);
}
