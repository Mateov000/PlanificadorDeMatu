import { Event } from '@/types/event';

function formatTime(d?: Date): string {
  if (!d) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDay(d?: Date): string {
  if (!d) return '';
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[d.getDay()];
}

/**
 * Generador Simbólico de Explicaciones Paramétricas (Cero IA / Latencia < 1 ms / Costo $0)
 * Asocia causas matemáticas exactas a explicaciones transparentes en lenguaje natural.
 */
export function generateParametricExplanation(
  event: Event,
  causeCode: string,
  options: {
    originalStart?: Date;
    newStart?: Date;
    newEnd?: Date;
    disruptingEventTitle?: string;
    targetSleepHours?: number;
    hoursPassed?: string;
  } = {}
): string {
  const { newStart, disruptingEventTitle, targetSleepHours = 8 } = options;
  const newTimeStr = formatTime(newStart);
  const dayStr = formatDay(newStart);

  switch (causeCode) {
    case 'HC-03_SLEEP':
      return `• ${event.title} se pospuso para el ${dayStr} a las ${newTimeStr} para respetar tus ${targetSleepHours}h de sueño ininterrumpido tras la trasnochada.`;

    case 'HC-04_LANDING_BAN':
      return `• ${event.title} se reprogramó para el ${dayStr} a las ${newTimeStr} para evitar carga mental en la ventana de aterrizaje y descompresión post-actividad.`;

    case 'HC-04_WAKE_INERTIA_BAN':
      return `• ${event.title} se movió para el ${dayStr} a las ${newTimeStr} para no invadir la inercia post-despertar tras un descanso desfasado.`;

    case 'HC-01_OVERLAP':
      return `• ${event.title} se reacomodó para el ${dayStr} a las ${newTimeStr} porque colisionaba con ${disruptingEventTitle || 'otro compromiso'}. Sigue cumpliendo con su fecha de entrega.`;

    case 'HC-05_TRAVEL':
      return `• ${event.title} se desplazó a las ${newTimeStr} para garantizar el tiempo de viaje real en colectivo entre sedes.`;

    case 'HC-06_SPLIT_OVERLOAD':
      return `• ${event.title} se movió al ${dayStr} para respetar el descanso fisiológico mínimo entre sesiones de entrenamiento.`;

    case 'GHC-01_CANNABIS':
      return `• Llegada a casa ajustada para garantizar el margen sobrio familiar completo acordado antes de interactuar en el hogar.`;

    case 'PANIC_EVICTION':
      return `• ${event.title} fue desalojado ante un plan espontáneo prioritario y reubicado para el ${dayStr} a las ${newTimeStr}.`;

    case 'SC-03_WEATHER':
      return `• ${event.title} se programó en interior durante el temporal para aprovechar el mal clima y liberar días soleados.`;

    case 'DISMISS_REPURPOSE':
      return `• ${event.title} se adelantó para el ${dayStr} a las ${newTimeStr} capitalizando el tiempo libre del plan social descartado.`;

    default:
      return `• ${event.title} se optimizó para el ${dayStr} a las ${newTimeStr} maximizando el balance semanal.`;
  }
}
