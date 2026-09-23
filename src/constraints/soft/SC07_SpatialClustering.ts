import { Event } from '@/types/event';
import { ConstraintContext, SoftConstraintRule } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * SC-07: Spatial Clustering (Encadenamiento Espacial Inteligente)
 * Premia el encadenamiento geográfico de actividades en sedes contiguas (ej. Facultad -> Gimnasio -> Casa)
 * y penaliza los rebotes innecesarios de ida y vuelta a Casa en lapsos breves.
 */
export const sc07_spatialClusteringRule: SoftConstraintRule = {
  id: 'SC-07',
  name: 'Encadenamiento Espacial (Clustering)',
  description: 'Favorece encadenar actividades fuera de casa reduciendo tiempos muertos y viajes redundantes.',
  category: 'logistics',
  defaultWeight: 1.0,
  enabled: true,

  evaluate: (candidate: Event[], context: ConstraintContext): number => {
    const { travelMatrix } = context;

    const sorted = [...candidate]
      .filter((e) => e.startTime && e.endTime && !e.isAllDay)
      .sort((a, b) => {
        const timeA = parseDate(a.startTime)?.getTime() ?? 0;
        const timeB = parseDate(b.startTime)?.getTime() ?? 0;
        return timeA - timeB;
      });

    if (sorted.length < 2) return 0;

    let totalExcessTravelPenalty = 0;
    let externalTransitions = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEnd = parseDate(current.endTime);
      const nextStart = parseDate(next.startTime);
      if (!currentEnd || !nextStart) continue;

      const gapMs = nextStart.getTime() - currentEnd.getTime();
      // Si el intervalo es menor a 4 horas (mismo bloque del día)
      if (gapMs > 0 && gapMs <= 4 * 60 * 60 * 1000) {
        const locA = current.location || 'Casa';
        const locB = next.location || 'Casa';

        const isAExternal = locA.toLowerCase() !== 'casa';
        const isBExternal = locB.toLowerCase() !== 'casa';

        if (isAExternal && isBExternal) {
          externalTransitions++;
          const directTravel = travelMatrix.getTravelMinutes(locA, locB);
          const reboundTravel = travelMatrix.getTravelMinutes(locA, 'Casa') + travelMatrix.getTravelMinutes('Casa', locB);

          // Si el viaje directo ahorra tiempo comparado con volver a casa
          if (directTravel < reboundTravel) {
            // Si el hueco entre ambas actividades es corto (< 90m), premia encadenamiento directo
            const gapMin = gapMs / (60 * 1000);
            if (gapMin <= 90) {
              // Encadenamiento óptimo: 0 penalización
            } else {
              // Hueco largo que obliga a esperar o volver a casa
              totalExcessTravelPenalty += 0.3;
            }
          }
        } else if (isAExternal && !isBExternal && i + 2 < sorted.length) {
          // Detectar patrón rebote: Externa -> Casa (breve) -> Externa
          const afterNext = sorted[i + 2];
          const locC = afterNext.location || 'Casa';
          const isCExternal = locC.toLowerCase() !== 'casa';

          const afterNextStart = parseDate(afterNext.startTime);
          if (isCExternal && afterNextStart) {
            const stayAtHomeMin = (afterNextStart.getTime() - currentEnd.getTime()) / (60 * 1000);
            if (stayAtHomeMin <= 90) {
              // Rebote innecesario: fue a casa por menos de 90 minutos para salir otra vez
              totalExcessTravelPenalty += 0.6;
              externalTransitions++;
            }
          }
        }
      }
    }

    if (externalTransitions === 0) return 0;
    return Math.min(1.0, totalExcessTravelPenalty / externalTransitions);
  },

  explainScore: (candidate: Event[], _context: ConstraintContext): string | null => {
    return 'Se evaluó la eficiencia del recorrido urbano para minimizar viajes redundantes.';
  },
};
