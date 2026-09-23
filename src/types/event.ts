/**
 * ============================================================================
 * PlanificadorDeMatu - Modelo de Eventos y Arquetipos Temporales
 * ============================================================================
 */

/**
 * Los 5 Arquetipos de Comportamiento Temporal del Motor CSP
 * Garantizan que el usuario pueda crear infinitas categorías en O(1)
 * sin modificar la lógica interna del solver.
 */
export type ArchetypeType =
  | 'locked_pillar'      // Turnos de trabajo, cursadas con asistencia obligatoria (Overlap = 0)
  | 'floating_deadline'  // Metas de estudio, proyectos con entrega y cuota de horas
  | 'elastic_routine'    // Hábitos recurrentes con ventanas y descansos (Gym, Cocina)
  | 'social_flexible'    // Bolsa social fungible, salidas con amigos, serendipia
  | 'logistics_buffer';  // Desplazamientos, viandas, compras, descanso activo

export type EnergyDrain = 'low' | 'normal' | 'high';

/**
 * Rasgo 1: Eventos Rígidos e Inamovibles (Puntualidad militar, Overlap = 0)
 */
export interface LockedPillarTrait {
  readonly archetype: 'locked_pillar';
  isLocked: true;
  fixedStartTime: Date | string;
  fixedEndTime: Date | string;
  toleranceMinutes: 0;
}

/**
 * Rasgo 2: Metas Flotantes con Auto-Splitting y Fecha Límite
 */
export interface FloatingDeadlineTrait {
  readonly archetype: 'floating_deadline';
  deadline: Date | string;
  totalRequiredMinutes: number;
  minBlockMinutes: number; // Mínimo tiempo para foco profundo (ej. 90 min)
  maxBlockMinutes: number; // Techo de saturación cognitiva (ej. 180 min)
  splitVariant?: string;
}

/**
 * Rasgo 3: Hábitos Elásticos con Lag Inter-Sesión (Gimnasio, Instrumento)
 */
export interface ElasticRoutineTrait {
  readonly archetype: 'elastic_routine';
  frequencyPerWeek: number;
  durationMinutes: number;
  preferredTimeWindow?: {
    start: string; // "18:00" (HH:mm)
    end: string;   // "22:00" (HH:mm)
    daysOfWeek?: number[]; // [1, 3, 5]
  };
  recoveryDaysNeeded: number; // LagConstraint: días mínimos entre variantes
  splitVariant?: string;      // Ej: 'torso', 'piernas'
}

/**
 * Rasgo 4: Salidas Sociales con Bolsa Fungible y Desalojo Inteligente
 */
export interface SocialFlexibleTrait {
  readonly archetype: 'social_flexible';
  allocatedHoursPool: number;
  canBeEvictedByPanicButton: true;
  outdoorActivity: boolean;
  minWeatherComfortIndex: number; // Umbral de confort climático de Mar del Plata
  estimatedCostArs: number;
}

/**
 * Rasgo 5: Tareas de Soporte y Logística (Baja exigencia mental)
 */
export interface LogisticsBufferTrait {
  readonly archetype: 'logistics_buffer';
  cognitiveLoad: 0; // Excluido de veto cognitivo
  physicalLoad: number;
  flexibleAttachmentToLocation: boolean;
}

/**
 * Unión de Rasgos de Arquetipos
 */
export type ArchetypeTrait =
  | LockedPillarTrait
  | FloatingDeadlineTrait
  | ElasticRoutineTrait
  | SocialFlexibleTrait
  | LogisticsBufferTrait;

/**
 * Entidad de Categoría Vinculada a un Arquetipo Temporal
 */
export interface Category {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  archetype: ArchetypeType;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Ventana horaria preferida
 */
export interface PreferredTimeWindow {
  start: string; // "18:30" (HH:mm)
  end: string;   // "21:30" (HH:mm)
  daysOfWeek?: number[]; // [1, 3, 5] (1=Lunes, 7=Domingo)
}

/**
 * Entidad de Evento Polimórfica Optimizada por el Solver CSP
 */
export interface Event {
  id: string;
  userId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  displayAlias?: string; // Máscara de privacidad para vistas públicas y Webcal
  description?: string;

  // Marcas temporales exactas (asignadas o propuestas por el solver)
  startTime?: Date | string;
  endTime?: Date | string;
  durationMinutes: number;
  isAllDay?: boolean;

  // Banderas del Algoritmo y Comportamiento CSP
  isLocked?: boolean;            // Candado absoluto inamovible (Hard Pillar)
  isFloating?: boolean;          // Bloque auto-ubicable por el solver
  isSensitive?: boolean;         // Requiere display alias en exportación y feeds
  isScheduleDisruptor?: boolean; // Actividad nocturna o extenuante que dispara sueño flotante y veto cognitivo
  cannabisConsumed?: boolean;    // Dispara GHC-01 (margen sobrio de descenso familiar)

  // Metadatos Cognitivos, Biológicos y Espaciales
  cognitiveLoad: number; // 0 = mecánico, 1 = ligero, 2 = moderado, 3 = foco profundo
  physicalLoad: number;  // 0 = reposo, 1 = suave, 2 = moderado, 3 = extenuante
  energyDrain: EnergyDrain;
  location: string;      // 'Casa', 'Facultad', 'Rambla Casino', 'Ferro', etc.

  // Parámetros de Metas Flotantes (Floating Deadlines)
  deadline?: Date | string;
  totalRequiredMinutes?: number;
  minBlockMinutes?: number; // Foco mínimo (ej. 90 min)
  maxBlockMinutes?: number; // Límite de saturación (ej. 180 min)

  // Parámetros de Rutinas Elásticas y Descanso Inter-Sesión (LagConstraint)
  splitVariant?: string;     // Ej: 'torso', 'piernas'
  recoveryDaysNeeded?: number; // Días mínimos de recuperación requeridos
  preferredTimeWindow?: PreferredTimeWindow;

  // Tolerancia a Tardanzas (Punctuality Matrix)
  maxLatenessMinutes?: number;      // 0 = puntualidad militar, >0 = tolerancia suave
  latenessPenaltyWeight?: number;   // Ponderación de penalización en soft constraints

  // Dimensión Económica (Moneda Local ARS)
  estimatedCostArs?: number;

  // Sincronización Externa (Google Calendar / iCal)
  googleEventId?: string;
  syncEtag?: string;

  createdAt?: string;
  updatedAt?: string;
}
