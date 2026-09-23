import { Event } from '@/types/event';

export interface ParsedIcsEvent {
  title: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

function parseIcsDate(dateStr: string): { date: Date; isAllDay: boolean } {
  // Ejemplos comunes en RFC 5545:
  // 20260924T180000Z (UTC)
  // 20260924T150000 (Local con o sin TZID)
  // 20260924 (All day)
  const clean = dateStr.trim();

  if (clean.length === 8 && !clean.includes('T')) {
    // All day: YYYYMMDD
    const y = parseInt(clean.substring(0, 4), 10);
    const m = parseInt(clean.substring(4, 6), 10) - 1;
    const d = parseInt(clean.substring(6, 8), 10);
    return { date: new Date(y, m, d, 0, 0, 0), isAllDay: true };
  }

  const tIdx = clean.indexOf('T');
  if (tIdx !== -1) {
    const datePart = clean.substring(tIdx - 8, tIdx);
    const timePart = clean.substring(tIdx + 1, tIdx + 7);
    const isUtc = clean.endsWith('Z');

    const y = parseInt(datePart.substring(0, 4), 10);
    const m = parseInt(datePart.substring(4, 6), 10) - 1;
    const d = parseInt(datePart.substring(6, 8), 10);

    const hh = parseInt(timePart.substring(0, 2), 10) || 0;
    const mm = parseInt(timePart.substring(2, 4), 10) || 0;
    const ss = parseInt(timePart.substring(4, 6), 10) || 0;

    if (isUtc) {
      return { date: new Date(Date.UTC(y, m, d, hh, mm, ss)), isAllDay: false };
    } else {
      return { date: new Date(y, m, d, hh, mm, ss), isAllDay: false };
    }
  }

  const fallback = new Date(clean);
  return { date: isNaN(fallback.getTime()) ? new Date() : fallback, isAllDay: false };
}

/**
 * Parsea el contenido en texto plano de un archivo .ics (RFC 5545)
 */
export function parseIcsCalendar(icsContent: string): ParsedIcsEvent[] {
  const events: ParsedIcsEvent[] = [];
  const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Desenvolver lneas continuadas (RFC 5545 folding: lneas que empiezan con espacio o tab)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfoldedLines.length > 0) {
      unfoldedLines[unfoldedLines.length - 1] += line.substring(1);
    } else if (line.trim().length > 0) {
      unfoldedLines.push(line.trim());
    }
  }

  let inEvent = false;
  let currentTitle = 'Evento sin ttulo';
  let currentStartStr = '';
  let currentEndStr = '';
  let currentLocation = '';
  let currentDescription = '';

  for (const line of unfoldedLines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentTitle = 'Evento sin ttulo';
      currentStartStr = '';
      currentEndStr = '';
      currentLocation = '';
      currentDescription = '';
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent && currentStartStr) {
        const { date: startDate, isAllDay } = parseIcsDate(currentStartStr);
        let endDate = startDate;

        if (currentEndStr) {
          endDate = parseIcsDate(currentEndStr).date;
        } else {
          // Si no tiene end time, asumir 60 min
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        }

        const durationMinutes = Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000)));

        events.push({
          title: currentTitle,
          startTime: startDate,
          endTime: endDate,
          durationMinutes,
          location: currentLocation || undefined,
          description: currentDescription || undefined,
          isAllDay,
        });
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const keyPart = line.substring(0, colonIdx);
    const value = line.substring(colonIdx + 1);
    const key = keyPart.split(';')[0].toUpperCase();

    if (key === 'SUMMARY') {
      currentTitle = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').trim() || 'Evento';
    } else if (key === 'DTSTART') {
      currentStartStr = value;
    } else if (key === 'DTEND') {
      currentEndStr = value;
    } else if (key === 'LOCATION') {
      currentLocation = value.replace(/\\n/g, ' ').replace(/\\,/g, ',').trim();
    } else if (key === 'DESCRIPTION') {
      currentDescription = value.replace(/\\n/g, '\n').trim();
    }
  }

  return events;
}
