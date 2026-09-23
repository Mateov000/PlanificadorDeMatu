import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * SC-04: Punctuality Penalty (Graduación de Impuntualidad y Severidad)
 * Evalúa los arribos previstos según la tolerancia de cada evento.
 * Los eventos de nivel 2 (tolerancia 5-15 min) acumulan penalización cuadrática suave,
 * mientras que eventos sociales relajados no sufren penalización.
 */
export const sc04_punctualityPenaltyRule: SoftConstraintRule = {
  id: 'SC-04',
  name: 'Tolerancia y Penalización de Tardanzas',
  description: 'Aplica penalizaciones suaves y cuadráticas según la severidad de puntualidad configurada en cada compromiso.',
  category: 'logistics',
  defaultWeight: 0.9,
  enabled: true,

  evaluate: (candidate: Event[], context: ConstraintContext): number => {
    const { travelMatrix } = context;
    const sorted = [...candidate]
      .filter((e) => e.startTime && e.endTime && !e.isAllDay)
      .sort((a, b) => (parseDate(a.startTime)?.getTime() ?? 0) - (parseDate(b.startTime)?.getTime() ?? 0));

    let totalPenalty = 0;
    let evaluatedCount = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const prev = sorted[i];
      const next = sorted[i + 1];

      const prevEnd = parseDate(prev.endTime);
      const nextStart = parseDate(next.startTime);
      if (!prevEnd || !nextStart) continue;

      const locA = prev.location || 'Casa';
      const locB = next.location || 'Casa';
      const travelMin = travelMatrix.getTravelMinutes(locA, locB);
      const availableGapMin = (nextStart.getTime() - prevEnd.getTime()) / (60 * 1000);

      // Si el tiempo libre es menor que el de viaje pero el evento tolera tardanza
      if (availableGapMin < travelMin) {
        const latenessMinutes = travelMin - availableGapMin;
        const maxAllowed = next.maxLatenessMinutes ?? 0;

        if (maxAllowed > 0 && latenessMinutes <= maxAllowed) {
          evaluatedCount++;
          // Penalización cuadrática normalizada por el peso del evento
          const severityWeight = next.latenessPenaltyWeight ?? 1.0;
          const ratio = latenessMinutes / maxAllowed;
          totalPenalty += Math.min(1.0, ratio * ratio * severityWeight);
        }
      }
    }

    return evaluatedCount > 0 ? Math.min(1.0, totalPenalty / evaluatedCount) : 0;
  },
};
