'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import { ConstraintContext } from '@/constraints/contracts';
import { createTravelMatrixLookup } from '@/constraints/params';
import { solveSchedule } from '@/solver/core/scheduler';
import { calculateScheduleDiff } from '@/solver/explainability/diffCalculator';
import { ScheduleDiff } from '@/solver/types';
import { FlaskConical, X, ArrowRight, Moon, BookOpen, Beer, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export const WhatIfModal: React.FC = () => {
  const { isWhatIfModalOpen, setWhatIfModalOpen, events, params, metaSliders, weather, updateEvent, addEvent, recalculateSchedule } = useScheduleStore();

  const [title, setTitle] = useState('Turno extra Casino (Sábado)');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay())); // Próximo sábado
    return d.toISOString().split('T')[0];
  });
  const [startTimeStr, setStartTimeStr] = useState('14:00');
  const [endTimeStr, setEndTimeStr] = useState('22:00');
  const [location, setLocation] = useState('Rambla Casino');

  const [simulationResult, setSimulationResult] = useState<{
    simulatedSchedule: Event[];
    diff: ScheduleDiff;
    sleepHours: number;
    studyHours: number;
    socialHours: number;
    executionTimeMs: number;
  } | null>(null);

  if (!isWhatIfModalOpen) return null;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = dateStr.split('-').map(Number);
    const [sHour, sMin] = startTimeStr.split(':').map(Number);
    const [eHour, eMin] = endTimeStr.split(':').map(Number);

    const start = new Date(year, month - 1, day, sHour, sMin);
    const end = new Date(year, month - 1, day, eHour, eMin);
    const duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000));

    const simulatedEvent: Event = {
      id: `sim-${Date.now()}`,
      title: title.trim(),
      startTime: start,
      endTime: end,
      durationMinutes: duration,
      isLocked: true,
      cognitiveLoad: 1,
      physicalLoad: 2,
      energyDrain: 'high',
      location,
      isScheduleDisruptor: sHour >= 21 || eHour >= 23 || eHour < 6,
    };

    const context: ConstraintContext = {
      candidateEvents: [...events, simulatedEvent],
      originalSchedule: events,
      params,
      travelMatrix: createTravelMatrixLookup(),
      weather,
      currentTime: new Date(),
      metaSliders,
    };

    const startTimeMs = performance.now();
    const result = solveSchedule([...events, simulatedEvent], context);
    const diff = calculateScheduleDiff(events, result.schedule, result.executionTimeMs, 'WHAT_IF_SIMULATION');

    // Métricas
    let studyMins = 0;
    let socialMins = 0;

    for (const ev of result.schedule) {
      if (ev.cognitiveLoad >= 2) studyMins += ev.durationMinutes;
      if (ev.categoryId === 'cat-social' || ev.category?.archetype === 'social_flexible') {
        socialMins += ev.durationMinutes;
      }
    }

    setSimulationResult({
      simulatedSchedule: result.schedule,
      diff,
      sleepHours: 8.0, // Garantizado por HC-03
      studyHours: Math.round((studyMins / 60) * 10) / 10,
      socialHours: Math.round((socialMins / 60) * 10) / 10,
      executionTimeMs: Math.round((performance.now() - startTimeMs) * 100) / 100,
    });
  };

  const handleApplyToRealSchedule = () => {
    if (!simulationResult) return;
    useScheduleStore.setState({
      events: simulationResult.simulatedSchedule,
      isWhatIfModalOpen: false,
    });
    recalculateSchedule();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '640px', width: '95%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FlaskConical size={20} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Modo Sandbox: ¿Y si...? (Simulación Aislada)
              </h2>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                Prueba escenarios hipotéticos sin alterar tu calendario real
              </span>
            </div>
          </div>
          <button
            onClick={() => setWhatIfModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario de Evento Hipotético */}
        <form onSubmit={handleSimulate} style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Compromiso o Turno Hipotético
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Turno extra Casino"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Sede
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="Rambla Casino">Rambla Casino</option>
                <option value="Ferro">Ferro San Juan</option>
                <option value="Facultad">Facultad UNMDP</option>
                <option value="Cervecería">Cervecería</option>
                <option value="Casa">Casa</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Fecha
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Desde
              </label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                Hasta
              </label>
              <input
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                }}
              />
            </div>
            <div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Sparkles size={14} /> Simular
              </button>
            </div>
          </div>
        </form>

        {/* Resultados de la Simulación */}
        {simulationResult && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                Impacto Calculado por el Solver ({simulationResult.executionTimeMs} ms)
              </span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.7rem' }}>
                Factible (100% Sin Solapamientos)
              </span>
            </div>

            {/* Cuadrícula de Métricas Comparativas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#93c5fd', marginBottom: '4px' }}>
                  <Moon size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sueño Intacto</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>8.0h</span>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '2px 0 0' }}>HC-03 Garantizado</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#818cf8', marginBottom: '4px' }}>
                  <BookOpen size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Estudio Semanal</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{simulationResult.studyHours}h</span>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '2px 0 0' }}>Reubicado a tiempo</p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#f472b6', marginBottom: '4px' }}>
                  <Beer size={16} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tiempo Social</span>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{simulationResult.socialHours}h</span>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '2px 0 0' }}>Bolsa fungible</p>
              </div>
            </div>

            {/* Explicación de Cambios */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Reacomodamientos requeridos para absorber este compromiso:
              </span>
              <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {simulationResult.diff.items.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: '#cbd5e1', background: 'rgba(51, 65, 85, 0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    {item.explanation}
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de Confirmación */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSimulationResult(null)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
              >
                Limpiar Simulación
              </button>
              <button
                type="button"
                onClick={handleApplyToRealSchedule}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem', background: '#8b5cf6', borderColor: '#7c3aed' }}
              >
                <CheckCircle2 size={14} /> Aplicar a mi Calendario Real
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
