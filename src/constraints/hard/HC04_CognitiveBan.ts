import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * HC-04: Universal Cognitive Ban Window
 * Veta tareas de alta demanda mental (cognitiveLoad >= 2 o categoría estudio pesado)
 * en dos ventanas críticas de fatiga/inercia neurofisiológica:
 * 1. Aterrizaje inmediato post-actividad disruptiva o de alto desgaste psicofísico.
 * 2. Inercia post-despertar tras sueño desfasado por nocturnidad.
 */
export const hc04_cognitiveBanRule: HardConstraintRule = {
  id: 'HC-04',
  name: 'Veto Cognitivo Post-Disrupción',
  description: 'Impide bloques de estudio exigente durante los periodos de inercia o descompresión post-actividad.',
  enabled: true,

  validate: (candidate: Event[], context: ConstraintContext): HardValidationResult => {
    const { params, travelMatrix } = context;
    const landingMs = (params.cognitiveLandingBufferMinutes ?? 60) * 60 * 1000;
    const wakeInertiaMs = (params.wakeInertiaBufferMinutes ?? 90) * 60 * 1000;
    const sleepMs = (params.targetSleepMinutes ?? 480) * 60 * 1000;
    const nightThresholdHour = params.nightThresholdHour ?? 23.5;

    const timedEvents = candidate.filter((e) => e.startTime && e.endTime && !e.isAllDay);

    for (const event of timedEvents) {
      // Los bloques de sueño no generan veto cognitivo
      if (event.categoryId === 'cat-sleep' || event.id.startsWith('sleep-')) continue;

      const isHighDrain =
        event.isScheduleDisruptor ||
        event.energyDrain === 'high' ||
        (event.cognitiveLoad >= 2 && event.durationMinutes >= 180);

      const end = parseDate(event.endTime);
      if (!end) continue;

      const hourFraction = end.getHours() + end.getMinutes() / 60;
      const isLateNight = hourFraction >= nightThresholdHour || hourFraction < 6.0;

      if (!isHighDrain && !isLateNight) continue;

      const travelToHomeMs = travelMatrix.getTravelMinutes(event.location || 'Casa', 'Casa') * 60 * 1000;
      const arrivalAtHome = new Date(end.getTime() + travelToHomeMs);

      // Zona 1: Buffer de aterrizaje inmediato post-actividad
      const landingEnd = new Date(arrivalAtHome.getTime() + landingMs);

      // Zona 2: Inercia post-despertar (solo si hubo trasnoche)
      const wakeTime = isLateNight ? new Date(arrivalAtHome.getTime() + sleepMs) : null;
      const wakeInertiaEnd = wakeTime ? new Date(wakeTime.getTime() + wakeInertiaMs) : null;

      for (const target of timedEvents) {
        if (target.id === event.id) continue;
        if (target.cognitiveLoad < 2) continue; // Solo veta tareas con carga cognitiva moderada o alta

        const targetStart = parseDate(target.startTime);
        const targetEnd = parseDate(target.endTime);
        if (!targetStart || !targetEnd) continue;

        // Verificar colisión con Zona 1 (Aterrizaje)
        if (targetStart < landingEnd && targetEnd > arrivalAtHome) {
          return {
            satisfied: false,
            errorCode: 'HC-04_LANDING_BAN',
            reason: `Veto cognitivo: No es viable realizar "${target.title}" (alta carga mental) inmediatamente tras "${event.title}". Requiere al menos ${params.cognitiveLandingBufferMinutes} min de descompresión.`,
            violatingEventIds: [event.id, target.id],
          };
        }

        // Verificar colisión con Zona 2 (Inercia post-despertar)
        if (wakeTime && wakeInertiaEnd && targetStart < wakeInertiaEnd && targetEnd > wakeTime) {
          return {
            satisfied: false,
            errorCode: 'HC-04_WAKE_INERTIA_BAN',
            reason: `Inercia de sueño: "${target.title}" coincide con la ventana de ${params.wakeInertiaBufferMinutes} min post-despertar tras trasnochar en "${event.title}".`,
            violatingEventIds: [event.id, target.id],
          };
        }
      }
    }

    return { satisfied: true };
  },
};
