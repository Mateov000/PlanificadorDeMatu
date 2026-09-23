'use client';

import React, { useEffect, useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Moon, SunMedium, Sparkles, X } from 'lucide-react';

export const FrictionFeedbackPopover: React.FC = () => {
  const { frictionFeedback, setFrictionFeedback, updateEvent, events } = useScheduleStore();
  const [secondsRemaining, setSecondsRemaining] = useState(4);

  useEffect(() => {
    if (!frictionFeedback) return;
    setSecondsRemaining(4);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFrictionFeedback(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [frictionFeedback, setFrictionFeedback]);

  if (!frictionFeedback) return null;

  const handleReason = (reason: 'fatigue' | 'morning_pref' | 'one_off') => {
    const event = events.find((e) => e.id === frictionFeedback.eventId);

    if (reason === 'fatigue' && event) {
      // Registrar fatiga elevada para esa actividad en ese horario
      updateEvent(event.id, { energyDrain: 'high' });
    } else if (reason === 'morning_pref' && event) {
      // Fijar ventana de conveniencia preferida matutina (08:30 a 13:00)
      updateEvent(event.id, {
        preferredTimeWindow: {
          start: '08:30',
          end: '13:00',
        },
      });
    }

    setFrictionFeedback(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${Math.min(Math.max(20, frictionFeedback.x - 140), window.innerWidth - 320)}px`,
        top: `${Math.min(frictionFeedback.y + 10, window.innerHeight - 220)}px`,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(59, 130, 246, 0.2)',
        maxWidth: '320px',
        width: '100%',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#60a5fa" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
            ¿Por qué moviste este bloque?
          </span>
        </div>
        <button
          onClick={() => setFrictionFeedback(null)}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
        >
          <X size={14} />
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 10px 0', lineHeight: 1.3 }}>
        Ayuda al motor a calibrar tu ritmo real para no volver a sugerir en momentos de fricción:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          onClick={() => handleReason('fatigue')}
          className="btn"
          style={{
            background: 'rgba(51, 65, 85, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Moon size={14} color="#93c5fd" />
          <span>💤 Estaba muy cansado a esa hora</span>
        </button>

        <button
          onClick={() => handleReason('morning_pref')}
          className="btn"
          style={{
            background: 'rgba(51, 65, 85, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#e2e8f0',
            fontSize: '0.75rem',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <SunMedium size={14} color="#fde047" />
          <span>⚡ Prefiero hacer esto de mañana</span>
        </button>

        <button
          onClick={() => handleReason('one_off')}
          className="btn"
          style={{
            background: 'rgba(51, 65, 85, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            color: '#cbd5e1',
            fontSize: '0.75rem',
            padding: '6px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span>🎲 Imprevisto puntual (no cambiar reglas)</span>
        </button>
      </div>

      <div style={{ marginTop: '8px', textAlign: 'right' }}>
        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
          Se auto-cerrará en {secondsRemaining}s...
        </span>
      </div>
    </div>
  );
};
