import { Event } from '@/types/event';
import { ConstraintContext } from '@/constraints/contracts';
import { constraintRegistry } from '@/constraints/registry';
import { SolverResult } from '../types';
import {
  initializeWeekTimeSlots,
  dateToSlotIndex,
  occupySlotRange,
  isSlotRangeFree,
  slotIndexToDate,
  TimeSlot,
} from './timeDomain';
import { pruneDomainsAC3 } from './ac3';
import { evaluateScheduleScore } from './scoreEvaluator';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Motor Central de Auto-Scheduling (Constraint Solver Determinista)
 * Ejecuta Fase 1 (Hard Constraints AC-3) y Fase 2 (Scoring Soft Constraints)
 */
export function solveSchedule(
  allEvents: Event[],
  context: ConstraintContext,
  weekStartDate: Date = new Date()
): SolverResult {
  const startTimeMs = performance.now();
  const hardRules = constraintRegistry.getHardRules();
  const softRules = constraintRegistry.getSoftRules();

  // 1. Inicializar slots discretos de la semana
  const weekSlots = initializeWeekTimeSlots(weekStartDate);

  // 2. Separar eventos fijos (Hard Pillars o ya asignados inamovibles) de los flotantes
  const fixedEvents: Event[] = [];
  const floatingEvents: Event[] = [];

  for (const ev of allEvents) {
    // Si tiene horario asignado y está bloqueado o en el pasado
    const evStart = parseDate(ev.startTime);
    if (ev.isLocked || (evStart && evStart < context.currentTime)) {
      fixedEvents.push(ev);
      if (evStart && ev.durationMinutes) {
        const slotIdx = dateToSlotIndex(evStart, weekStartDate);
        const needed = Math.ceil(ev.durationMinutes / 15);
        occupySlotRange(weekSlots, slotIdx, needed, ev.id);
      }
    } else {
      floatingEvents.push(ev);
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

      const candStart = slotIndexToDate(slotIdx, weekStartDate);
      const candEnd = new Date(candStart.getTime() + event.durationMinutes * 60 * 1000);

      const candidateEvent: Event = {
        ...event,
        startTime: candStart,
        endTime: candEnd,
      };

      const testSchedule = [...finalSchedule, candidateEvent];

      // Verificación estricta final contra Hard Constraints
      let isHardValid = true;
      for (const rule of hardRules) {
        const res = rule.validate(testSchedule, context);
        if (!res.satisfied) {
          isHardValid = false;
          break;
        }
      }

      if (!isHardValid) continue;

      // Evaluar Soft Constraints
      const penalty = evaluateScheduleScore(testSchedule, softRules, context);
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestSlotIdx = slotIdx;
      }
    }

    if (bestSlotIdx !== null) {
      const assignedStart = slotIndexToDate(bestSlotIdx, weekStartDate);
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

  const executionTimeMs = Math.round((performance.now() - startTimeMs) * 100) / 100;
  const totalScore = evaluateScheduleScore(finalSchedule, softRules, context);

  return {
    success: unassignedEvents.length === 0,
    schedule: finalSchedule,
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
    if (ev.id === urgentEvent.id) continue;

    const evStart = parseDate(ev.startTime);
    const evEnd = parseDate(ev.endTime);

    if (!evStart || !evEnd || ev.isAllDay) {
      survivingEvents.push(ev);
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
