import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * HC-01: No Overlap Rule
 * Dos eventos activos con horario específico no pueden solaparse en el tiempo:
 * Condición de solapamiento: (Start_A < End_B) && (Start_B < End_A)
 */
export const hc01_noOverlapRule: HardConstraintRule = {
  id: 'HC-01',
  name: 'Solapamiento Cero',
  description: 'Garantiza matemáticamente que ningún par de compromisos o tareas colisionen en el tiempo.',
  enabled: true,

  validate: (candidate: Event[], _context: ConstraintContext): HardValidationResult => {
    // Filtrar solo eventos con horarios asignados y que no sean marcadores all-day
    const timedEvents = candidate.filter((e) => e.startTime && e.endTime && !e.isAllDay);

    for (let i = 0; i < timedEvents.length; i++) {
      const a = timedEvents[i];
      const startA = parseDate(a.startTime);
      const endA = parseDate(a.endTime);

      if (!startA || !endA) continue;

      for (let j = i + 1; j < timedEvents.length; j++) {
        const b = timedEvents[j];
        const startB = parseDate(b.startTime);
        const endB = parseDate(b.endTime);

        if (!startB || !endB) continue;

        // Condición canónica de colisión temporal
        if (startA < endB && startB < endA) {
          return {
            satisfied: false,
            errorCode: 'HC-01_OVERLAP',
            reason: `Conflicto de horario: "${a.title}" colisiona con "${b.title}".`,
            violatingEventIds: [a.id, b.id],
          };
        }
      }
    }

    return { satisfied: true };
  },
};
