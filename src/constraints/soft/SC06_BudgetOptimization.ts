import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

/**
 * SC-06: Budget Optimization (Optimización Presupuestaria en ARS)
 * Controla que el costo estimado de las salidas y planes de la semana
 * no sobrepase el presupuesto configurado en pesos argentinos (ARS).
 */
export const sc06_budgetOptimizationRule: SoftConstraintRule = {
  id: 'SC-06',
  name: 'Presupuesto Semanal de Ocio (ARS)',
  description: 'Favorece salidas y juntadas acordes al presupuesto semanal en pesos argentinos configurado.',
  category: 'social',
  defaultWeight: 1.0,
  enabled: true,

  evaluate: (candidate: Event[], context: ConstraintContext): number => {
    const { params } = context;
    const weeklyBudget = params.weeklyBudgetArs ?? 50000;

    const totalCost = candidate.reduce((acc, e) => acc + (e.estimatedCostArs ?? 0), 0);

    if (totalCost <= weeklyBudget) {
      return 0; // Dentro del presupuesto
    }

    // Exceso de presupuesto genera penalización creciente
    const excess = totalCost - weeklyBudget;
    return Math.min(1.0, excess / weeklyBudget);
  },
};
