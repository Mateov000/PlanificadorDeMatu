import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

/**
 * SC-01: Study Focal Blocks (Bloques de Concentración Continua)
 * Premia bloques de estudio universitarios de duración óptima (90 a 120 min)
 * y penaliza la fragmentación excesiva (< 90 min) o la saturación mental (> 180 min).
 */
export const sc01_studyFocalBlocksRule: SoftConstraintRule = {
  id: 'SC-01',
  name: 'Bloques de Foco Continuo',
  description: 'Favorece bloques de estudio concentrado (90 a 120 min) evitando la fragmentación ineficiente.',
  category: 'academic',
  defaultWeight: 1.2,
  enabled: true,

  evaluate: (candidate: Event[], _context: ConstraintContext): number => {
    const studyEvents = candidate.filter((e) => e.cognitiveLoad >= 2);
    if (studyEvents.length === 0) return 0;

    let penaltySum = 0;

    for (const event of studyEvents) {
      const duration = event.durationMinutes;
      const minBlock = event.minBlockMinutes ?? 90;
      const maxBlock = event.maxBlockMinutes ?? 180;

      if (duration < minBlock) {
        // Penalización proporcional a cuánto falta para el bloque mínimo
        penaltySum += (minBlock - duration) / minBlock;
      } else if (duration > maxBlock) {
        // Penalización por saturación mental excesiva
        penaltySum += (duration - maxBlock) / 60;
      }
    }

    return Math.min(1.0, penaltySum / studyEvents.length);
  },

  explainScore: (candidate: Event[], _context: ConstraintContext): string | null => {
    const fragmented = candidate.filter((e) => e.cognitiveLoad >= 2 && e.durationMinutes < (e.minBlockMinutes ?? 90));
    if (fragmented.length > 0) {
      return `Se detectaron ${fragmented.length} bloque(s) de estudio con duración menor a la cuota mínima de foco continuo.`;
    }
    return null;
  },
};
