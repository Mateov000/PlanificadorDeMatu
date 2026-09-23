import { ConstraintParams, TravelMatrixEntry } from '@/types/parameters';

export const defaultConstraintParams: ConstraintParams = {
  // Biológicos y Circadianos
  targetSleepMinutes: 480,        // 8 horas de sueño continuo
  nightThresholdHour: 23.5,       // 23:30 hs
  cognitiveLandingBufferMinutes: 60, // 60 min de descompresión al llegar
  wakeInertiaBufferMinutes: 90,   // 90 min de despertar suave tras disrupción circadiana
  
  // Convivencia y Recuperación Sobria (GHC-01)
  cannabisBufferMinMinutes: 120,  // 2 horas piso mínimo absoluto
  cannabisBufferIdealMinutes: 240,// 4 horas ideal sin impacto familiar
  
  // Logística Espacial (Mar del Plata)
  travelSafetyMarginMinutes: 10,  // 10 min de margen preventivo
  
  // Sociales y Financieros
  weeklySocialTargetHours: 6.0,   // 6 horas semanales orientativas
  weeklyBudgetArs: 50000.0,       // $50.000 ARS semanales para salidas
  
  // Meta-Sliders de Ponderación Global (1.0 = valor neutro normalizado)
  weightAcademic: 1.0,
  weightSocial: 1.0,
  weightWellness: 1.0,
};

/**
 * Matriz Espacial de Tiempos Reales de Viaje en Mar del Plata (en minutos)
 */
export const defaultTravelMatrix: TravelMatrixEntry[] = [
  { origin: 'Casa', destination: 'Facultad', durationMinutes: 25, transportMode: 'colectivo' },
  { origin: 'Facultad', destination: 'Casa', durationMinutes: 25, transportMode: 'colectivo' },
  { origin: 'Casa', destination: 'Rambla Casino', durationMinutes: 30, transportMode: 'colectivo' },
  { origin: 'Rambla Casino', destination: 'Casa', durationMinutes: 30, transportMode: 'colectivo' },
  { origin: 'Casa', destination: 'Ferro', durationMinutes: 30, transportMode: 'colectivo' },
  { origin: 'Ferro', destination: 'Casa', durationMinutes: 30, transportMode: 'colectivo' },
  { origin: 'Facultad', destination: 'Gimnasio', durationMinutes: 15, transportMode: 'colectivo' },
  { origin: 'Casa', destination: 'Gimnasio', durationMinutes: 20, transportMode: 'colectivo' },
  { origin: 'Gimnasio', destination: 'Casa', durationMinutes: 20, transportMode: 'colectivo' },
  { origin: 'Rambla Casino', destination: 'Ferro', durationMinutes: 20, transportMode: 'colectivo' },
];

export function createTravelMatrixLookup(entries: TravelMatrixEntry[] = defaultTravelMatrix) {
  return {
    getTravelMinutes: (origin: string, destination: string): number => {
      if (!origin || !destination || origin === destination) return 0;
      const match = entries.find(
        (e) => e.origin.toLowerCase() === origin.toLowerCase() && e.destination.toLowerCase() === destination.toLowerCase()
      );
      if (match) return match.durationMinutes;
      // Default fallback para desplazamientos dentro de Mar del Plata
      return 25;
    },
  };
}
