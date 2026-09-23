import { create } from 'zustand';
import { Event, Category } from '@/types/event';
import { ConstraintParams } from '@/types/parameters';
import { WeatherForecast } from '@/types/weather';
import { ScheduleDiff } from '@/solver/types';
import { defaultConstraintParams, createTravelMatrixLookup } from '@/constraints/params';
import { ConstraintContext } from '@/constraints/contracts';
import { solveSchedule, cascadeEvict } from '@/solver/core/scheduler';
import { calculateScheduleDiff } from '@/solver/explainability/diffCalculator';

// Categorías nativas iniciales
export const initialCategories: Category[] = [
  { id: 'cat-work', name: 'Trabajo / Turnos', slug: 'trabajo', color: '#f59e0b', archetype: 'locked_pillar', icon: 'briefcase' },
  { id: 'cat-study-fixed', name: 'Cursada Facultad', slug: 'cursada', color: '#3b82f6', archetype: 'locked_pillar', icon: 'graduation-cap' },
  { id: 'cat-study-float', name: 'Estudio y Entregas', slug: 'estudio', color: '#6366f1', archetype: 'floating_deadline', icon: 'book-open' },
  { id: 'cat-gym', name: 'Gimnasio / Deporte', slug: 'gimnasio', color: '#10b981', archetype: 'elastic_routine', icon: 'dumbbell' },
  { id: 'cat-social', name: 'Vida Social y Amigos', slug: 'social', color: '#ec4899', archetype: 'social_flexible', icon: 'beer' },
  { id: 'cat-logistics', name: 'Logística / Cocina', slug: 'logistica', color: '#8b5cf6', archetype: 'logistics_buffer', icon: 'utensils' },
  { id: 'cat-sleep', name: 'Sueño Biológico Garantizado', slug: 'sueno', color: '#818cf8', archetype: 'locked_pillar', icon: 'moon' },
];

/**
 * Sintetiza proactivamente los bloques de descanso biológico de 8h para cada día de la semana.
 * Si hay un evento nocturno (cierre de Ferro o salida), ancla el sueño a la llegada a casa.
 * Si no, proyecta el sueño nocturno regular (23:30 - 07:30).
 */
export function synthesizeBiologicalSleepEvents(
  events: Event[],
  params: ConstraintParams,
  travelMatrix: any,
  weekStartDate: Date = new Date()
): Event[] {
  const monday = new Date(weekStartDate);
  const dayOfWeek = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const sleepEvents: Event[] = [];
  const targetSleepMins = params.targetSleepMinutes || 480;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + dayOffset);

    // Buscar si hay eventos nocturnos / disruptores que finalicen tarde en este día
    const nightDisruptors = events.filter((ev) => {
      if (!ev.startTime || !ev.endTime) return false;
      const s = new Date(ev.startTime);
      const e = new Date(ev.endTime);
      const isSameDay = s.getDate() === dayDate.getDate() && s.getMonth() === dayDate.getMonth();
      const isLateEnding = e.getHours() >= 22 || (e.getHours() < 7 && e.getDate() !== s.getDate());
      return isSameDay && (isLateEnding || ev.isScheduleDisruptor);
    });

    if (nightDisruptors.length > 0) {
      nightDisruptors.sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
      const latest = nightDisruptors[0];
      const endTime = new Date(latest.endTime!);
      const travelMins = travelMatrix.getTravelMinutes(latest.location || 'Casa', 'Casa');

      // Anclaje flotante de llegada
      const sleepStart = new Date(endTime.getTime() + travelMins * 60 * 1000);
      const sleepEnd = new Date(sleepStart.getTime() + targetSleepMins * 60 * 1000);

      sleepEvents.push({
        id: `sleep-bio-${dayOffset}`,
        categoryId: 'cat-sleep',
        title: `Sueño Biológico Garantizado (${(targetSleepMins / 60).toFixed(0)}h)`,
        startTime: sleepStart,
        endTime: sleepEnd,
        durationMinutes: targetSleepMins,
        isLocked: true,
        isSensitive: true,
        displayAlias: 'Descanso Personal',
        location: 'Casa',
        cognitiveLoad: 0,
        physicalLoad: 0,
        energyDrain: 'low',
      });
    } else {
      // Noche regular sin disrupción: 23:30 - 07:30
      const sleepStart = new Date(dayDate);
      sleepStart.setHours(23, 30, 0, 0);
      const sleepEnd = new Date(sleepStart.getTime() + targetSleepMins * 60 * 1000);

      sleepEvents.push({
        id: `sleep-bio-${dayOffset}`,
        categoryId: 'cat-sleep',
        title: `Sueño Nocturno Reparador (${(targetSleepMins / 60).toFixed(0)}h)`,
        startTime: sleepStart,
        endTime: sleepEnd,
        durationMinutes: targetSleepMins,
        isLocked: true,
        isSensitive: true,
        displayAlias: 'Descanso Personal',
        location: 'Casa',
        cognitiveLoad: 0,
        physicalLoad: 0,
        energyDrain: 'low',
      });
    }
  }

  return sleepEvents;
}

// Datos de prueba ilustrativos para poblar el calendario en el primer arranque
const now = new Date();
const todayYear = now.getFullYear();
const todayMonth = now.getMonth();
const todayDate = now.getDate();

const defaultPillars: Event[] = [
  {
    id: 'evt-work-1',
    categoryId: 'cat-work',
    title: 'Turno Sucursal Ferro',
    startTime: new Date(todayYear, todayMonth, todayDate, 18, 0),
    endTime: new Date(todayYear, todayMonth, todayDate + 1, 1, 0),
    durationMinutes: 420,
    isLocked: true,
    isScheduleDisruptor: true,
    cognitiveLoad: 1,
    physicalLoad: 2,
    energyDrain: 'high',
    location: 'Ferro',
  },
  {
    id: 'evt-class-1',
    categoryId: 'cat-study-fixed',
    title: 'Cursada AEEC (Asistencia Estricta)',
    startTime: new Date(todayYear, todayMonth, todayDate + 1, 14, 0),
    endTime: new Date(todayYear, todayMonth, todayDate + 1, 16, 0),
    durationMinutes: 120,
    isLocked: true,
    maxLatenessMinutes: 0, // Tolerancia 0
    cognitiveLoad: 2,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Facultad',
  },
  {
    id: 'evt-study-redes',
    categoryId: 'cat-study-float',
    title: 'Estudio Redes de Computadoras',
    durationMinutes: 120,
    isFloating: true,
    deadline: new Date(todayYear, todayMonth, todayDate + 3, 20, 0),
    cognitiveLoad: 3,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Casa',
    minBlockMinutes: 90,
    maxBlockMinutes: 180,
  },
  {
    id: 'evt-study-calsoft',
    categoryId: 'cat-study-float',
    title: 'Estudio Calidad de Software',
    durationMinutes: 90,
    isFloating: true,
    deadline: new Date(todayYear, todayMonth, todayDate + 2, 19, 0),
    cognitiveLoad: 2,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Casa',
    minBlockMinutes: 90,
    maxBlockMinutes: 150,
  },
  {
    id: 'evt-gym-torso',
    categoryId: 'cat-gym',
    title: 'Gimnasio (Sesión Torso)',
    startTime: new Date(todayYear, todayMonth, todayDate, 15, 0),
    endTime: new Date(todayYear, todayMonth, todayDate, 16, 15),
    durationMinutes: 75,
    isFloating: false,
    splitVariant: 'torso',
    recoveryDaysNeeded: 2,
    cognitiveLoad: 0,
    physicalLoad: 3,
    energyDrain: 'high',
    location: 'Gimnasio',
  },
];

const initialSleepBlocks = synthesizeBiologicalSleepEvents(
  defaultPillars,
  defaultConstraintParams,
  createTravelMatrixLookup(),
  now
);

export const initialEvents: Event[] = [...defaultPillars, ...initialSleepBlocks];

interface ScheduleStore {
  events: Event[];
  proposedSchedule: Event[] | null;
  categories: Category[];
  params: ConstraintParams;
  metaSliders: { academic: number; social: number; wellness: number };
  weather: WeatherForecast[];
  activeDiff: ScheduleDiff | null;
  isDiffModalOpen: boolean;
  isPanicModalOpen: boolean;
  isTriageModalOpen: boolean;
  isCreateModalOpen: boolean;
  createModalInitialTimes: { start: Date; end: Date } | null;
  isWhatIfModalOpen: boolean;
  isOnboardingModalOpen: boolean;
  frictionFeedback: { eventId: string; eventTitle: string; x: number; y: number } | null;
  selectedEventToEdit: Event | null;
  isEditModalOpen: boolean;

  // Acciones
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setMetaSliders: (sliders: Partial<{ academic: number; social: number; wellness: number }>) => void;
  setParams: (params: Partial<ConstraintParams>) => void;
  setWeather: (forecasts: WeatherForecast[]) => void;
  openDiffModal: (diff: ScheduleDiff) => void;
  closeDiffModal: () => void;
  setPanicModalOpen: (open: boolean) => void;
  setTriageModalOpen: (open: boolean) => void;
  setCreateModalOpen: (open: boolean, times?: { start: Date; end: Date }) => void;
  setWhatIfModalOpen: (open: boolean) => void;
  setOnboardingModalOpen: (open: boolean) => void;
  setFrictionFeedback: (feedback: { eventId: string; eventTitle: string; x: number; y: number } | null) => void;
  openEditModal: (event: Event) => void;
  closeEditModal: () => void;

  // Métodos del Solver CSP
  recalculateSchedule: () => void;
  triggerPanicEviction: (urgentPlan: Event) => void;
  dismissAndRepurposeSlot: (eventId: string) => void;
  applyProposedSchedule: () => void;
  discardProposedSchedule: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  events: initialEvents,
  proposedSchedule: null,
  categories: initialCategories,
  params: defaultConstraintParams,
  metaSliders: { academic: 1.0, social: 1.0, wellness: 1.0 },
  weather: [],
  activeDiff: null,
  isDiffModalOpen: false,
  isPanicModalOpen: false,
  isTriageModalOpen: false,
  isCreateModalOpen: false,
  createModalInitialTimes: null,
  isWhatIfModalOpen: false,
  isOnboardingModalOpen: false,
  frictionFeedback: null,
  selectedEventToEdit: null,
  isEditModalOpen: false,

  setCreateModalOpen: (open, times) =>
    set({ isCreateModalOpen: open, createModalInitialTimes: times || null }),
  setWhatIfModalOpen: (open) => set({ isWhatIfModalOpen: open }),
  setOnboardingModalOpen: (open) => set({ isOnboardingModalOpen: open }),
  setFrictionFeedback: (feedback) => set({ frictionFeedback: feedback }),
  openEditModal: (event) => set({ selectedEventToEdit: event, isEditModalOpen: true }),
  closeEditModal: () => set({ selectedEventToEdit: null, isEditModalOpen: false }),

  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),

  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),

  setMetaSliders: (sliders) => {
    set((state) => ({
      metaSliders: { ...state.metaSliders, ...sliders },
    }));
    get().recalculateSchedule();
  },

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  setWeather: (weather) => set({ weather }),

  openDiffModal: (diff) => set({ activeDiff: diff, isDiffModalOpen: true }),
  closeDiffModal: () => set({ activeDiff: null, isDiffModalOpen: false }),

  setPanicModalOpen: (open) => set({ isPanicModalOpen: open }),
  setTriageModalOpen: (open) => set({ isTriageModalOpen: open }),

  recalculateSchedule: () => {
    const { events, params, metaSliders, weather } = get();
    const travelMatrix = createTravelMatrixLookup();

    // 1. Filtrar eventos de sueño previamente generados para recalcularlos según los turnos y descansos actuales
    const nonSleepEvents = events.filter((e) => !e.id.startsWith('sleep-bio-'));
    const freshSleepBlocks = synthesizeBiologicalSleepEvents(nonSleepEvents, params, travelMatrix);
    const candidateEvents = [...nonSleepEvents, ...freshSleepBlocks];

    const context: ConstraintContext = {
      candidateEvents,
      originalSchedule: events,
      params,
      travelMatrix,
      weather,
      currentTime: new Date(),
      metaSliders,
    };

    const result = solveSchedule(candidateEvents, context);
    const diff = calculateScheduleDiff(events, result.schedule, result.executionTimeMs, 'RECALCULATE');

    if (diff.hasChanges) {
      set({
        proposedSchedule: result.schedule,
        activeDiff: diff,
        isDiffModalOpen: true,
      });
    } else {
      set({ events: result.schedule });
    }
  },

  triggerPanicEviction: (urgentPlan) => {
    const { events, params, metaSliders, weather } = get();
    const context: ConstraintContext = {
      candidateEvents: events,
      originalSchedule: events,
      params,
      travelMatrix: createTravelMatrixLookup(),
      weather,
      currentTime: new Date(),
      metaSliders,
    };

    const result = cascadeEvict(events, urgentPlan, context);
    const diff = calculateScheduleDiff(events, result.schedule, result.executionTimeMs, 'PANIC_EVICTION');

    set({
      proposedSchedule: result.schedule,
      activeDiff: diff,
      isDiffModalOpen: true,
      isPanicModalOpen: false,
    });
  },

  dismissAndRepurposeSlot: (eventId: string) => {
    const { events, params, metaSliders, weather } = get();
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    // 1. Eliminar la reserva social descartada
    const remainingEvents = events.filter((e) => e.id !== eventId);

    // 2. Liberar eventos flotantes para que puedan adelantar su horario en el hueco recién liberado
    const poolToResolve = remainingEvents.map((e) => {
      if (e.isFloating && !e.isLocked) {
        return {
          ...e,
          startTime: undefined,
          endTime: undefined,
        };
      }
      return e;
    });

    const context: ConstraintContext = {
      candidateEvents: poolToResolve,
      originalSchedule: events,
      params,
      travelMatrix: createTravelMatrixLookup(),
      weather,
      currentTime: new Date(),
      metaSliders,
    };

    const result = solveSchedule(poolToResolve, context);
    const diff = calculateScheduleDiff(events, result.schedule, result.executionTimeMs, 'DISMISS_REPURPOSE');

    set({
      proposedSchedule: result.schedule,
      activeDiff: diff,
      isDiffModalOpen: true,
    });
  },

  applyProposedSchedule: () => {
    const { proposedSchedule } = get();
    if (proposedSchedule) {
      set({
        events: proposedSchedule,
        proposedSchedule: null,
        activeDiff: null,
        isDiffModalOpen: false,
      });
    }
  },

  discardProposedSchedule: () => {
    set({
      proposedSchedule: null,
      activeDiff: null,
      isDiffModalOpen: false,
    });
  },
}));
