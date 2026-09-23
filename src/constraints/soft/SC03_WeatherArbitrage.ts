import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * SC-03: Weather Arbitrage (Arbitraje Meteorológico Costero de Mar del Plata)
 * Premia el uso estratégico de días de temporal/viento SE/lluvia para estudio concentrado en casa
 * y penaliza planes al aire libre durante mal tiempo, liberando días soleados para disfrute exterior.
 */
export const sc03_weatherArbitrageRule: SoftConstraintRule = {
  id: 'SC-03',
  name: 'Arbitraje Meteorológico (Mardel)',
  description: 'Aprovecha días de lluvia y viento SE para estudio bajo techo y protege días soleados para el aire libre.',
  category: 'logistics',
  defaultWeight: 1.1,
  enabled: true,

  evaluate: (candidate: Event[], context: ConstraintContext): number => {
    const { weather } = context;
    if (!weather || weather.length === 0) return 0;

    let penalty = 0;
    const outdoorEvents = candidate.filter(
      (e) => e.location !== 'Casa' && e.category?.archetype === 'social_flexible' && e.startTime
    );

    for (const event of outdoorEvents) {
      const start = parseDate(event.startTime);
      if (!start) continue;

      // Buscar pronóstico para la hora del evento
      const forecast = weather.find((w) => {
        const fTime = new Date(w.timestamp);
        return (
          fTime.getFullYear() === start.getFullYear() &&
          fTime.getMonth() === start.getMonth() &&
          fTime.getDate() === start.getDate() &&
          fTime.getHours() === start.getHours()
        );
      });

      if (forecast) {
        // Si hay temporal del Sudeste o confort muy bajo (< 40)
        if (forecast.isSoutheastStorm || forecast.comfortScore < 40) {
          penalty += 0.8; // Penalizar fuertemente plan outdoor con temporal
        }
      }
    }

    return outdoorEvents.length > 0 ? Math.min(1.0, penalty / outdoorEvents.length) : 0;
  },
};
