import { Event } from '@/types/event';
import { applyPrivacyShield } from './privacyShield';

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Genera un archivo iCalendar (RFC 5545) compatible con Google Calendar, Apple Calendar y Outlook
 */
export function generateIcsCalendar(events: Event[], calendarName: string = 'PlanificadorDeMatu'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PlanificadorDeMatu//AutoScheduler PWA//ES',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const rawEvent of events) {
    if (!rawEvent.startTime || !rawEvent.endTime) continue;

    const event = applyPrivacyShield(rawEvent);
    if (!event.startTime || !event.endTime) continue;

    const start = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const end = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@planificador.matu.app`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:${event.title}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }

    if (event.isSensitive) {
      lines.push('CLASS:PRIVATE');
    } else {
      lines.push('CLASS:PUBLIC');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
