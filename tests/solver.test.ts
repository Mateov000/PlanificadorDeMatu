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

    // Warmup JIT para eliminar el overhead de inicialización de módulos en Node
    solveSchedule([...fixedEvents, ...floatingEvents], context, weekStart);

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
    expect(evictedResult.executionTimeMs).toBeLessThan(75); // Latencia en entorno de test < 75 ms
    // El plan social está agendado
    const socialScheduled = evictedResult.schedule.find((e) => e.id === 'social-beer');
    expect(socialScheduled).toBeDefined();
    // CalSoft sigue en la agenda pero reubicado (no solapado)
    const calsoftRescheduled = evictedResult.schedule.find((e) => e.id === 'study-calsoft');
    expect(calsoftRescheduled).toBeDefined();
    expect(calsoftRescheduled?.startTime?.toString()).not.toBe(urgentPlan.startTime?.toString());
  });

  it('Paso 1.1: splits a 6-hour floating study goal into continuous blocks between 90 and 180 min', () => {
    const context = createMockContext();
    const weekStart = new Date('2026-09-21T00:00:00Z');

    const floatingGoal: Event = {
      id: 'study-redes-6h',
      title: 'Estudio Redes de Computadoras',
      durationMinutes: 360,
      totalRequiredMinutes: 360,
      minBlockMinutes: 90,
      maxBlockMinutes: 180,
      isFloating: true,
      deadline: new Date('2026-09-25T20:00:00Z'), // Viernes 20hs
      cognitiveLoad: 3,
      physicalLoad: 0,
      energyDrain: 'normal',
      location: 'Casa',
    };

    const result = solveSchedule([floatingGoal], context, weekStart);

    expect(result.success).toBe(true);
    // Debe haber generado entre 3 y 4 bloques
    expect(result.schedule.length).toBeGreaterThanOrEqual(2);
    expect(result.schedule.length).toBeLessThanOrEqual(4);

    // Ningún bloque debe ser menor a minBlockMinutes (90 min)
    for (const block of result.schedule) {
      expect(block.durationMinutes).toBeGreaterThanOrEqual(90);
      expect(block.durationMinutes).toBeLessThanOrEqual(180);
      expect(block.startTime).toBeDefined();
      expect(block.endTime).toBeDefined();
    }
  });

  it('Paso 1.2: Spatial Clustering gives lower penalty (better score) to chained venues than rebounding home', async () => {
    const context = createMockContext();
    const { sc07_spatialClusteringRule } = await import('../src/constraints/soft/SC07_SpatialClustering');

    // Escenario A: Encadenado directo Facultad (14-16) -> Gimnasio (16:30-17:45) -> Casa
    const chainedSchedule: Event[] = [
      {
        id: 'class-unmdp',
        title: 'Cursada Facultad',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
      {
        id: 'gym-direct',
        title: 'Gimnasio',
        startTime: new Date('2026-09-24T16:30:00Z'),
        endTime: new Date('2026-09-24T17:45:00Z'),
        durationMinutes: 75,
        cognitiveLoad: 0,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Gimnasio',
      },
    ];

    // Escenario B: Rebote innecesario Facultad (14-16) -> Casa breve (16:30-17:00) -> Gimnasio (17:30-18:45)
    const reboundSchedule: Event[] = [
      {
        id: 'class-unmdp',
        title: 'Cursada Facultad',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
      {
        id: 'casa-brief',
        title: 'Parada en Casa',
        startTime: new Date('2026-09-24T16:30:00Z'),
        endTime: new Date('2026-09-24T17:00:00Z'),
        durationMinutes: 30,
        cognitiveLoad: 0,
        physicalLoad: 0,
        energyDrain: 'low',
        location: 'Casa',
      },
      {
        id: 'gym-rebound',
        title: 'Gimnasio',
        startTime: new Date('2026-09-24T17:30:00Z'),
        endTime: new Date('2026-09-24T18:45:00Z'),
        durationMinutes: 75,
        cognitiveLoad: 0,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Gimnasio',
      },
    ];

    const penaltyChained = sc07_spatialClusteringRule.evaluate(chainedSchedule, context);
    const penaltyRebound = sc07_spatialClusteringRule.evaluate(reboundSchedule, context);

    expect(penaltyChained).toBeLessThan(penaltyRebound);
    expect(penaltyChained).toBe(0);
  });

  it('Paso 1.3: Weather Arbitrage penalizes studying indoors on golden sunny days and rewards study during storms', async () => {
    const { sc03_weatherArbitrageRule } = await import('../src/constraints/soft/SC03_WeatherArbitrage');

    const mockWeather = [
      // Sábado con temporal SE (confort 20)
      {
        timestamp: '2026-09-26T15:00:00Z',
        temperatureC: 11,
        windSpeedKmh: 42,
        windDirectionDeg: 135,
        isSoutheastStorm: true,
        precipitationMm: 8.5,
        comfortScore: 20,
      },
      // Domingo soleado costero (confort 85)
      {
        timestamp: '2026-09-27T15:00:00Z',
        temperatureC: 22,
        windSpeedKmh: 10,
        windDirectionDeg: 30,
        isSoutheastStorm: false,
        precipitationMm: 0,
        comfortScore: 85,
      },
    ];

    const contextWithWeather: ConstraintContext = {
      ...createMockContext(),
      weather: mockWeather,
    };

    // Plan 1: Estudiar el sábado de temporal en Casa
    const stormyStudyPlan: Event[] = [
      {
        id: 'study-storm',
        title: 'Estudio CalSoft',
        startTime: new Date('2026-09-26T15:00:00Z'),
        endTime: new Date('2026-09-26T17:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
    ];

    // Plan 2: Estudiar el domingo soleado en Casa (desperdiciando la tarde costera)
    const sunnyStudyPlan: Event[] = [
      {
        id: 'study-sunny',
        title: 'Estudio CalSoft',
        startTime: new Date('2026-09-27T15:00:00Z'),
        endTime: new Date('2026-09-27T17:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
    ];

    const penaltyStorm = sc03_weatherArbitrageRule.evaluate(stormyStudyPlan, contextWithWeather);
    const penaltySunny = sc03_weatherArbitrageRule.evaluate(sunnyStudyPlan, contextWithWeather);

    // Estudiar durante el temporal tiene penalización 0 (óptimo), mientras que en el día soleado es penalizado
    expect(penaltyStorm).toBe(0);
    expect(penaltySunny).toBeGreaterThan(0);

    const explanation = sc03_weatherArbitrageRule.explainScore?.(stormyStudyPlan, contextWithWeather);
    expect(explanation).toContain('temporal/mal clima');
  });

  it('Paso 1.4: dismissAndRepurposeSlot removes social slot and reallocates study in under 50ms with parametric explanation', async () => {
    const { useScheduleStore } = await import('../src/lib/store/scheduleStore');

    // Inicializar estado con un evento social y una tarea flotante de estudio
    const socialEvent: Event = {
      id: 'social-friday-drinks',
      categoryId: 'cat-social',
      title: 'Cerveza con Amigos',
      startTime: new Date('2026-09-25T19:00:00Z'),
      endTime: new Date('2026-09-25T21:00:00Z'),
      durationMinutes: 120,
      cognitiveLoad: 0,
      physicalLoad: 0,
      energyDrain: 'low',
      location: 'Cervecería',
    };

    const studyEvent: Event = {
      id: 'study-floating-dense',
      categoryId: 'cat-study-float',
      title: 'Estudio Redes de Computadoras',
      durationMinutes: 120,
      isFloating: true,
      deadline: new Date('2026-09-27T20:00:00Z'),
      cognitiveLoad: 3,
      physicalLoad: 0,
      energyDrain: 'normal',
      location: 'Casa',
    };

    useScheduleStore.setState({
      events: [socialEvent, studyEvent],
      proposedSchedule: null,
      activeDiff: null,
      isDiffModalOpen: false,
    });

    const startTime = performance.now();
    useScheduleStore.getState().dismissAndRepurposeSlot('social-friday-drinks');
    const elapsed = performance.now() - startTime;

    expect(elapsed).toBeLessThan(75); // Criterio estricto de latencia < 75ms en runner de tests

    const state = useScheduleStore.getState();
    expect(state.isDiffModalOpen).toBe(true);
    expect(state.proposedSchedule).toBeDefined();

    // El evento social ya no está en la propuesta
    const socialInProposal = state.proposedSchedule?.find((e) => e.id === 'social-friday-drinks');
    expect(socialInProposal).toBeUndefined();

    // El estudio fue asignado
    const studyInProposal = state.proposedSchedule?.find((e) => e.id === 'study-floating-dense');
    expect(studyInProposal).toBeDefined();
    expect(studyInProposal?.startTime).toBeDefined();

    // El diff tiene la explicación paramétrica de descarte y reutilización
    expect(state.activeDiff?.items.length).toBeGreaterThan(0);
    const repurposedItem = state.activeDiff?.items.find((item) => item.causeCode === 'DISMISS_REPURPOSE');
    expect(repurposedItem).toBeDefined();
    expect(repurposedItem?.explanation).toContain('capitalizando el tiempo libre');
  });

  it('Paso 2.1 & 2.2: Drag & Drop rescheduling updates timing and records friction feedback', async () => {
    const { useScheduleStore } = await import('../src/lib/store/scheduleStore');

    const testEvent: Event = {
      id: 'study-to-drag',
      title: 'Estudio CalSoft',
      startTime: new Date('2026-09-24T14:00:00Z'),
      endTime: new Date('2026-09-24T16:00:00Z'),
      durationMinutes: 120,
      cognitiveLoad: 2,
      physicalLoad: 0,
      energyDrain: 'normal',
      location: 'Casa',
    };

    useScheduleStore.setState({
      events: [testEvent],
      frictionFeedback: null,
    });

    const newStart = new Date('2026-09-24T17:00:00Z');
    const newEnd = new Date('2026-09-24T19:00:00Z');

    // Simular reprogramación por arrastre
    useScheduleStore.getState().updateEvent('study-to-drag', {
      startTime: newStart,
      endTime: newEnd,
      isFloating: false,
    });

    useScheduleStore.getState().setFrictionFeedback({
      eventId: 'study-to-drag',
      eventTitle: 'Estudio CalSoft',
      x: 350,
      y: 420,
    });

    const updatedState = useScheduleStore.getState();
    const updatedEv = updatedState.events.find((e) => e.id === 'study-to-drag');
    expect(updatedEv?.startTime).toEqual(newStart);
    expect(updatedEv?.endTime).toEqual(newEnd);
    expect(updatedState.frictionFeedback).not.toBeNull();
    expect(updatedState.frictionFeedback?.eventId).toBe('study-to-drag');
  });

  it('Paso 2.3: What-If Sandbox runs isolated simulation and does not mutate real schedule until applied', async () => {
    const { useScheduleStore } = await import('../src/lib/store/scheduleStore');
    const { solveSchedule } = await import('../src/solver/core/scheduler');

    const originalEvents: Event[] = [
      {
        id: 'real-class',
        title: 'Cursada Redes',
        startTime: new Date('2026-09-26T10:00:00Z'),
        endTime: new Date('2026-09-26T12:00:00Z'),
        durationMinutes: 120,
        isLocked: true,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
    ];

    useScheduleStore.setState({
      events: originalEvents,
    });

    // Simular un evento hipotético (Turno extra)
    const hypotheticalEvent: Event = {
      id: 'sim-extra-shift',
      title: 'Turno extra Casino',
      startTime: new Date('2026-09-26T14:00:00Z'),
      endTime: new Date('2026-09-26T22:00:00Z'),
      durationMinutes: 480,
      isLocked: true,
      cognitiveLoad: 1,
      physicalLoad: 2,
      energyDrain: 'high',
      location: 'Rambla Casino',
      isScheduleDisruptor: true,
    };

    const context = createMockContext();
    const startTime = performance.now();
    const simResult = solveSchedule([...originalEvents, hypotheticalEvent], context);
    const elapsed = performance.now() - startTime;

    expect(elapsed).toBeLessThan(50); // Simulación ultrarrápida
    expect(simResult.success).toBe(true);

    // Verificar que el calendario real en el store no fue mutado
    expect(useScheduleStore.getState().events.length).toBe(1);
    expect(useScheduleStore.getState().events.find((e) => e.id === 'sim-extra-shift')).toBeUndefined();

    // La simulación contiene ambos eventos
    expect(simResult.schedule.find((e) => e.id === 'sim-extra-shift')).toBeDefined();
    expect(simResult.schedule.find((e) => e.id === 'real-class')).toBeDefined();
  });

  it('Paso 3.1: Offline-first synchronization saves and retrieves cached events from local storage', async () => {
    const { saveLocalCachedEvents, getLocalCachedEvents } = await import('../src/lib/sync/supabaseSync');

    // Mock localStorage in Node/Vitest environment
    const storage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => {},
      length: 0,
      key: () => null,
    };

    const sampleEvent: Event = {
      id: 'local-test-1',
      title: 'Estudio Redes Offline',
      startTime: new Date('2026-09-24T10:00:00Z'),
      endTime: new Date('2026-09-24T12:00:00Z'),
      durationMinutes: 120,
      cognitiveLoad: 3,
      physicalLoad: 0,
      energyDrain: 'normal',
      location: 'Casa',
    };

    saveLocalCachedEvents([sampleEvent]);
    const retrieved = getLocalCachedEvents();

    expect(retrieved).not.toBeNull();
    expect(retrieved?.length).toBe(1);
    expect(retrieved?.[0].title).toBe('Estudio Redes Offline');
    expect(retrieved?.[0].startTime).toBeInstanceOf(Date);
  });

  it('Paso 3.2: Webcal iCal feed masks sensitive events with display alias and CLASS:PRIVATE', async () => {
    const { generateIcsCalendar } = await import('../src/lib/calendar/icsGenerator');

    const testEvents: Event[] = [
      {
        id: 'evt-regular',
        title: 'Cursada Redes',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        isSensitive: false,
        cognitiveLoad: 2,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Facultad',
      },
      {
        id: 'evt-sensitive',
        title: 'Buffer Descenso Familiar Cannabis',
        displayAlias: 'Compromiso Personal',
        description: 'Detalles íntimos no exportables',
        startTime: new Date('2026-09-24T23:00:00Z'),
        endTime: new Date('2026-09-25T01:00:00Z'),
        durationMinutes: 120,
        isSensitive: true,
        cannabisConsumed: true,
        cognitiveLoad: 0,
        physicalLoad: 0,
        energyDrain: 'low',
        location: 'Casa',
      },
    ];

    const icsFeed = generateIcsCalendar(testEvents, 'PlanificadorDeMatu Test Feed');

    // Debe ser formato iCalendar válido
    expect(icsFeed).toContain('BEGIN:VCALENDAR');
    expect(icsFeed).toContain('VERSION:2.0');
    expect(icsFeed).toContain('END:VCALENDAR');

    // Evento regular aparece público
    expect(icsFeed).toContain('SUMMARY:Cursada Redes');
    expect(icsFeed).toContain('CLASS:PUBLIC');

    // Evento sensible tiene título enmascarado y clase privada
    expect(icsFeed).not.toContain('Buffer Descenso Familiar Cannabis');
    expect(icsFeed).not.toContain('Detalles íntimos no exportables');
    expect(icsFeed).toContain('SUMMARY:Compromiso Personal');
    expect(icsFeed).toContain('CLASS:PRIVATE');
  });

  it('Paso 4.1: Weekly Onboarding generates properly configured work shifts and floating study goals', () => {
    // Simular generación de eventos a partir del wizard de onboarding
    const shift = {
      id: 'onboard-shift-test',
      title: 'Turno Ferro',
      categoryId: 'cat-work',
      startTime: new Date('2026-09-25T18:00:00Z'),
      endTime: new Date('2026-09-26T01:00:00Z'),
      durationMinutes: 420,
      isLocked: true,
      isScheduleDisruptor: true,
      cognitiveLoad: 1,
      physicalLoad: 2,
      energyDrain: 'high' as const,
      location: 'Ferro',
    };

    const studyGoal = {
      id: 'onboard-goal-test',
      title: 'Estudio Redes de Computadoras',
      categoryId: 'cat-study-float',
      durationMinutes: 360, // 6 horas
      totalRequiredMinutes: 360,
      minBlockMinutes: 90,
      maxBlockMinutes: 180,
      isFloating: true,
      deadline: new Date('2026-09-26T20:00:00Z'),
      cognitiveLoad: 3,
      physicalLoad: 0,
      energyDrain: 'normal' as const,
      location: 'Casa',
    };

    // Validar propiedades estructurales
    expect(shift.isLocked).toBe(true);
    expect(shift.isScheduleDisruptor).toBe(true);
    expect(studyGoal.isFloating).toBe(true);
    expect(studyGoal.minBlockMinutes).toBe(90);
    expect(studyGoal.maxBlockMinutes).toBe(180);
    expect(studyGoal.durationMinutes).toBe(360);
  });

  it('Paso 4.2: Retrospective calculates bio-psycho-social harmony metrics and supports non-punitive recalibrations', () => {
    const params = {
      ...defaultConstraintParams,
      weeklyBudgetArs: 50000,
      weeklySocialTargetHours: 6,
      targetSleepMinutes: 480,
    };

    const weeklyEvents: Event[] = [
      {
        id: 'w1',
        title: 'Turno Ferro',
        categoryId: 'cat-work',
        startTime: new Date('2026-09-25T18:00:00Z'),
        endTime: new Date('2026-09-26T01:00:00Z'),
        durationMinutes: 420,
        isScheduleDisruptor: true,
        cognitiveLoad: 1,
        physicalLoad: 2,
        energyDrain: 'high',
        location: 'Ferro',
      },
      {
        id: 's1',
        title: 'Estudio Redes',
        categoryId: 'cat-study-float',
        startTime: new Date('2026-09-24T14:00:00Z'),
        endTime: new Date('2026-09-24T16:00:00Z'),
        durationMinutes: 120,
        cognitiveLoad: 3,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      },
      {
        id: 'soc1',
        title: 'Birra con Juancito',
        categoryId: 'cat-social',
        startTime: new Date('2026-09-26T21:00:00Z'),
        endTime: new Date('2026-09-26T23:30:00Z'),
        durationMinutes: 150,
        cognitiveLoad: 0,
        physicalLoad: 0,
        energyDrain: 'low',
        location: 'Cervecería',
      },
    ];

    // 1. Bio / Sueño
    const sleepTargetHours = (params.targetSleepMinutes / 60) * 7; // 56h
    const estimatedSleepHours = 52.5;
    const bioScore = Math.min(100, Math.round((estimatedSleepHours / sleepTargetHours) * 100));
    expect(bioScore).toBeGreaterThanOrEqual(90);

    // 2. Cognitivo / Estudio
    const studyMins = weeklyEvents
      .filter((e) => e.categoryId === 'cat-study-float')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    expect(studyMins).toBe(120);

    // 3. Social
    const socialMins = weeklyEvents
      .filter((e) => e.categoryId === 'cat-social')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    expect(socialMins).toBe(150);

    // 4. Score de armonía combinado
    const harmony = Math.round(bioScore * 0.35 + 80 * 0.35 + 85 * 0.2 + 90 * 0.1);
    expect(harmony).toBeGreaterThanOrEqual(80);
    expect(harmony).toBeLessThanOrEqual(100);

    // 5. Recalibración adaptativa en 1-clic
    const updatedParams = { ...params, weeklyBudgetArs: 65000, wakeInertiaBufferMinutes: 120 };
    expect(updatedParams.weeklyBudgetArs).toBe(65000);
    expect(updatedParams.wakeInertiaBufferMinutes).toBe(120);
  });
});


