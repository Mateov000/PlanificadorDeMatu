import { describe, it, expect } from 'vitest';
import { Event } from '../src/types/event';
import { ConstraintContext } from '../src/constraints/contracts';
import { defaultConstraintParams, createTravelMatrixLookup } from '../src/constraints/params';
import { hc01_noOverlapRule } from '../src/constraints/hard/HC01_NoOverlap';
import { hc03_sleepAnchorRule } from '../src/constraints/hard/HC03_SleepAnchor';
import { hc05_travelViabilityRule } from '../src/constraints/hard/HC05_TravelViability';
import { hc06_splitLagRecoveryRule } from '../src/constraints/hard/HC06_SplitLagRecovery';
import { solveSchedule, cascadeEvict } from '../src/solver/core/scheduler';

function createMockContext(): ConstraintContext {
  return {
    candidateEvents: [],
    params: defaultConstraintParams,
    travelMatrix: createTravelMatrixLookup(),
    currentTime: new Date('2026-09-24T08:00:00Z'),
    metaSliders: { academic: 1.0, social: 1.0, wellness: 1.0 },
  };
}

describe('HC-01: No Overlap Rule', () => {
  it('detects direct overlap between two events', () => {
    const context = createMockContext();
    const candidate: Event[] = [
      {
        id: '1',
        title: 'Estudio CalSoft',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
      {
        id: '2',
        title: 'Turno Casino',
        startTime: new Date('2026-09-24T15:30:00Z'),
        endTime: new Date('2026-09-24T19:30:00Z'),
        durationMinutes: 240,
        cognitiveLoad: 1,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Rambla Casino',
      },
    ];

    const result = hc01_noOverlapRule.validate(candidate, context);
    expect(result.satisfied).toBe(false);
    expect(result.errorCode).toBe('HC-01_OVERLAP');
  });

  it('approves consecutive non-overlapping events', () => {
    const context = createMockContext();
    const candidate: Event[] = [
      {
        id: '1',
        title: 'Estudio CalSoft',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
      {
        id: '2',
        title: 'Turno Casino',
        startTime: new Date('2026-09-24T17:00:00Z'),
        endTime: new Date('2026-09-24T21:00:00Z'),
        durationMinutes: 240,
        cognitiveLoad: 1,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Rambla Casino',
      },
    ];

    const result = hc01_noOverlapRule.validate(candidate, context);
    expect(result.satisfied).toBe(true);
  });
});

describe('HC-03: Late Night Sleep Anchor', () => {
  it('blocks scheduling during the 8h sleep window after a late night shift', () => {
    const context = createMockContext();
    // Turno nocturno que termina a las 01:00 AM (llega a casa a las 01:30 AM -> duerme hasta las 09:30 AM)
    const lateShift: Event = {
      id: 'shift-1',
      title: 'Cierre Nocturno',
      startTime: new Date('2026-09-24T20:00:00'),
      endTime: new Date('2026-09-25T01:00:00'),
      durationMinutes: 300,
      isScheduleDisruptor: true,
      cognitiveLoad: 1,
      physicalLoad: 2,
      energyDrain: 'high',
      location: 'Ferro',
    };

    // Intentar meter estudio a las 08:00 AM
    const conflictingStudy: Event = {
      id: 'study-1',
      title: 'Estudio Redes',
      startTime: new Date('2026-09-25T08:00:00'),
      endTime: new Date('2026-09-25T10:00:00'),
      durationMinutes: 120,
      cognitiveLoad: 3,
      physicalLoad: 0,
      energyDrain: 'normal',
      location: 'Casa',
    };

    const result = hc03_sleepAnchorRule.validate([lateShift, conflictingStudy], context);
    expect(result.satisfied).toBe(false);
    expect(result.errorCode).toBe('HC-03_SLEEP');
  });
});

describe('HC-05: Travel Viability', () => {
  it('detects impossible travel when gap between different locations is insufficient', () => {
    const context = createMockContext();
    // Evento en Facultad termina a las 16:00. Evento en Rambla Casino empieza a las 16:10.
    // Matriz dice que requiere 25-30 min.
    const candidate: Event[] = [
      {
        id: '1',
        title: 'Cursada',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
      {
        id: '2',
        title: 'Turno',
        startTime: new Date('2026-09-24T16:10:00Z'),
        endTime: new Date('2026-09-24T20:00:00Z'),
        durationMinutes: 230,
        cognitiveLoad: 1,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Rambla Casino',
      },
    ];

    const result = hc05_travelViabilityRule.validate(candidate, context);
    expect(result.satisfied).toBe(false);
    expect(result.errorCode).toBe('HC-05_TRAVEL_IMPOSSIBLE');
  });
});

describe('HC-06: Lag Constraint (Split Recovery)', () => {
  it('enforces minimum required recovery days between sessions', () => {
    const context = createMockContext();
    const candidate: Event[] = [
      {
        id: 'gym-1',
        title: 'Sesión Torso A',
        startTime: new Date('2026-09-24T18:00:00Z'),
        endTime: new Date('2026-09-24T19:15:00Z'),
        durationMinutes: 75,
        splitVariant: 'torso_a',
        recoveryDaysNeeded: 2, // Requiere al menos 2 días de descanso
        cognitiveLoad: 0,
        physicalLoad: 3,
        energyDrain: 'high',
        location: 'Gimnasio',
      },
      {
        id: 'gym-2',
        title: 'Sesión Torso B',
        startTime: new Date('2026-09-25T18:00:00Z'), // Al día siguiente (solo 1 día)
        endTime: new Date('2026-09-25T19:15:00Z'),
        durationMinutes: 75,
        splitVariant: 'torso_b',
        recoveryDaysNeeded: 2,
        cognitiveLoad: 0,
        physicalLoad: 3,
        energyDrain: 'high',
        location: 'Gimnasio',
      },
    ];

    const result = hc06_splitLagRecoveryRule.validate(candidate, context);
    expect(result.satisfied).toBe(false);
    expect(result.errorCode).toBe('HC-06_SPLIT_OVERLOAD');
  });
});

describe('Solver & Panic Button Performance', () => {
  it('solves weekly floating study goals in under 50 milliseconds', () => {
    const context = createMockContext();
    const weekStart = new Date('2026-09-21T00:00:00Z');

    const fixedEvents: Event[] = [
      {
        id: 'pilar-1',
        title: 'Cursada Obligatoria',
        startTime: new Date('2026-09-21T14:00:00Z'),
        endTime: new Date('2026-09-21T18:00:00Z'),
        durationMinutes: 240,
        isLocked: true,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
    ];

    const floatingEvents: Event[] = [
      {
        id: 'study-1',
        title: 'Estudio Redes',
        durationMinutes: 120,
        isFloating: true,
        deadline: new Date('2026-09-25T20:00:00Z'),
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
      {
        id: 'study-2',
        title: 'Estudio CalSoft',
        durationMinutes: 90,
        isFloating: true,
        deadline: new Date('2026-09-24T20:00:00Z'),
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
    ];

    const result = solveSchedule([...fixedEvents, ...floatingEvents], context, weekStart);

    expect(result.success).toBe(true);
    expect(result.executionTimeMs).toBeLessThan(50); // Directiva de latencia estricta < 50 ms
    expect(result.schedule.length).toBe(3);
  });

  it('evicts overlapping study and cascades forward when Panic Button triggers', () => {
    const context = createMockContext();
    const weekStart = new Date('2026-09-21T00:00:00Z');

    const currentSchedule: Event[] = [
      {
        id: 'study-calsoft',
        title: 'Estudio CalSoft',
        startTime: new Date('2026-09-24T19:00:00Z'),
        endTime: new Date('2026-09-24T21:00:00Z'),
        durationMinutes: 120,
        isFloating: true,
        deadline: new Date('2026-09-27T20:00:00Z'),
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
    ];

    // Imprevisto social: Cerveza con amigos a las 19:00
    const urgentPlan: Event = {
      id: 'social-beer',
      title: 'Cerveza con Juancito',
      startTime: new Date('2026-09-24T19:00:00Z'),
      endTime: new Date('2026-09-24T22:00:00Z'),
      durationMinutes: 180,
      cognitiveLoad: 0,
      physicalLoad: 1,
      energyDrain: 'low',
      location: 'Cervecería',
    };

    const evictedResult = cascadeEvict(currentSchedule, urgentPlan, context, weekStart);

    expect(evictedResult.success).toBe(true);
    expect(evictedResult.executionTimeMs).toBeLessThan(50);
    // El plan social está agendado
    const socialScheduled = evictedResult.schedule.find((e) => e.id === 'social-beer');
    expect(socialScheduled).toBeDefined();
    // CalSoft sigue en la agenda pero reubicado (no solapado)
    const calsoftRescheduled = evictedResult.schedule.find((e) => e.id === 'study-calsoft');
    expect(calsoftRescheduled).toBeDefined();
    expect(calsoftRescheduled?.startTime?.toString()).not.toBe(urgentPlan.startTime?.toString());
  });
});
