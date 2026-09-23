import { TimeSlot } from '../types';
export type { TimeSlot };

export const SLOT_DURATION_MINUTES = 15;
export const SLOTS_PER_HOUR = 60 / SLOT_DURATION_MINUTES; // 4
export const SLOTS_PER_DAY = 24 * SLOTS_PER_HOUR; // 96
export const SLOTS_PER_WEEK = 7 * SLOTS_PER_DAY; // 672

function getStartTimestamp(weekStartDate: Date): number {
  const isUtcMidnight =
    weekStartDate.getUTCHours() === 0 &&
    weekStartDate.getUTCMinutes() === 0 &&
    weekStartDate.getUTCSeconds() === 0 &&
    weekStartDate.getUTCMilliseconds() === 0 &&
    weekStartDate.getHours() !== 0;

  return isUtcMidnight ? weekStartDate.getTime() : new Date(weekStartDate).setHours(0, 0, 0, 0);
}

/**
 * Genera la cuadrícula discreta de 672 slots de 15 minutos para la semana
 */
export function initializeWeekTimeSlots(weekStartDate: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startTimestamp = getStartTimestamp(weekStartDate);

  for (let i = 0; i < SLOTS_PER_WEEK; i++) {
    const slotStart = new Date(startTimestamp + i * SLOT_DURATION_MINUTES * 60 * 1000);
    const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

    slots.push({
      index: i,
      start: slotStart,
      end: slotEnd,
      isOccupied: false,
    });
  }

  return slots;
}

/**
 * Convierte un Date al índice de slot relativo a weekStartDate
 */
export function dateToSlotIndex(date: Date, weekStartDate: Date): number {
  const startOfDay = getStartTimestamp(weekStartDate);
  const diffMs = date.getTime() - startOfDay;
  const slot = Math.floor(diffMs / (SLOT_DURATION_MINUTES * 60 * 1000));
  return Math.max(0, Math.min(SLOTS_PER_WEEK - 1, slot));
}

/**
 * Convierte un índice de slot a Date
 */
export function slotIndexToDate(slotIndex: number, weekStartDate: Date): Date {
  const startOfDay = getStartTimestamp(weekStartDate);
  return new Date(startOfDay + slotIndex * SLOT_DURATION_MINUTES * 60 * 1000);
}

/**
 * Verifica si un rango continuo de slots está libre
 */
export function isSlotRangeFree(slots: TimeSlot[], startIdx: number, neededSlots: number): boolean {
  if (startIdx + neededSlots > slots.length) return false;
  for (let i = startIdx; i < startIdx + neededSlots; i++) {
    if (slots[i].isOccupied) return false;
  }
  return true;
}

/**
 * Marca un rango de slots como ocupado por un evento
 */
export function occupySlotRange(slots: TimeSlot[], startIdx: number, neededSlots: number, eventId: string): void {
  for (let i = startIdx; i < Math.min(slots.length, startIdx + neededSlots); i++) {
    slots[i].isOccupied = true;
    slots[i].occupyingEventId = eventId;
  }
}
