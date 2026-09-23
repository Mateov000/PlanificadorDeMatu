import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

function getDayDifference(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.abs(Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24)));
}

/**
 * HC-06: Lag Constraint Universal / Split Recovery (Desfase Temporal Inter-Sesión)
 * Mecanismo genérico para exigir una separación mínima de N días entre sesiones
 * de una misma actividad física o sub-rutinas anatómicas (ej. split muscular o días de descanso).
 */
export const hc06_splitLagRecoveryRule: HardConstraintRule = {
  id: 'HC-06',
  name: 'Descanso Mínimo Inter-Sesión (Lag Constraint)',
  description: 'Garantiza la distancia mínima de días requerida entre sesiones o variantes de entrenamiento para recuperación fisiológica.',
  enabled: true,

  validate: (candidate: Event[], _context: ConstraintContext): HardValidationResult => {
    // Filtrar eventos con requerimiento de descanso fisiológico
    const recoveryEvents = candidate.filter(
      (e) => e.startTime && e.endTime && ((e.recoveryDaysNeeded && e.recoveryDaysNeeded > 0) || e.splitVariant)
    );

    for (let i = 0; i < recoveryEvents.length; i++) {
      const a = recoveryEvents[i];
      const startA = parseDate(a.startTime);
      if (!startA) continue;

      for (let j = i + 1; j < recoveryEvents.length; j++) {
        const b = recoveryEvents[j];
        const startB = parseDate(b.startTime);
        if (!startB) continue;

        // Si son variantes del mismo grupo o comparten splitVariant
        const sameCategory = a.categoryId && b.categoryId && a.categoryId === b.categoryId;
        const hasSplits = a.splitVariant || b.splitVariant;

        if (sameCategory || hasSplits) {
          const requiredDays = Math.max(a.recoveryDaysNeeded ?? 1, b.recoveryDaysNeeded ?? 1);
          const daysApart = getDayDifference(startA, startB);

          if (daysApart < requiredDays) {
            return {
              satisfied: false,
              errorCode: 'HC-06_SPLIT_OVERLOAD',
              reason: `Descanso insuficiente: "${a.title}" y "${b.title}" están programados con solo ${daysApart} día(s) de diferencia, pero requieren un mínimo de ${requiredDays} día(s) para recuperación muscular.`,
              violatingEventIds: [a.id, b.id],
            };
          }
        }
      }
    }

    return { satisfied: true };
  },
};
