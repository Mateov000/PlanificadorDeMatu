'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import { AlertCircle, Flame, X, Clock, MapPin, Shield } from 'lucide-react';

export const PanicButtonModal: React.FC = () => {
  const { isPanicModalOpen, setPanicModalOpen, triggerPanicEviction } = useScheduleStore();

  const now = new Date();
  const defaultHour = Math.min(22, now.getHours() + 1);
  const defaultStartTime = `${defaultHour.toString().padStart(2, '0')}:00`;

  const [title, setTitle] = useState('Cerveza con Juancito');
  const [startTimeStr, setStartTimeStr] = useState(defaultStartTime);
  const [durationHours, setDurationHours] = useState(3);
  const [location, setLocation] = useState('Cervecería / Bar');
  const [cannabisConsumed, setCannabisConsumed] = useState(false);

  if (!isPanicModalOpen) return null;

  const handleTrigger = (e: React.FormEvent) => {
    e.preventDefault();

    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);

    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    const urgentPlan: Event = {
      id: `urgent-${Date.now()}`,
      categoryId: 'cat-social',
      title,
      startTime: start,
      endTime: end,
      durationMinutes: durationHours * 60,
      isLocked: true,
      cannabisConsumed,
      cognitiveLoad: 0,
      physicalLoad: 1,
      energyDrain: 'low',
      location,
      estimatedCostArs: 15000,
    };

    triggerPanicEviction(urgentPlan);
  };

  return (
    <div className="modal-overlay" onClick={() => setPanicModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(244, 63, 94, 0.3)',
              }}
            >
              <Flame size={24} color="var(--accent-rose)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>Botón de Pánico</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                Absorbe planes espontáneos desalojando y reubicando tareas en &lt; 50 ms.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPanicModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleTrigger} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              ¿Qué plan imprevisto surgió?
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cerveza con amigos, Asado, Juntada"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <Clock size={14} />
                <span>Hora de Inicio</span>
              </label>
              <input
                type="time"
                required
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Duración
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#0f172a',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              >
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={3}>3 horas (estándar bar)</option>
                <option value={4}>4 horas</option>
                <option value={5}>5 horas (larga)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              <MapPin size={14} />
              <span>Lugar de Encuentro</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Cervecería Olavarría, Casa Juancito, Costa"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} color="var(--accent-cyan)" />
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Buffer de Convivencia Familiar (GHC-01)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Garantiza margen de descenso sobrio antes de regresar al hogar.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={cannabisConsumed}
              onChange={(e) => setCannabisConsumed(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <AlertCircle size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
            <span>
              El algoritmo congelará lo ocurrido hasta el momento actual y empujará automáticamente las tareas de estudio desplazadas a los mejores huecos libres de los días siguientes.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setPanicModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-panic">
              <Flame size={18} />
              <span>Desalojar y Re-optimizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
