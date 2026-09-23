'use client';

import React from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { CheckCircle2, RotateCcw, Zap, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

export const DiffViewerModal: React.FC = () => {
  const { isDiffModalOpen, activeDiff, applyProposedSchedule, discardProposedSchedule } = useScheduleStore();

  if (!isDiffModalOpen || !activeDiff) return null;

  const isOptimal = activeDiff.items.length === 0;

  return (
    <div className="modal-overlay" onClick={discardProposedSchedule}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '700px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Sparkles size={20} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
                {isOptimal ? 'Estado de Optimización' : 'Propuesta de Reoptimización'}
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

        {isOptimal ? (
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <ShieldCheck size={28} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#34d399', margin: '0 0 0.35rem 0' }}>
                Agenda libre de conflictos y 100% viable
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                El motor CSP evaluó todas las restricciones biológicas y de agenda:
                se garantizan 8h de sueño ininterrumpido post-turnos, cuotas de estudio continuo y márgenes de viaje sin solapamientos.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem', maxHeight: '350px', overflowY: 'auto' }}>
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
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
          {isOptimal ? (
            <button className="btn btn-primary" onClick={discardProposedSchedule} style={{ padding: '0.6rem 1.5rem' }}>
              <CheckCircle2 size={16} />
              <span>Entendido</span>
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={discardProposedSchedule}>
                <RotateCcw size={16} />
                <span>Mantener Agenda Como Está</span>
              </button>
              <button className="btn btn-success" onClick={applyProposedSchedule}>
                <CheckCircle2 size={18} />
                <span>Aplicar Propuesta</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
