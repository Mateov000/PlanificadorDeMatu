import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule, SoftRuleCategory } from '@/constraints/contracts';

/**
 * Función de Evaluación Aritmética Transparente (Fase 2 del Solver)
 * Desempata entre alternativas válidas evaluando las Soft Constraints activas
 * ponderadas por los Meta-Sliders del usuario.
 */
export function evaluateScheduleScore(
  candidate: Event[],
  softRules: SoftConstraintRule[],
  context: ConstraintContext
): number {
  let totalPenalty = 0;

  for (const rule of softRules) {
    if (!rule.enabled) continue;

    const rawPenalty = rule.evaluate(candidate, context); // 0.0 a 1.0

    // Obtener multiplicador según categoría del Meta-Slider
    let categoryMultiplier = 1.0;
    switch (rule.category) {
      case 'academic':
        categoryMultiplier = context.metaSliders.academic;
        break;
      case 'social':
        categoryMultiplier = context.metaSliders.social;
        break;
      case 'wellness':
        categoryMultiplier = context.metaSliders.wellness;
        break;
      case 'logistics':
        categoryMultiplier = 1.0;
        break;
    }

    const effectiveWeight = rule.defaultWeight * categoryMultiplier;
    totalPenalty += rawPenalty * effectiveWeight;
  }

  return totalPenalty;
}
