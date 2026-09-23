'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Sparkles, X, Check, BookmarkCheck, Calendar } from 'lucide-react';

export const SemanticTriageModal: React.FC = () => {
  const { isTriageModalOpen, setTriageModalOpen, categories, addEvent } = useScheduleStore();

  const [rawTitle, setRawTitle] = useState('Turno Casino');
  const [selectedCategory, setSelectedCategory] = useState('cat-work');
  const [location, setLocation] = useState('Rambla Casino');
  const [isLocked, setIsLocked] = useState(true);
  const [rememberRule, setRememberRule] = useState(true);

  if (!isTriageModalOpen) return null;

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 22, 0);

    addEvent({
      id: `imported-${Date.now()}`,
      categoryId: selectedCategory,
      title: rawTitle,
      startTime: start,
      endTime: end,
      durationMinutes: 480,
      isLocked,
      location,
      cognitiveLoad: 1,
      physicalLoad: 2,
      energyDrain: 'high',
    });

    setTriageModalOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setTriageModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Calendar size={22} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>Wizard de Triage Semántico</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Clasifica eventos de Google Calendar para que el solver entienda su física real.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTriageModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Título del Evento Externo
            </label>
            <input
              type="text"
              required
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Categoría / Arquetipo
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.archetype})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Sede / Ubicación
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Facultad, Rambla Casino, etc."
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
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Pilar Inamovible (Candado Hard)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                El solver nunca podrá mover ni solapar este evento.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookmarkCheck size={18} color="var(--accent-emerald)" />
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  Recordar regla de auto-mapeo
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Aplica estos parámetros automáticamente a futuros eventos con este nombre.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={rememberRule}
              onChange={(e) => setRememberRule(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setTriageModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={18} />
              <span>Guardar y Clasificar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
