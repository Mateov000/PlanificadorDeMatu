import { Event } from '@/types/event';
import { ConstraintParams, TravelMatrixLookup } from '@/types/parameters';
import { WeatherForecast } from '@/types/weather';

export interface ConstraintContext {
  /** Todos los eventos candidatos bajo evaluación */
  candidateEvents: Event[];
  /** La agenda original previa al recálculo (para evaluar deltas y alimentar el DiffViewer) */
  originalSchedule?: Event[];
  /** Parámetros globales del usuario (biológicos, traslados, márgenes) */
  params: ConstraintParams;
  /** Lookup de matriz de traslados espaciales de Mar del Plata */
  travelMatrix: TravelMatrixLookup;
  /** Pronóstico meteorológico de Mar del Plata (horario) */
  weather?: WeatherForecast[];
  /** Timestamp actual de ejecución (t_now) para congelar el pasado */
  currentTime: Date;
  /** Sliders de ponderación activos */
  metaSliders: {
    academic: number;
    social: number;
    wellness: number;
  };
}

/**
 * Resultado de validación de una Hard Constraint (Fase 1: Poda Booleana AC-3)
 */
export interface HardValidationResult {
  satisfied: boolean;
  /** Código simbólico estandarizado para trazabilidad sin IA (ej: 'HC-03_SLEEP') */
  errorCode?: string;
  /** Razón legible y paramétrica en español */
  reason?: string;
  /** IDs de los eventos causantes del conflicto */
  violatingEventIds?: string[];
  /** Sugerencia determinista de resolución (offset en minutos) */
  suggestedOffsetMinutes?: number;
}

/**
 * Regla de Restricción Dura (Hard Constraint - Inviolable)
 */
export interface HardConstraintRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  enabled: boolean;
  /**
   * Evalúa la agenda candidata. Si retorna satisfied: false, el plan es matemáticamente
   * inválido (penalización infinita) y se poda inmediatamente en el árbol de búsqueda.
   */
  validate: (candidate: Event[], context: ConstraintContext) => HardValidationResult;
}

/**
 * Categorías funcionales de Soft Constraints para ponderación por Meta-Sliders
 */
export type SoftRuleCategory = 'academic' | 'social' | 'wellness' | 'logistics';

/**
 * Regla de Restricción Blanda (Soft Constraint - Optimización Aritmética)
 */
export interface SoftConstraintRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: SoftRuleCategory;
  /** Peso base asignado a la regla (1.0 por defecto) */
  defaultWeight: number;
  enabled: boolean;
  /**
   * Evalúa la agenda candidata y retorna una penalización normalizada entre 0.0 (perfecto)
   * y 1.0 (máxima penalización admisible sin ser inválida).
   */
  evaluate: (candidate: Event[], context: ConstraintContext) => number;
  /** Genera la explicación paramétrica del impacto del costo si aplica */
  explainScore?: (candidate: Event[], context: ConstraintContext) => string | null;
}

/**
 * Contrato del Registro Central de Restricciones
 */
export interface ConstraintRegistryContract {
  hardRules: HardConstraintRule[];
  softRules: SoftConstraintRule[];
  registerHardRule: (rule: HardConstraintRule) => void;
  registerSoftRule: (rule: SoftConstraintRule) => void;
  setRuleEnabled: (id: string, enabled: boolean) => void;
  getHardRules: () => HardConstraintRule[];
  getSoftRules: () => SoftConstraintRule[];
}
