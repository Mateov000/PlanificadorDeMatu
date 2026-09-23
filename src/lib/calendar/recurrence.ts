import { Event, RecurrenceRule, RecurrenceFrequency } from '@/types/event';

/**
 * Genera las ocurrencias futuras de un evento según su regla de periodicidad personalizable
 * @param baseEvent Evento raíz o base configurado por el usuario
 * @param rule Regla de recurrencia (frecuencia, intervalo, días de la semana, finalización)
 * @param defaultMaxOccurrences Límite por defecto si no se especifica count ni until (8 ocurrencias)
 */
export function generateRecurringInstances(
  baseEvent: Event,
  rule: RecurrenceRule,
  defaultMaxOccurrences: number = 8
): Event[] {
  if (!rule || !rule.frequency || !baseEvent.startTime) {
    return [];
  }

  const instances: Event[] = [];
  const startOriginal = typeof baseEvent.startTime === 'string'
    ? new Date(baseEvent.startTime)
    : new Date(baseEvent.startTime.getTime());

  const endOriginal = baseEvent.endTime
    ? (typeof baseEvent.endTime === 'string' ? new Date(baseEvent.endTime) : new Date(baseEvent.endTime.getTime()))
    : new Date(startOriginal.getTime() + (baseEvent.durationMinutes || 60) * 60 * 1000);

  const durationMs = endOriginal.getTime() - startOriginal.getTime();
  const interval = Math.max(1, rule.interval || 1);
  // En estándares de calendario (RFC 5545), count representa el número total de ocurrencias de la serie.
  // Como baseEvent ya es la 1ra ocurrencia, generamos como máximo (rule.count - 1) instancias derivadas.
  const targetInstancesLimit = rule.count !== undefined
    ? Math.max(0, rule.count - 1)
    : defaultMaxOccurrences;

  if (targetInstancesLimit === 0) {
    return [];
  }

  const untilDate = rule.until ? new Date(rule.until) : null;
  const baseParentId = baseEvent.recurrenceParentId || baseEvent.id;

  // Días de la semana seleccionados (1 = Lunes, 7 = Domingo)
  // Si no se especificaron días en periodicidad semanal, tomar el día de la semana del evento base
  const baseDayOfWeek = startOriginal.getDay() === 0 ? 7 : startOriginal.getDay();
  const targetDaysOfWeek = (rule.daysOfWeek && rule.daysOfWeek.length > 0)
    ? rule.daysOfWeek
    : [baseDayOfWeek];

  if (rule.frequency === 'daily') {
    let currentStart = new Date(startOriginal);
    let count = 0;

    while (count < targetInstancesLimit) {
      currentStart = new Date(currentStart.getTime() + interval * 24 * 60 * 60 * 1000);

      if (untilDate && currentStart.getTime() > untilDate.getTime()) {
        break;
      }

      count++;
      const currentEnd = new Date(currentStart.getTime() + durationMs);

      instances.push({
        ...baseEvent,
        id: `${baseParentId}-rec-${count}`,
        recurrenceParentId: baseParentId,
        isRecurringInstance: true,
        startTime: currentStart,
        endTime: currentEnd,
      });
    }
  } else if (rule.frequency === 'weekly') {
    let weekIndex = 0;
    let count = 0;
    const maxWeeksToScan = (targetInstancesLimit + 1) * interval + 12;

    const sortedDays = [...targetDaysOfWeek].sort((a, b) => a - b);

    // Partir del lunes de la semana del evento base
    const distanceToMonday = (startOriginal.getDay() + 6) % 7;
    const weekMonday = new Date(startOriginal);
    weekMonday.setDate(startOriginal.getDate() - distanceToMonday);

    while (count < targetInstancesLimit && weekIndex < maxWeeksToScan) {
      for (const dayNum of sortedDays) {
        const targetDate = new Date(weekMonday);
        targetDate.setDate(weekMonday.getDate() + (weekIndex * 7) + (dayNum - 1));
        targetDate.setHours(startOriginal.getHours(), startOriginal.getMinutes(), startOriginal.getSeconds(), 0);

        // Si la fecha coincide o es previa al evento base, omitir
        if (targetDate.getTime() <= startOriginal.getTime()) {
          continue;
        }

        if (untilDate && targetDate.getTime() > untilDate.getTime()) {
          continue;
        }

        count++;
        const targetEnd = new Date(targetDate.getTime() + durationMs);

        instances.push({
          ...baseEvent,
          id: `${baseParentId}-rec-${count}`,
          recurrenceParentId: baseParentId,
          isRecurringInstance: true,
          startTime: targetDate,
          endTime: targetEnd,
        });

        if (count >= targetInstancesLimit) break;
      }

      weekIndex += interval;
    }
  } else if (rule.frequency === 'monthly') {
    let count = 0;

    while (count < targetInstancesLimit) {
      count++;
      const nextMonthDate = new Date(startOriginal);
      nextMonthDate.setMonth(startOriginal.getMonth() + (count * interval));

      if (untilDate && nextMonthDate.getTime() > untilDate.getTime()) {
        break;
      }

      const nextMonthEnd = new Date(nextMonthDate.getTime() + durationMs);

      instances.push({
        ...baseEvent,
        id: `${baseParentId}-rec-${count}`,
        recurrenceParentId: baseParentId,
        isRecurringInstance: true,
        startTime: nextMonthDate,
        endTime: nextMonthEnd,
      });
    }
  }

  return instances;
}
