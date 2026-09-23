import { Event } from '@/types/event';
import { HardValidationResult } from '@/constraints/contracts';

export interface TimeSlot {
  index: number; // 0 a 671 (4 slots por hora * 24 horas * 7 días)
  start: Date;
  end: Date;
  isOccupied: boolean;
  occupyingEventId?: string;
}

export interface CandidateSlot {
  startTime: Date;
  endTime: Date;
  slotIndex: number;
  score: number;
}

export interface SolverResult {
  success: boolean;
  schedule: Event[];
  violations: HardValidationResult[];
  totalScore: number;
  executionTimeMs: number;
  unassignedEvents: Event[];
}

export interface ScheduleDiffItem {
  eventId: string;
  eventTitle: string;
  changeType: 'added' | 'moved' | 'rescheduled' | 'split' | 'evicted';
  originalStart?: Date;
  originalEnd?: Date;
  newStart?: Date;
  newEnd?: Date;
  causeCode: string; // ej: 'HC-03_SLEEP', 'HC-01_OVERLAP', 'PANIC_EVICTION'
  explanation: string;
}

export interface ScheduleDiff {
  hasChanges: boolean;
  items: ScheduleDiffItem[];
  summary: string;
  executionTimeMs: number;
}
