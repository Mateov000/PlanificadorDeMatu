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
];

// Datos de prueba ilustrativos para poblar el calendario en el primer arranque
const now = new Date();
const todayYear = now.getFullYear();
const todayMonth = now.getMonth();
const todayDate = now.getDate();

export const initialEvents: Event[] = [
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

  // Métodos del Solver CSP
  recalculateSchedule: () => void;
  triggerPanicEviction: (urgentPlan: Event) => void;
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
    const context: ConstraintContext = {
      candidateEvents: events,
      originalSchedule: events,
      params,
      travelMatrix: createTravelMatrixLookup(),
      weather,
      currentTime: new Date(),
      metaSliders,
    };

    const result = solveSchedule(events, context);
    const diff = calculateScheduleDiff(events, result.schedule, result.executionTimeMs, 'RECALCULATE');

    if (diff.hasChanges) {
      set({
        proposedSchedule: result.schedule,
        activeDiff: diff,
        isDiffModalOpen: true,
      });
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
