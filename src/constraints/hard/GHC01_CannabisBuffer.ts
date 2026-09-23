import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * GHC-01: Graduated Hard Constraint - Buffer de Convivencia y Descenso Familiar
 * Exige un piso mínimo absoluto de tiempo (por defecto 120 min / 2 horas) antes de volver a Casa
 * tras eventos con consumo recreativo (cannabisConsumed: true).
 */
export const ghc01_cannabisBufferRule: HardConstraintRule = {
  id: 'GHC-01',
  name: 'Buffer de Descenso y Convivencia Familiar',
  description: 'Garantiza una ventana mínima sobria de recuperación antes de regresar al hogar familiar.',
  enabled: true,

  validate: (candidate: Event[], context: ConstraintContext): HardValidationResult => {
    const { params } = context;
    const minBufferMinutes = params.cannabisBufferMinMinutes ?? 120;
    const minBufferMs = minBufferMinutes * 60 * 1000;

    const timedEvents = candidate.filter((e) => e.startTime && e.endTime && !e.isAllDay);

    for (const event of timedEvents) {
      if (!event.cannabisConsumed) continue;

      const eventStart = parseDate(event.startTime);
      const eventEnd = parseDate(event.endTime);
      if (!eventStart || !eventEnd) continue;

      // Calcular la duración desde el inicio de la salida social hasta que termina
      const socialDurationMs = eventEnd.getTime() - eventStart.getTime();

      // Si el plan completo es más corto que el piso mínimo para regresar a casa
      if (socialDurationMs < minBufferMs) {
        const hoursPassed = (socialDurationMs / (1000 * 60 * 60)).toFixed(1);
        const hoursRequired = (minBufferMinutes / 60).toFixed(1);

        return {
          satisfied: false,
          errorCode: 'GHC-01_CANNABIS_BUFFER',
          reason: `Buffer familiar insuficiente: Regresar a casa tras solo ${hoursPassed}h en "${event.title}" no cumple con el piso mínimo de ${hoursRequired}h sobrias de recuperación acordado.`,
          violatingEventIds: [event.id],
          suggestedOffsetMinutes: Math.ceil((minBufferMs - socialDurationMs) / (60 * 1000)),
        };
      }
    }

    return { satisfied: true };
  },
};
