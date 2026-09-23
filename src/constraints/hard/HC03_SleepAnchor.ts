import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * HC-03: Late Night Sleep Anchor (Ventana de Sueño Flotante Universal)
 * Si una actividad concluye en horario nocturno o de madrugada (o está marcada como disruptor),
 * proyecta una ventana de sueño continuo (por defecto 8 horas / 480 min) a partir de la hora de llegada a Casa.
 * Ninguna tarea, hábito o evento puede invadir esa franja de recuperación biológica.
 */
export const hc03_sleepAnchorRule: HardConstraintRule = {
  id: 'HC-03',
  name: 'Anclaje de Sueño Flotante',
  description: 'Garantiza 8 horas de sueño continuo a partir de la llegada real a casa tras actividades nocturnas.',
  enabled: true,

  validate: (candidate: Event[], context: ConstraintContext): HardValidationResult => {
    const { params, travelMatrix } = context;
    const targetSleepMs = params.targetSleepMinutes * 60 * 1000;
    const nightThresholdHour = params.nightThresholdHour ?? 23.5;

    const timedEvents = candidate.filter((e) => e.startTime && e.endTime && !e.isAllDay);

    for (const event of timedEvents) {
      const end = parseDate(event.endTime);
      if (!end) continue;

      const hourFraction = end.getHours() + end.getMinutes() / 60;
      // Es actividad nocturna si termina después del umbral o en la madrugada (< 6:00 AM) o tiene el flag disruptor
      const isNightDisruption =
        event.isScheduleDisruptor || hourFraction >= nightThresholdHour || hourFraction < 6.0;

      if (!isNightDisruption) continue;

      // Calcular arribo real a casa sumando tiempo de traslado
      const travelMinutes = travelMatrix.getTravelMinutes(event.location || 'Casa', 'Casa');
      const arrivalAtHomeTime = new Date(end.getTime() + travelMinutes * 60 * 1000);
      const sleepEndTime = new Date(arrivalAtHomeTime.getTime() + targetSleepMs);

      // Verificar que ningún otro evento comience antes de terminar la ventana de sueño
      for (const other of timedEvents) {
        if (other.id === event.id) continue;
        const otherStart = parseDate(other.startTime);
        const otherEnd = parseDate(other.endTime);
        if (!otherStart || !otherEnd) continue;

        // Si otro evento invade la ventana [arrivalAtHomeTime, sleepEndTime]
        if (otherStart < sleepEndTime && otherEnd > arrivalAtHomeTime) {
          const sleepHours = (params.targetSleepMinutes / 60).toFixed(1);
          const formattedEnd = arrivalAtHomeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const formattedWake = sleepEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            satisfied: false,
            errorCode: 'HC-03_SLEEP',
            reason: `Violación biológica: "${other.title}" interrumpe tus ${sleepHours}h de sueño necesarias (${formattedEnd} a ${formattedWake}) tras finalizar "${event.title}".`,
            violatingEventIds: [event.id, other.id],
            suggestedOffsetMinutes: Math.ceil((sleepEndTime.getTime() - otherStart.getTime()) / (60 * 1000)),
          };
        }
      }
    }

    return { satisfied: true };
  },
};
