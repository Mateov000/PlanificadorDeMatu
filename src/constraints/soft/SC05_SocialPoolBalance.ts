import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

/**
 * SC-05: Social Pool Balance (Bolsa Social Fungible)
 * Evalúa la cuota acumulada de horas de esparcimiento social semanal frente a la meta orientativa
 * sin imponer rigidez ni castigo por persona individual.
 */
export const sc05_socialPoolBalanceRule: SoftConstraintRule = {
  id: 'SC-05',
  name: 'Bolsa Social Fungible',
  description: 'Promueve el equilibrio en las horas de conexión social semanal frente al objetivo orientativo configurado.',
  category: 'social',
  defaultWeight: 1.0,
  enabled: true,

  evaluate: (candidate: Event[], context: ConstraintContext): number => {
    const { params } = context;
    const targetHours = params.weeklySocialTargetHours ?? 6.0;

    const socialEvents = candidate.filter(
      (e) =>
        e.category?.archetype === 'social_flexible' ||
        e.categoryId === 'cat-social' ||
        e.categoryId?.includes('social')
    );
    const totalSocialMinutes = socialEvents.reduce((acc, e) => acc + e.durationMinutes, 0);
    const totalSocialHours = totalSocialMinutes / 60;

    // Si no hubo tiempo social o quedó muy por debajo de la meta semanal
    if (totalSocialHours < targetHours) {
      const deficit = targetHours - totalSocialHours;
      return Math.min(1.0, deficit / targetHours);
    }

    // Si superó la meta no hay penalización severa, pero si se triplica genera leve alerta de equilibrio
    if (totalSocialHours > targetHours * 2.5) {
      return 0.3;
    }

    return 0; // Balance óptimo
  },
};
