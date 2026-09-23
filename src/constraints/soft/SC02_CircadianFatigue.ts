import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * SC-02: Circadian Fatigue (Protección de Picos Cognitivos y Fatiga Acumulada)
 * Penaliza agendar estudio pesado (cognitiveLoad >= 2) en franjas circadianas desfavorables
 * (tardes muy tardías post-trabajo) o tras jornadas consecutivas de alta nocturnidad.
 */
export const sc02_circadianFatigueRule: SoftConstraintRule = {
  id: 'SC-02',
  name: 'Alineación Circadiana y Fatiga',
  description: 'Ubica el estudio pesado en momentos de mente lúcida y penaliza la sobrecarga acumulada.',
  category: 'wellness',
  defaultWeight: 1.0,
  enabled: true,

  evaluate: (candidate: Event[], _context: ConstraintContext): number => {
    const studyEvents = candidate.filter((e) => e.cognitiveLoad >= 2 && e.startTime);
    if (studyEvents.length === 0) return 0;

    let fatiguePenaltySum = 0;

    for (const event of studyEvents) {
      const start = parseDate(event.startTime);
      if (!start) continue;

      const hour = start.getHours() + start.getMinutes() / 60;

      // Valle circadiano post-almuerzo (14:00 - 16:00) o nocturno (> 22:00)
      if (hour >= 14 && hour <= 16) {
        fatiguePenaltySum += 0.3;
      } else if (hour >= 22) {
        fatiguePenaltySum += 0.8;
      } else if (hour >= 9 && hour <= 12.5) {
        // Horario óptimo matutino: bonificación (reduce penalización)
        fatiguePenaltySum = Math.max(0, fatiguePenaltySum - 0.2);
      }
    }

    return Math.min(1.0, fatiguePenaltySum / studyEvents.length);
  },
};
