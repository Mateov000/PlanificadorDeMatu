import { create } from 'zustand';
import { Event, Category } from '@/types/event';
import { ConstraintParams } from '@/types/parameters';
import { WeatherForecast } from '@/types/weather';
import { ScheduleDiff } from '@/solver/types';
import { defaultConstraintParams, createTravelMatrixLookup } from '@/constraints/params';
import { ConstraintContext } from '@/constraints/contracts';
import { solveSchedule, cascadeEvict } from '@/solver/core/scheduler';
import { calculateScheduleDiff } from '@/solver/explainability/diffCalculator';
import { constraintRegistry } from '@/constraints/registry';
import { generateRecurringInstances } from '@/lib/calendar/recurrence';

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

export interface CustomConstraint {
  id: string;
  name: string;
  description: string;
  type: 'hard' | 'soft';
  variable: string;
  operator: '<' | '>' | '<=' | '>=' | '===' | '!=';
  threshold: number | string;
  weight?: number;
  enabled: boolean;
  createdAt?: string;
}

export function registerCustomConstraintInEngine(c: CustomConstraint) {
  if (c.type === 'hard') {
    constraintRegistry.registerHardRule({
      id: c.id,
      name: c.name,
      description: c.description || `Restricción personalizada: ${c.variable} ${c.operator} ${c.threshold}`,
      enabled: c.enabled,
      validate: (candidate: Event[], _context: ConstraintContext) => {
        for (const ev of candidate) {
          if (!ev.startTime) continue;
          let val: any = undefined;
          if (c.variable === 'cognitiveLoad') val = ev.cognitiveLoad;
          else if (c.variable === 'durationMinutes') val = ev.durationMinutes;
          else if (c.variable === 'recoveryDaysNeeded') val = ev.recoveryDaysNeeded;
          else if (c.variable === 'estimatedCostArs') val = ev.estimatedCostArs;
          else if (c.variable === 'hourOfDay') {
            const st = typeof ev.startTime === 'string' ? new Date(ev.startTime) : ev.startTime;
            val = st.getHours() + st.getMinutes() / 60;
          } else if (c.variable === 'location') val = ev.location;
          else if (c.variable === 'category') val = ev.categoryId;

          if (val !== undefined) {
            const thresh = typeof val === 'number' ? Number(c.threshold) : String(c.threshold);
            let violates = false;
            switch (c.operator) {
              case '<': violates = !(val < thresh); break;
              case '>': violates = !(val > thresh); break;
              case '<=': violates = !(val <= thresh); break;
              case '>=': violates = !(val >= thresh); break;
              case '===': violates = !(val === thresh); break;
              case '!=': violates = !(val !== thresh); break;
            }
            if (violates) {
              return {
                satisfied: false,
                errorCode: `CUSTOM_${c.id}`,
                reason: `Violación de regla personalizada "${c.name}": ${ev.title} (${c.variable} = ${val}) no cumple con ${c.operator} ${c.threshold}.`,
                violatingEventIds: [ev.id],
              };
            }
          }
        }
        return { satisfied: true };
      },
    });
  } else {
    constraintRegistry.registerSoftRule({
      id: c.id,
      name: c.name,
      description: c.description || `Preferencia personalizada: ${c.variable} ${c.operator} ${c.threshold}`,
      category: 'academic',
      defaultWeight: c.weight || 1.0,
      enabled: c.enabled,
      evaluate: (candidate: Event[], _context: ConstraintContext) => {
        let violations = 0;
        let total = 0;
        for (const ev of candidate) {
          if (!ev.startTime) continue;
          total++;
          let val: any = undefined;
          if (c.variable === 'cognitiveLoad') val = ev.cognitiveLoad;
          else if (c.variable === 'durationMinutes') val = ev.durationMinutes;
          else if (c.variable === 'recoveryDaysNeeded') val = ev.recoveryDaysNeeded;
          else if (c.variable === 'estimatedCostArs') val = ev.estimatedCostArs;
          else if (c.variable === 'hourOfDay') {
            const st = typeof ev.startTime === 'string' ? new Date(ev.startTime) : ev.startTime;
            val = st.getHours() + st.getMinutes() / 60;
          } else if (c.variable === 'location') val = ev.location;

          if (val !== undefined) {
            const thresh = typeof val === 'number' ? Number(c.threshold) : String(c.threshold);
            let violates = false;
            switch (c.operator) {
              case '<': violates = !(val < thresh); break;
              case '>': violates = !(val > thresh); break;
              case '<=': violates = !(val <= thresh); break;
              case '>=': violates = !(val >= thresh); break;
              case '===': violates = !(val === thresh); break;
              case '!=': violates = !(val !== thresh); break;
            }
            if (violates) violations++;
          }
        }
        return total > 0 ? Math.min(1.0, violations / total) : 0;
      },
    });
  }
}

/**
 * Sintetiza proactivamente los bloques de descanso biológico de 8h para cada día de la semana.
 * Si hay un evento nocturno (cierre de Ferro o salida), ancla el sueño a la llegada a casa.
 * Si no, proyecta el sueño nocturno regular (23:00 - 07:00).
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
  const pad = (n: number) => n.toString().padStart(2, '0');

  for (let dayOffset = -1; dayOffset < 7; dayOffset++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + dayOffset);
    const dateKey = `${dayDate.getFullYear()}-${pad(dayDate.getMonth() + 1)}-${pad(dayDate.getDate())}`;
    const sleepId = `sleep-bio-${dateKey}`;

    // Buscar si hay eventos nocturnos / disruptores que finalicen tarde en este día (excluyendo descanso)
    const nightDisruptors = events.filter((ev) => {
      if (ev.categoryId === 'cat-sleep' || ev.id.startsWith('sleep-bio-')) return false;
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
        id: sleepId,
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
      // Noche regular sin disrupción: 23:00 - 07:00
      const sleepStart = new Date(dayDate);
      sleepStart.setHours(23, 0, 0, 0);
      const sleepEnd = new Date(sleepStart.getTime() + targetSleepMins * 60 * 1000);

      sleepEvents.push({
        id: sleepId,
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

// Función utilitaria para normalizar una fecha al Lunes 00:00:00 de su semana
export function getMondayOf(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domingo, 1 = Lunes
  const distanceToMonday = (day + 6) % 7;
  date.setDate(date.getDate() - distanceToMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Plantilla integral de eventos representativos de la vida de Matu
const now = new Date();
const currentMonday = getMondayOf(now);

const monYear = currentMonday.getFullYear();
const monMonth = currentMonday.getMonth();
const monDate = currentMonday.getDate();

const defaultPillars: Event[] = [
  // Turno Ferro (Viernes 18:00 - Sábado 01:00 AM)
  {
    id: 'evt-work-1',
    categoryId: 'cat-work',
    title: 'Turno Sucursal Ferro',
    startTime: new Date(monYear, monMonth, monDate + 4, 18, 0),
    endTime: new Date(monYear, monMonth, monDate + 5, 1, 0),
    durationMinutes: 420,
    isLocked: true,
    isScheduleDisruptor: true,
    cognitiveLoad: 1,
    physicalLoad: 2,
    energyDrain: 'high',
    location: 'Ferro',
  },
  // Turno Casino (Sábado 14:00 - 22:00)
  {
    id: 'evt-work-2',
    categoryId: 'cat-work',
    title: 'Turno Sucursal Casino',
    startTime: new Date(monYear, monMonth, monDate + 5, 14, 0),
    endTime: new Date(monYear, monMonth, monDate + 5, 22, 0),
    durationMinutes: 480,
    isLocked: true,
    cognitiveLoad: 1,
    physicalLoad: 2,
    energyDrain: 'high',
    location: 'Rambla Casino',
  },
  // Cursada AEEC (Jueves 14:00 - 16:00, Tolerancia 0)
  {
    id: 'evt-class-1',
    categoryId: 'cat-study-fixed',
    title: 'Cursada AEEC (Asistencia Estricta)',
    startTime: new Date(monYear, monMonth, monDate + 3, 14, 0),
    endTime: new Date(monYear, monMonth, monDate + 3, 16, 0),
    durationMinutes: 120,
    isLocked: true,
    maxLatenessMinutes: 0,
    cognitiveLoad: 2,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Facultad',
  },
  // Cursada Redes (Miércoles 16:00 - 19:00)
  {
    id: 'evt-class-2',
    categoryId: 'cat-study-fixed',
    title: 'Cursada Redes de Computadoras',
    startTime: new Date(monYear, monMonth, monDate + 2, 16, 0),
    endTime: new Date(monYear, monMonth, monDate + 2, 19, 0),
    durationMinutes: 180,
    isLocked: true,
    cognitiveLoad: 3,
    physicalLoad: 0,
    energyDrain: 'high',
    location: 'Facultad',
  },
  // Estudio Redes (Floating Goal, 120 min)
  {
    id: 'evt-study-redes',
    categoryId: 'cat-study-float',
    title: 'Estudio Redes de Computadoras',
    durationMinutes: 120,
    isFloating: true,
    deadline: new Date(monYear, monMonth, monDate + 4, 18, 0),
    cognitiveLoad: 3,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Casa',
    minBlockMinutes: 90,
    maxBlockMinutes: 180,
  },
  // Estudio CalSoft (Floating Goal, 90 min)
  {
    id: 'evt-study-calsoft',
    categoryId: 'cat-study-float',
    title: 'Estudio Calidad de Software',
    durationMinutes: 90,
    isFloating: true,
    deadline: new Date(monYear, monMonth, monDate + 3, 13, 0),
    cognitiveLoad: 2,
    physicalLoad: 0,
    energyDrain: 'normal',
    location: 'Casa',
    minBlockMinutes: 90,
    maxBlockMinutes: 150,
  },
  // Gym Torso (Martes 15:30 - 16:45)
  {
    id: 'evt-gym-torso',
    categoryId: 'cat-gym',
    title: 'Gimnasio (Sesión Torso)',
    startTime: new Date(monYear, monMonth, monDate + 1, 15, 30),
    endTime: new Date(monYear, monMonth, monDate + 1, 16, 45),
    durationMinutes: 75,
    isFloating: false,
    splitVariant: 'torso',
    recoveryDaysNeeded: 2,
    cognitiveLoad: 0,
    physicalLoad: 3,
    energyDrain: 'high',
    location: 'Gimnasio',
  },
  // Gym Piernas (Rutina Elástica Flotante con Lag HC-06 >= 2 días)
  {
    id: 'evt-gym-piernas',
    categoryId: 'cat-gym',
    title: 'Gimnasio (Sesión Piernas)',
    durationMinutes: 75,
    isFloating: true,
    splitVariant: 'piernas',
    recoveryDaysNeeded: 2,
    cognitiveLoad: 0,
    physicalLoad: 3,
    energyDrain: 'high',
    location: 'Gimnasio',
    preferredTimeWindow: { start: '16:30', end: '19:30' },
  },
  // Salida Social: Birra con Juancito
  {
    id: 'evt-social-juancito',
    categoryId: 'cat-social',
    title: 'Birra con Juancito',
    durationMinutes: 120,
    isFloating: true,
    cognitiveLoad: 0,
    physicalLoad: 0,
    energyDrain: 'low',
    location: 'Cervecería Güemes',
    preferredTimeWindow: { start: '19:30', end: '22:15' },
    estimatedCostArs: 14000,
  },
  // Salida Social: Encuentro Costero al Aire Libre (Playa Varese / Rambla)
  {
    id: 'evt-social-costa',
    categoryId: 'cat-social',
    title: 'Encuentro Costero al Aire Libre',
    durationMinutes: 150,
    isFloating: true,
    cognitiveLoad: 0,
    physicalLoad: 0,
    energyDrain: 'low',
    location: 'Playa Varese / Costa',
    preferredTimeWindow: { start: '14:30', end: '18:30' },
    estimatedCostArs: 6000,
  },
];

const initialSleepBlocks = synthesizeBiologicalSleepEvents(
  defaultPillars,
  defaultConstraintParams,
  createTravelMatrixLookup(),
  currentMonday
);

const initialRawEvents: Event[] = [...defaultPillars, ...initialSleepBlocks];

// Pre-solución limpia para que al abrir la app ya se visualicen de forma armónica todos los bloques
const preSolved = solveSchedule(
  initialRawEvents,
  {
    candidateEvents: initialRawEvents,
    originalSchedule: initialRawEvents,
    params: defaultConstraintParams,
    travelMatrix: createTravelMatrixLookup(),
    currentTime: new Date(monYear, monMonth, monDate, 0, 0),
    metaSliders: { academic: 1.0, social: 1.0, wellness: 1.0 },
  },
  currentMonday
);

export const initialEvents: Event[] = preSolved.schedule.length > 0 ? preSolved.schedule : initialRawEvents;

interface ScheduleStore {
  events: Event[];
  previousEvents: Event[] | null;
  proposedSchedule: Event[] | null;
  categories: Category[];
  currentWeekStart: Date;
  params: ConstraintParams;
  metaSliders: { academic: number; social: number; wellness: number };
  weather: WeatherForecast[];
  customConstraints: CustomConstraint[];
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

  // Navegación y Gestión de Semanas
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
  goToCurrentWeek: () => void;
  setCurrentWeekStart: (date: Date) => void;
  deleteCurrentWeekEvents: () => void;

  // Acciones
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string, deleteSeries?: boolean) => void;
  deleteRecurringSeries: (parentId: string) => void;
  setMetaSliders: (sliders: Partial<{ academic: number; social: number; wellness: number }>) => void;
  setParams: (params: Partial<ConstraintParams>) => void;
  setWeather: (forecasts: WeatherForecast[]) => void;
  addCustomConstraint: (constraint: CustomConstraint) => void;
  removeCustomConstraint: (id: string) => void;
  toggleCustomConstraint: (id: string) => void;
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
  previousEvents: null,
  proposedSchedule: null,
  categories: initialCategories,
  currentWeekStart: currentMonday,
  params: defaultConstraintParams,
  metaSliders: { academic: 1.0, social: 1.0, wellness: 1.0 },
  weather: [],
  customConstraints: [],
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

  goToNextWeek: () => {
    set((state) => {
      const next = new Date(state.currentWeekStart);
      next.setDate(next.getDate() + 7);
      return { currentWeekStart: next };
    });
  },

  goToPrevWeek: () => {
    set((state) => {
      const prev = new Date(state.currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      return { currentWeekStart: prev };
    });
  },

  goToCurrentWeek: () => {
    set({ currentWeekStart: getMondayOf(new Date()) });
  },

  setCurrentWeekStart: (date) => {
    set({ currentWeekStart: getMondayOf(date) });
  },

  deleteCurrentWeekEvents: () => {
    const { currentWeekStart, events } = get();
    const weekStartMs = currentWeekStart.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

    // Ventana biológica extendida para limpiar también el descanso que bordea la semana
    const bioWindowStartMs = weekStartMs - 12 * 60 * 60 * 1000;

    const remainingEvents = events.filter((ev) => {
      // 1. Eventos de descanso biológico que pertenezcan o toquen esta semana
      if (ev.categoryId === 'cat-sleep' || ev.id.startsWith('sleep-bio-')) {
        const s = ev.startTime ? new Date(ev.startTime).getTime() : 0;
        const e = ev.endTime ? new Date(ev.endTime).getTime() : s + (ev.durationMinutes || 480) * 60 * 1000;
        const touchesThisWeek = s < weekEndMs && e > weekStartMs;
        if (touchesThisWeek || (s >= bioWindowStartMs && s < weekEndMs)) return false;
      }

      if (!ev.startTime) {
        if (ev.deadline) {
          const d = new Date(ev.deadline).getTime();
          if (d >= weekStartMs && d < weekEndMs) return false;
        }
        return false;
      }
      const s = new Date(ev.startTime).getTime();
      const e = ev.endTime ? new Date(ev.endTime).getTime() : s + (ev.durationMinutes || 60) * 60 * 1000;
      const intersects = s < weekEndMs && e > weekStartMs;
      return !intersects;
    });

    set({ events: remainingEvents, proposedSchedule: null, activeDiff: null });
  },

  setCreateModalOpen: (open, times) =>
    set({ isCreateModalOpen: open, createModalInitialTimes: times || null }),
  setWhatIfModalOpen: (open) => set({ isWhatIfModalOpen: open }),
  setOnboardingModalOpen: (open) => set({ isOnboardingModalOpen: open }),
  setFrictionFeedback: (feedback) => set({ frictionFeedback: feedback }),
  openEditModal: (event) => set({ selectedEventToEdit: event, isEditModalOpen: true }),
  closeEditModal: () => set({ selectedEventToEdit: null, isEditModalOpen: false }),

  addEvent: (event) =>
    set((state) => {
      let eventsToAdd = [event];
      if (event.recurrence && event.recurrence.frequency) {
        const instances = generateRecurringInstances(event, event.recurrence);
        eventsToAdd = [event, ...instances];
      }
      return { events: [...state.events, ...eventsToAdd] };
    }),

  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEvent: (id, deleteSeries = false) =>
    set((state) => {
      const target = state.events.find((e) => e.id === id);
      if (deleteSeries && target) {
        const parentId = target.recurrenceParentId || (target.recurrence ? target.id : null);
        if (parentId) {
          return {
            events: state.events.filter(
              (e) => e.id !== parentId && e.recurrenceParentId !== parentId
            ),
          };
        }
      }
      return {
        events: state.events.filter((e) => e.id !== id),
      };
    }),

  deleteRecurringSeries: (parentId: string) =>
    set((state) => ({
      events: state.events.filter(
        (e) => e.id !== parentId && e.recurrenceParentId !== parentId
      ),
    })),

  addCustomConstraint: (constraint: CustomConstraint) => {
    registerCustomConstraintInEngine(constraint);
    set((state) => ({
      customConstraints: [...state.customConstraints, constraint],
    }));
    get().recalculateSchedule();
  },

  removeCustomConstraint: (id: string) => {
    constraintRegistry.unregisterRule(id);
    set((state) => ({
      customConstraints: state.customConstraints.filter((c) => c.id !== id),
    }));
    get().recalculateSchedule();
  },

  toggleCustomConstraint: (id: string) => {
    const constraint = get().customConstraints.find((c) => c.id === id);
    if (!constraint) return;
    const newEnabled = !constraint.enabled;
    constraintRegistry.setRuleEnabled(id, newEnabled);
    set((state) => ({
      customConstraints: state.customConstraints.map((c) =>
        c.id === id ? { ...c, enabled: newEnabled } : c
      ),
    }));
    get().recalculateSchedule();
  },

  setMetaSliders: (sliders) => {
    set((state) => ({
      metaSliders: { ...state.metaSliders, ...sliders },
    }));
    get().recalculateSchedule();
  },

  setParams: (newParams) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }));
    get().recalculateSchedule();
  },

  setWeather: (weather) => {
    set({ weather });
    get().recalculateSchedule();
  },

  openDiffModal: (diff) => set({ activeDiff: diff, isDiffModalOpen: true }),
  closeDiffModal: () => set({ activeDiff: null, isDiffModalOpen: false }),

  setPanicModalOpen: (open) => set({ isPanicModalOpen: open }),
  setTriageModalOpen: (open) => set({ isTriageModalOpen: open }),

  recalculateSchedule: () => {
    const { events, params, metaSliders, weather, currentWeekStart } = get();
    const travelMatrix = createTravelMatrixLookup();

    const weekMon = new Date(currentWeekStart);
    weekMon.setHours(0, 0, 0, 0);

    const weekStartMs = weekMon.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;

    // Ventana biológica de la semana: desde el domingo previo 12:00 hs hasta el lunes siguiente 12:00 hs
    const bioWindowStartMs = weekStartMs - 12 * 60 * 60 * 1000;
    const bioWindowEndMs = weekEndMs + 12 * 60 * 60 * 1000;

    const isCurrentWeekSleep = (e: Event) => {
      if (e.categoryId !== 'cat-sleep' && !e.id.startsWith('sleep-bio-')) return false;
      if (!e.startTime) return false;
      const s = new Date(e.startTime).getTime();
      return s >= bioWindowStartMs && s < bioWindowEndMs;
    };

    // Preservar eventos que pertenezcan a otras semanas (excluyendo cualquier descanso que toque esta semana)
    const otherWeeksEvents = events.filter((e) => {
      if (isCurrentWeekSleep(e)) return false;
      if (!e.startTime) return false;
      const s = new Date(e.startTime).getTime();
      return s < weekStartMs || s >= weekEndMs;
    });

    // Eventos de la semana en vista (excluyendo descanso previo para recalcularlo de forma limpia)
    const thisWeekEvents = events.filter((e) => {
      if (isCurrentWeekSleep(e)) return false;
      if (!e.startTime) return true;
      const s = new Date(e.startTime).getTime();
      return s >= weekStartMs && s < weekEndMs;
    });

    // Sintetizar bloques de descanso frescos con ID determinista de fecha YYYY-MM-DD
    const freshSleepBlocks = synthesizeBiologicalSleepEvents(thisWeekEvents, params, travelMatrix, weekMon);
    const candidateEvents = [...thisWeekEvents, ...freshSleepBlocks];

    const context: ConstraintContext = {
      candidateEvents,
      originalSchedule: thisWeekEvents,
      params,
      travelMatrix,
      weather,
      currentTime: new Date(weekMon.getTime() - 1000), // Permitir optimizar la semana completa
      metaSliders,
    };

    const result = solveSchedule(candidateEvents, context, weekMon);
    const diff = calculateScheduleDiff(thisWeekEvents, result.schedule, result.executionTimeMs, 'RECALCULATE');

    if (diff.items.length === 0) {
      diff.summary = '¡Tu agenda ya se encuentra en su distribución matemática óptima! Todos tus turnos fijos, descansos biológicos y metas de estudio respetan las restricciones sin conflictos.';
    }

    // Deduplicación estricta por ID garantizando 0 colisiones y 0 acumulaciones
    const uniqueMap = new Map<string, Event>();
    for (const ev of [...otherWeeksEvents, ...result.schedule]) {
      uniqueMap.set(ev.id, ev);
    }
    const finalEvents = Array.from(uniqueMap.values());

    set({
      previousEvents: [...events],
      events: finalEvents,
      proposedSchedule: finalEvents,
      activeDiff: diff,
      isDiffModalOpen: true,
    });
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
        previousEvents: null,
        proposedSchedule: null,
        activeDiff: null,
        isDiffModalOpen: false,
      });
    }
  },

  discardProposedSchedule: () => {
    const { previousEvents, events } = get();
    set({
      events: previousEvents || events,
      previousEvents: null,
      proposedSchedule: null,
      activeDiff: null,
      isDiffModalOpen: false,
    });
  },
}));
