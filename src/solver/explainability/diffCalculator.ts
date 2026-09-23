import { Event } from '@/types/event';
import { ScheduleDiff, ScheduleDiffItem } from '../types';
import { generateParametricExplanation } from './constraintTrace';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * Calcula las diferencias exactas (Antes vs. Después) entre dos cronogramas
 */
export function calculateScheduleDiff(
  originalSchedule: Event[],
  newSchedule: Event[],
  executionTimeMs: number = 0,
  defaultCause: string = 'PANIC_EVICTION'
): ScheduleDiff {
  const originalMap = new Map<string, Event>();
  for (const ev of originalSchedule) {
    originalMap.set(ev.id, ev);
  }

  const items: ScheduleDiffItem[] = [];

  for (const newEv of newSchedule) {
    const origEv = originalMap.get(newEv.id);
    const newStart = parseDate(newEv.startTime);
    const newEnd = parseDate(newEv.endTime);

    if (!origEv) {
      // Evento nuevo agregado
      if (newStart && newEnd) {
        items.push({
          eventId: newEv.id,
          eventTitle: newEv.title,
          changeType: 'added',
          newStart,
          newEnd,
          causeCode: 'USER_ADDED',
          explanation: `• Se agregó "${newEv.title}" de ${newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} a ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        });
      }
    } else {
      // Evento preexistente: comprobar si cambió de horario
      const origStart = parseDate(origEv.startTime);
      const origEnd = parseDate(origEv.endTime);

      if (origStart?.getTime() !== newStart?.getTime() || origEnd?.getTime() !== newEnd?.getTime()) {
        const explanation = generateParametricExplanation(newEv, defaultCause, {
          originalStart: origStart || undefined,
          newStart: newStart || undefined,
          newEnd: newEnd || undefined,
        });

        items.push({
          eventId: newEv.id,
          eventTitle: newEv.title,
          changeType: 'moved',
          originalStart: origStart || undefined,
          originalEnd: origEnd || undefined,
          newStart: newStart || undefined,
          newEnd: newEnd || undefined,
          causeCode: defaultCause,
          explanation,
        });
      }
    }
  }

  const hasChanges = items.length > 0;
  const summary = hasChanges
    ? `Reoptimización completada: se adaptaron ${items.length} bloque(s) de tu agenda manteniendo todas tus metas y compromisos.`
    : 'Tu agenda ya se encuentra en su configuración óptima. No se requirieron cambios.';

  return {
    hasChanges,
    items,
    summary,
    executionTimeMs,
  };
}
