/**
 * Arquetipos de Comportamiento Temporal del Motor CSP
 */
export type ArchetypeType =
  | 'locked_pillar'      // Turnos de trabajo, cursadas con asistencia obligatoria (Overlap = 0)
  | 'floating_deadline'  // Bloques de estudio, side projects con fecha de entrega
  | 'elastic_routine'    // Hábitos con ventanas y descansos (Gym, Cocina)
  | 'social_flexible'    // Bolsa social fungible, salidas, serendipia
  | 'logistics_buffer';  // Desplazamientos, viandas, descanso activo

export type EnergyDrain = 'low' | 'normal' | 'high';

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  archetype: ArchetypeType;
}

export interface PreferredTimeWindow {
  start: string; // "18:30" (HH:mm)
  end: string;   // "21:30" (HH:mm)
  daysOfWeek?: number[]; // [1, 3, 5] (1=Lunes, 7=Domingo)
}

export interface Event {
  id: string;
  userId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  displayAlias?: string; // Máscara de privacidad para vistas públicas y Webcal
  description?: string;

  // Marcas temporales exactas (ISO 8601 o Date)
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

  // Metadatos Cognitivos y Biológicos
  cognitiveLoad: number; // 0 = nulo/mecánico, 1 = ligero, 2 = moderado, 3 = foco profundo
  physicalLoad: number;  // 0 = reposo, 1 = suave, 2 = moderado, 3 = extenuante
  energyDrain: EnergyDrain;
  location: string;      // 'Casa', 'Facultad', 'Rambla Casino', 'Ferro', etc.

  // Parámetros de Metas Flotantes (Floating Deadlines)
  deadline?: Date | string;
  totalRequiredMinutes?: number;
  minBlockMinutes?: number; // Foco mínimo (ej. 90 min)
  maxBlockMinutes?: number; // Límite de saturación (ej. 180 min)

  // Parámetros de Rutinas Elásticas y Descanso Inter-Sesión
  splitVariant?: string;     // Ej: 'pecho', 'espalda', 'piernas'
  recoveryDaysNeeded?: number; // Días mínimos de recuperación requeridos
  preferredTimeWindow?: PreferredTimeWindow;

  // Tolerancia a Tardanzas (Punctuality Matrix)
  maxLatenessMinutes?: number;      // 0 = puntualidad militar, >0 = tolerancia suave
  latenessPenaltyWeight?: number;   // Ponderación de penalización en soft constraints

  // Dimensión Económica
  estimatedCostArs?: number;

  // Sincronización Externa
  googleEventId?: string;
  syncEtag?: string;

  createdAt?: string;
  updatedAt?: string;
}
