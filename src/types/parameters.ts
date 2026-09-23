export interface ConstraintParams {
  // Biológicos y Circadianos
  targetSleepMinutes: number;           // Ventana ideal de sueño (ej. 480 min = 8h)
  nightThresholdHour: number;           // Hora límite nocturna (ej. 23.5 = 23:30)
  cognitiveLandingBufferMinutes: number;// Aterrizaje post-evento de alto desgaste (ej. 60 min)
  wakeInertiaBufferMinutes: number;     // Inercia neurofisiológica post-despertar desfasado (ej. 90 min)
  
  // Convivencia y Recuperación (GHC-01)
  cannabisBufferMinMinutes: number;     // Piso mínimo absoluto (ej. 120 min)
  cannabisBufferIdealMinutes: number;   // Ventana ideal sobria (ej. 240 min)
  
  // Logística Espacial (Mar del Plata)
  travelSafetyMarginMinutes: number;    // Margen preventivo para transporte público (ej. 10 min)
  
  // Sociales y Financieros
  weeklySocialTargetHours: number;      // Meta semanal de bolsa social (ej. 6h)
  weeklyBudgetArs: number;              // Presupuesto de ocio en ARS (ej. $50.000)

  // Meta-Sliders de Ponderación Global (0.0 a 2.0)
  weightAcademic: number;
  weightSocial: number;
  weightWellness: number;
}

export interface TravelMatrixEntry {
  origin: string;
  destination: string;
  durationMinutes: number;
  transportMode: 'colectivo' | 'a_pie' | 'auto';
}

export interface TravelMatrixLookup {
  getTravelMinutes: (origin: string, destination: string) => number;
}
