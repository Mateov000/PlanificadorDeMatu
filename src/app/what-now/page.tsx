'use client';

import React, { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Clock, CheckCircle, Plus, MapPin, Zap, ArrowRight, Shield } from 'lucide-react';

function parseDate(d?: Date | string): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

export default function WhatNowPage() {
  const { events, updateEvent, recalculateSchedule } = useScheduleStore();

  const now = new Date();

  // Encontrar el evento que está transcurriendo en este instante o el más próximo
  const { currentEvent, nextEvent } = useMemo(() => {
    let current: (typeof events)[0] | null = null;
    let next: (typeof events)[0] | null = null;

    const timedEvents = events
      .filter((e) => e.startTime && e.endTime && !e.isAllDay)
      .sort((a, b) => (parseDate(a.startTime)?.getTime() ?? 0) - (parseDate(b.startTime)?.getTime() ?? 0));

    for (const ev of timedEvents) {
      const start = parseDate(ev.startTime);
      const end = parseDate(ev.endTime);
      if (!start || !end) continue;

      if (start <= now && now <= end) {
        current = ev;
      } else if (start > now && (!next || start < (parseDate(next.startTime) ?? new Date()))) {
        next = ev;
      }
    }

    return { currentEvent: current || next, nextEvent: current ? next : null };
  }, [events, now]);

  const handleFinishEarly = () => {
    if (!currentEvent) return;
    // Ajustar fin al momento actual y reoptimizar el solver
    updateEvent(currentEvent.id, { endTime: new Date() });
    recalculateSchedule();
  };

  const handleNeedMoreTime = () => {
    if (!currentEvent) return;
    const currentEnd = parseDate(currentEvent.endTime) ?? new Date();
    const extendedEnd = new Date(currentEnd.getTime() + 30 * 60 * 1000);
    updateEvent(currentEvent.id, {
      endTime: extendedEnd,
      durationMinutes: currentEvent.durationMinutes + 30,
    });
    recalculateSchedule();
  };

  return (
    <main style={{ padding: '0 1.5rem 3rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Navigation />

      <div style={{ textAlign: 'center', margin: '2.5rem 0 2rem' }}>
        <span className="badge badge-floating" style={{ marginBottom: '0.75rem' }}>
          Enfoque Quirúrgico Sin Parálisis
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          ¿Qué Hago Ahora?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Cero ruido cognitivo. Una sola tarea y tu atención al 100%.
        </p>
      </div>

      {currentEvent ? (
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem 2rem',
            borderRadius: 'var(--radius-lg)',
            borderTop: '5px solid var(--accent-blue)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
              En Progreso
            </span>
            {currentEvent.cognitiveLoad >= 2 && (
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee' }}>
                <Zap size={12} />
                Foco Profundo
              </span>
            )}
            {currentEvent.location && (
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)' }}>
                <MapPin size={12} />
                {currentEvent.location}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', maxWidth: '700px', lineHeight: 1.2 }}>
            {currentEvent.title}
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.1)',
              padding: '0.65rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <Clock size={20} />
            <span>
              {parseDate(currentEvent.startTime)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {parseDate(currentEvent.endTime)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Botones Gigantes de Decisión */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.25rem',
              width: '100%',
              maxWidth: '550px',
              marginTop: '1rem',
            }}
          >
            <button
              onClick={handleFinishEarly}
              className="btn btn-success"
              style={{ padding: '1.15rem 1.5rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            >
              <CheckCircle size={20} />
              <span>Terminé Antes</span>
            </button>

            <button
              onClick={handleNeedMoreTime}
              className="btn btn-secondary"
              style={{ padding: '1.15rem 1.5rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            >
              <Plus size={20} />
              <span>Necesito 30 min Más</span>
            </button>
          </div>

          {nextEvent && (
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>A continuación:</span>
              <strong style={{ color: 'var(--text-secondary)' }}>{nextEvent.title}</strong>
              <span>({parseDate(nextEvent.startTime)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>No hay actividades en curso</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Tu tiempo libre actual está protegido. Puedes descansar o adelantar tareas cuando desees.
          </p>
        </div>
      )}
    </main>
  );
}
