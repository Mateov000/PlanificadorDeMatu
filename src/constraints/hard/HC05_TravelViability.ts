import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * HC-05: Travel Viability (Continuidad Espacial y Tiempos Reales de Traslado)
 * Evalúa pares consecutivos de eventos. Si ocurren en ubicaciones físicas diferentes,
 * exige que el tiempo intermedio libre sea suficiente para realizar el viaje según la matriz de transporte.
 */
export const hc05_travelViabilityRule: HardConstraintRule = {
  id: 'HC-05',
  name: 'Viabilidad de Traslados',
  description: 'Garantiza que haya tiempo suficiente de viaje entre actividades en diferentes ubicaciones físicas.',
  enabled: true,

  validate: (candidate: Event[], context: ConstraintContext): HardValidationResult => {
    const { travelMatrix, params } = context;
    const safetyMarginMinutes = params.travelSafetyMarginMinutes ?? 10;

    // Ordenar cronológicamente eventos con horarios válidos
    const sorted = [...candidate]
      .filter((e) => e.startTime && e.endTime && !e.isAllDay)
      .sort((a, b) => {
        const timeA = parseDate(a.startTime)?.getTime() ?? 0;
        const timeB = parseDate(b.startTime)?.getTime() ?? 0;
        return timeA - timeB;
      });

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEnd = parseDate(current.endTime);
      const nextStart = parseDate(next.startTime);
      if (!currentEnd || !nextStart) continue;

      // Si no están el mismo día o hay más de 8 horas de diferencia, no es un empalme directo
      const diffMs = nextStart.getTime() - currentEnd.getTime();
      if (diffMs < 0 || diffMs > 8 * 60 * 60 * 1000) continue;

      const locA = current.location || 'Casa';
      const locB = next.location || 'Casa';

      if (locA.toLowerCase() === locB.toLowerCase()) continue;

      const travelTimeMin = travelMatrix.getTravelMinutes(locA, locB);
      const availableGapMin = diffMs / (60 * 1000);

      // Si el hueco disponible es menor al tiempo de viaje
      if (availableGapMin < travelTimeMin) {
        const deficitMin = travelTimeMin - availableGapMin;
        return {
          satisfied: false,
          errorCode: 'HC-05_TRAVEL_IMPOSSIBLE',
          reason: `Inviabilidad de traslado: Ir de "${locA}" (${current.title}) a "${locB}" (${next.title}) demora ${travelTimeMin} min, pero solo hay ${Math.round(availableGapMin)} min libres (faltan ${Math.round(deficitMin)} min).`,
          violatingEventIds: [current.id, next.id],
          suggestedOffsetMinutes: Math.ceil(deficitMin + safetyMarginMinutes),
        };
      }
    }

    return { satisfied: true };
  },
};
