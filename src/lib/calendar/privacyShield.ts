import { Event } from '@/types/event';

export interface ShieldedEvent extends Event {
  isShielded: boolean;
}

/**
 * Aplica máscaras de privacidad sobre eventos sensibles para vistas compartidas y exportaciones externas
 */
export function applyPrivacyShield(event: Event): ShieldedEvent {
  if (!event.isSensitive) {
    return { ...event, isShielded: false };
  }

  return {
    ...event,
    title: event.displayAlias || 'Compromiso Personal',
    description: undefined, // Ocultar notas íntimas
    isShielded: true,
  };
}
