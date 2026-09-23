'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import {
  CalendarCheck,
  Briefcase,
  GraduationCap,
  CloudRain,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const WeeklyOnboardingModal: React.FC = () => {
  const {
    isOnboardingModalOpen,
    setOnboardingModalOpen,
    addEvent,
    recalculateSchedule,
    weather,
    currentWeekStart,
  } = useScheduleStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Turnos
  const [shifts, setShifts] = useState([
    { id: 'shift-1', day: 'Viernes', branch: 'Ferro', start: '18:00', end: '01:00', enabled: true },
    { id: 'shift-2', day: 'Sábado', branch: 'Rambla Casino', start: '14:00', end: '22:00', enabled: true },
  ]);

  // Paso 2: Objetivos de Facultad
  const [studyGoals, setStudyGoals] = useState([
    { id: 'goal-1', title: 'Redes de Computadoras', hours: 6, deadlineDay: 'Viernes 20:00' },
    { id: 'goal-2', title: 'Calidad de Software (CalSoft)', hours: 4, deadlineDay: 'Jueves 19:00' },
  ]);

  if (!isOnboardingModalOpen) return null;

  const handleFinishOnboarding = () => {
    // Generar eventos de turnos confirmados para la semana en vista
    const monday = new Date(currentWeekStart);

    for (const shift of shifts) {
      if (!shift.enabled) continue;
      const dayOffset = shift.day === 'Viernes' ? 4 : shift.day === 'Sábado' ? 5 : 2;
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + dayOffset);

      const [sH, sM] = shift.start.split(':').map(Number);
      const [eH, eM] = shift.end.split(':').map(Number);

      const startTime = new Date(targetDate);
      startTime.setHours(sH, sM, 0, 0);

      const endTime = new Date(targetDate);
      if (eH < sH) {
        endTime.setDate(endTime.getDate() + 1); // Cruza medianoche
      }
      endTime.setHours(eH, eM, 0, 0);

      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));

      const shiftEvent: Event = {
        id: `onboard-shift-${Date.now()}-${shift.id}`,
        title: `Turno ${shift.branch}`,
        categoryId: 'cat-work',
        startTime,
        endTime,
        durationMinutes,
        isLocked: true,
        isScheduleDisruptor: shift.branch === 'Ferro' || eH < 6 || eH >= 23,
        cognitiveLoad: 1,
        physicalLoad: 2,
        energyDrain: 'high',
        location: shift.branch === 'Ferro' ? 'Ferro' : 'Rambla Casino',
      };

      addEvent(shiftEvent);
    }

    // Generar metas flotantes de estudio
    for (const goal of studyGoals) {
      const deadlineDate = new Date(monday);
      deadlineDate.setDate(monday.getDate() + (goal.deadlineDay.startsWith('Jueves') ? 3 : 4));
      deadlineDate.setHours(20, 0, 0, 0);

      const studyGoalEvent: Event = {
        id: `onboard-goal-${Date.now()}-${goal.id}`,
        title: `Estudio ${goal.title}`,
        categoryId: 'cat-study-float',
        durationMinutes: goal.hours * 60,
        totalRequiredMinutes: goal.hours * 60,
        minBlockMinutes: 90,
        maxBlockMinutes: 180,
        isFloating: true,
        deadline: deadlineDate,
        cognitiveLoad: 3,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      };

      addEvent(studyGoalEvent);
    }

    setOnboardingModalOpen(false);
    recalculateSchedule();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '600px', width: '95%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarCheck size={20} color="#60a5fa" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Planificación Semanal de Domingo (Weekly Onboarding)
              </h2>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                Paso {step} de 4 • Armoniza trabajo, estudio y microclima en 3 minutos
              </span>
            </div>
          </div>
          <button
            onClick={() => setOnboardingModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicador de Pasos */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? 'var(--accent-blue)' : 'rgba(51, 65, 85, 0.4)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Contenido Paso 1: Turnos de la Semana */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <Briefcase size={16} color="#f59e0b" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                1. Confirma tus turnos laborales para esta semana
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              Los cierres de Ferro proyectarán automáticamente 8h de sueño continuas y veto cognitivo post-despertar.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {shifts.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
                      {s.day}: {s.branch}
                    </span>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} />
                      <span>{s.start} - {s.end} hs</span>
                      {s.branch === 'Ferro' && <span style={{ color: '#fbbf24' }}>• Cierre Nocturno</span>}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={(e) => {
                        const updated = [...shifts];
                        updated[idx].enabled = e.target.checked;
                        setShifts(updated);
                      }}
                    />
                    <span>Activo</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido Paso 2: Objetivos de Estudio */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <GraduationCap size={16} color="#60a5fa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                2. Cuotas semanales de estudio de la facultad
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              El solver dividirá automáticamente cada total en bloques de 90 a 180 min antes del deadline.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {studyGoals.map((g, idx) => (
                <div
                  key={g.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ffffff' }}>
                      {g.title}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#cbd5e1', background: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                      Vence: {g.deadlineDay}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Horas Requeridas:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={g.hours}
                      onChange={(e) => {
                        const updated = [...studyGoals];
                        updated[idx].hours = Number(e.target.value);
                        setStudyGoals(updated);
                      }}
                      style={{
                        width: '70px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>horas en la semana</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenido Paso 3: Clima de Mar del Plata */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <CloudRain size={16} color="#06b6d4" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                3. Previsualización del Microclima (Mar del Plata)
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              El motor arbitrará el tiempo: si hay temporal SE concentra estudio en casa y libera días soleados.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '8px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Viernes / Sábado (Pronóstico)
                </span>
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'block' }}>
                  Posible viento Sudeste &gt; 35 km/h
                </span>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  El solver anticipará estudio bajo techo en Casa.
                </p>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Domingo (Pronóstico)
                </span>
                <span style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, display: 'block' }}>
                  Templado, soleado, brisa suave
                </span>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  Tarde costera libre de estudio pesado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Paso 4: Propuesta Final */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <Sparkles size={16} color="#a855f7" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                4. Todo listo para optimizar la semana
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
              El solver CSP combinará tus turnos, estudio y pausas en menos de 50 ms.
            </p>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                  Garantías del Algoritmo:
                </span>
              </div>
              <ul style={{ fontSize: '0.75rem', color: '#cbd5e1', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
                <li>8 horas de sueño ininterrumpido post-cierre de Ferro aseguradas.</li>
                <li>Redes y CalSoft distribuidas en bloques continuos $\ge 90$ min sin solapamientos.</li>
                <li>Tiempo de viaje en colectivo inyectado automáticamente entre sedes.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Botones de Navegación del Wizard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '1rem' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Anterior
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Siguiente <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} /> Generar y Aprobar Propuesta Semanal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
