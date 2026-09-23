import { Event } from '@/types/event';
import { ConstraintContext, HardConstraintRule, HardValidationResult } from '../contracts';

function parseDate(d: Date | string | undefined): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

/**
 * HC-02: Locked Pillars (Inviolabilidad de Compromisos Rígidos)
 * Cualquier evento con `isLocked: true` (turnos confirmados, cursadas con asistencia obligatoria)
 * debe mantener su horario de inicio y fin original intacto sin alteración por el solver.
 */
export const hc02_lockedPillarsRule: HardConstraintRule = {
  id: 'HC-02',
  name: 'Pilares Inamovibles',
  description: 'Protege turnos de trabajo y cursadas inamovibles impidiendo cualquier desplazamiento de horario.',
  enabled: true,

  validate: (candidate: Event[], context: ConstraintContext): HardValidationResult => {
    if (!context.originalSchedule) return { satisfied: true };

    const originalLockedMap = new Map<string, Event>();
    for (const orig of context.originalSchedule) {
      if (orig.isLocked) {
        originalLockedMap.set(orig.id, orig);
      }
    }

    for (const item of candidate) {
      const orig = originalLockedMap.get(item.id);
      if (orig) {
        const origStart = parseDate(orig.startTime)?.getTime();
        const origEnd = parseDate(orig.endTime)?.getTime();
        const candStart = parseDate(item.startTime)?.getTime();
        const candEnd = parseDate(item.endTime)?.getTime();

        if (origStart !== candStart || origEnd !== candEnd) {
          return {
            satisfied: false,
            errorCode: 'HC-02_LOCKED_MOVED',
            reason: `El pilar inamovible "${item.title}" no puede ser modificado ni desplazado en el tiempo.`,
            violatingEventIds: [item.id],
          };
        }
      }
    }

    return { satisfied: true };
  },
};
