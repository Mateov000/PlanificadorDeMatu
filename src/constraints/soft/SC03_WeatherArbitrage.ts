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
      (e) =>
        e.location !== 'Casa' &&
        (e.category?.archetype === 'social_flexible' ||
          e.categoryId === 'cat-social' ||
          e.categoryId?.includes('social')) &&
        e.startTime
    );
    const studyEvents = candidate.filter(
      (e) => (e.location === 'Casa' || !e.location) && e.cognitiveLoad >= 2 && e.startTime && !e.isLocked
    );

    const findForecast = (start: Date) => {
      return weather.find((w) => {
        const fTime = new Date(w.timestamp);
        return (
          fTime.getFullYear() === start.getFullYear() &&
          fTime.getMonth() === start.getMonth() &&
          fTime.getDate() === start.getDate() &&
          fTime.getHours() === start.getHours()
        );
      }) || weather.find((w) => {
        const fTime = new Date(w.timestamp);
        return Math.abs(fTime.getTime() - start.getTime()) < 2 * 3600 * 1000;
      });
    };

    // 1. Evaluar planes outdoor con mal clima (penalización severa)
    for (const event of outdoorEvents) {
      const start = parseDate(event.startTime);
      if (!start) continue;

      const forecast = findForecast(start);

      if (forecast) {
        if (forecast.isSoutheastStorm || forecast.comfortScore < 40) {
          penalty += 0.8;
        } else if (forecast.comfortScore >= 70) {
          // Clima costero excelente: bonificación (reduce penalización)
          penalty = Math.max(0, penalty - 0.2);
        }
      }
    }

    // 2. Arbitraje de estudio: incentivar estudio durante temporal y desincentivar en días dorados (> 75)
    for (const event of studyEvents) {
      const start = parseDate(event.startTime);
      if (!start) continue;

      const forecast = findForecast(start);

      if (forecast) {
        if (forecast.comfortScore > 75) {
          // Penalizar estudiar adentro en momento de clima costero óptimo
          penalty += 0.4;
        } else if (forecast.isSoutheastStorm || forecast.comfortScore < 40) {
          // Temporal / frío marítimo: aprovechamiento perfecto para concentrarse adentro
          penalty = Math.max(0, penalty - 0.2);
        }
      }
    }

    const totalAssessed = outdoorEvents.length + studyEvents.length;
    return totalAssessed > 0 ? Math.min(1.0, penalty / totalAssessed) : 0;
  },

  explainScore: (candidate: Event[], context: ConstraintContext): string | null => {
    const { weather } = context;
    if (!weather || weather.length === 0) return null;

    const badWeatherStudy = candidate.filter((e) => {
      if (e.cognitiveLoad < 2 || !e.startTime) return false;
      const start = parseDate(e.startTime);
      if (!start) return false;
      const f = weather.find((w) => new Date(w.timestamp).getHours() === start.getHours() && new Date(w.timestamp).getDate() === start.getDate());
      return f && (f.isSoutheastStorm || f.comfortScore < 40);
    });

    if (badWeatherStudy.length > 0) {
      return `Se concentraron ${badWeatherStudy.length} bloque(s) de estudio bajo techo durante ventanas de temporal/mal clima, liberando días de buen tiempo.`;
    }
    return null;
  },
};
