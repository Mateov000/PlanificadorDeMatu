'use client';

import React from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { CheckCircle2, RotateCcw, Zap, Sparkles, X, ArrowRight } from 'lucide-react';

export const DiffViewerModal: React.FC = () => {
  const { isDiffModalOpen, activeDiff, applyProposedSchedule, discardProposedSchedule } = useScheduleStore();

  if (!isDiffModalOpen || !activeDiff) return null;

  return (
    <div className="modal-overlay" onClick={discardProposedSchedule}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '700px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles size={20} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                Propuesta de Reoptimización
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <Zap size={12} />
                Cálculo: {activeDiff.executionTimeMs} ms
              </span>
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Costo: $0 (Cero IA Externa)
              </span>
            </div>
          </div>
          <button
            onClick={discardProposedSchedule}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {activeDiff.summary}
        </p>

        {/* Lista de cambios y traza de restricciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
          {activeDiff.items.map((item, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '1rem',
                borderLeft: '4px solid var(--accent-blue)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>
                  {item.eventTitle}
                </span>
                <span
                  className="badge"
                  style={{
                    fontSize: '0.68rem',
                    background: item.changeType === 'added' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: item.changeType === 'added' ? '#34d399' : '#93c5fd',
                  }}
                >
                  {item.changeType === 'added' ? 'Nuevo' : 'Reubicado'}
                </span>
              </div>

              {item.originalStart && item.newStart && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>
                    {item.originalStart.toLocaleDateString([], { weekday: 'short' })} {item.originalStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ArrowRight size={12} />
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {item.newStart.toLocaleDateString([], { weekday: 'short' })} {item.newStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.2rem' }}>
                {item.explanation}
              </p>
            </div>
          ))}
        </div>

        {/* Acciones del DiffViewer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={discardProposedSchedule}>
            <RotateCcw size={16} />
            <span>Mantener Agenda Como Está</span>
          </button>
          <button className="btn btn-success" onClick={applyProposedSchedule}>
            <CheckCircle2 size={18} />
            <span>Aplicar Propuesta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
