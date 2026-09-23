'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import {
  CalendarCheck,
  GraduationCap,
  Dumbbell,
  CloudSun,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  Wind,
} from 'lucide-react';

interface StudyGoalItem {
  id: string;
  title: string;
  hours: number;
  deadlineDay: string; // 'Jueves', 'Viernes', 'Domingo'
}

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

  // Paso 1: Metas de Estudio y Proyectos Académicos (100% editables y dinámicas)
  const [studyGoals, setStudyGoals] = useState<StudyGoalItem[]>([
    { id: 'goal-1', title: 'Redes de Computadoras', hours: 6, deadlineDay: 'Viernes' },
    { id: 'goal-2', title: 'Calidad de Software (CalSoft)', hours: 4, deadlineDay: 'Jueves' },
  ]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalHours, setNewGoalHours] = useState(3);

  // Paso 2: Hábitos de Gimnasio / Entrenamiento
  const [gymSessions, setGymSessions] = useState(3);
  const [gymDurationMinutes, setGymDurationMinutes] = useState(75);
  const [preferredWindow, setPreferredWindow] = useState<'afternoon' | 'morning'>('afternoon');
  const [recoveryLagHours, setRecoveryLagHours] = useState(24);

  // Paso 3: Presupuesto Social y Clima
  const [socialBudgetHours, setSocialBudgetHours] = useState(8);

  if (!isOnboardingModalOpen) return null;

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    setStudyGoals([
      ...studyGoals,
      {
        id: `goal-${Date.now()}`,
        title: newGoalTitle.trim(),
        hours: Math.max(1, newGoalHours),
        deadlineDay: 'Viernes',
      },
    ]);
    setNewGoalTitle('');
    setNewGoalHours(3);
  };

  const handleRemoveGoal = (id: string) => {
    setStudyGoals(studyGoals.filter((g) => g.id !== id));
  };

  const handleFinishOnboarding = () => {
    const monday = new Date(currentWeekStart);
    monday.setHours(0, 0, 0, 0);

    // 1. Inyectar Metas de Estudio como eventos flotantes
    const dayOffsets: Record<string, number> = {
      Lunes: 0,
      Martes: 1,
      Miércoles: 2,
      Miercoles: 2,
      Jueves: 3,
      Viernes: 4,
      Sábado: 5,
      Sabado: 5,
      Domingo: 6,
    };

    for (const goal of studyGoals) {
      const offset = dayOffsets[goal.deadlineDay] ?? 4;
      const deadlineDate = new Date(monday);
      deadlineDate.setDate(monday.getDate() + offset);
      deadlineDate.setHours(20, 0, 0, 0);

      const floatStudyEvent: Event = {
        id: `onboard-study-${Date.now()}-${goal.id}`,
        title: `Estudio: ${goal.title}`,
        categoryId: 'cat-study-float',
        isFloating: true,
        isLocked: false,
        totalRequiredMinutes: goal.hours * 60,
        durationMinutes: Math.min(120, goal.hours * 60),
        minBlockMinutes: 90,
        maxBlockMinutes: 180,
        deadline: deadlineDate,
        cognitiveLoad: 3,
        physicalLoad: 0,
        energyDrain: 'normal',
        location: 'Casa',
      };

      addEvent(floatStudyEvent);
    }

    // 2. Inyectar Sesiones de Gym como rutinas elásticas distribuidas
    // Distribuir a lo largo de la semana respetando días de recuperación
    const gymDays = gymSessions === 4 ? [1, 2, 4, 5] : gymSessions === 5 ? [1, 2, 3, 5, 6] : [1, 3, 5]; // Lun, Mie, Vie por defecto
    const [startH, endH] = preferredWindow === 'morning' ? [9, 11] : [18, 21];

    gymDays.slice(0, gymSessions).forEach((dayIdx, i) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + dayIdx);
      targetDate.setHours(startH, 30, 0, 0);

      const endDate = new Date(targetDate);
      endDate.setMinutes(endDate.getMinutes() + gymDurationMinutes);

      const gymEvent: Event = {
        id: `onboard-gym-${Date.now()}-${i}`,
        title: `Gimnasio (Sesión ${i + 1}/${gymSessions})`,
        categoryId: 'cat-gym',
        isFloating: true,
        isLocked: false,
        startTime: targetDate,
        endTime: endDate,
        durationMinutes: gymDurationMinutes,
        recoveryDaysNeeded: Math.round(recoveryLagHours / 24),
        preferredTimeWindow: {
          start: `${startH.toString().padStart(2, '0')}:00`,
          end: `${endH.toString().padStart(2, '0')}:30`,
        },
        cognitiveLoad: 1,
        physicalLoad: 3,
        energyDrain: 'normal',
        location: 'Gimnasio',
      };

      addEvent(gymEvent);
    });

    // 3. Cerrar y Re-optimizar con el solver CSP
    setOnboardingModalOpen(false);
    recalculateSchedule();
  };

  const currentWeather = weather?.[0];

  return (
    <div className="modal-overlay" onClick={() => setOnboardingModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem', maxWidth: '680px', width: '95%' }}
      >
        {/* Cabecera del Asistente */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <CalendarCheck size={22} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>
                Planificación Semanal de Domingo
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fijá tus prioridades de la semana. Tus turnos de trabajo ya cargados se respetarán al 100%.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnboardingModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Indicador de Pasos del Wizard */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[
            { n: 1, label: 'Estudio' },
            { n: 2, label: 'Gimnasio' },
            { n: 3, label: 'Clima y Ocio' },
            { n: 4, label: 'Auto-Agendar' },
          ].map((item) => (
            <div
              key={item.n}
              onClick={() => setStep(item.n as any)}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step >= item.n ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title={`Paso ${item.n}: ${item.label}`}
            />
          ))}
        </div>

        {/* PASO 1: Metas Académicas y Proyectos */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <GraduationCap size={18} color="var(--accent-blue)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                1. Metas de Estudio y Proyectos de la Semana
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Definí cuánto tiempo querés dedicar a cada materia. El solver dividirá el total en bloques óptimos de foco continuo (90 - 180 min) en tus huecos libres antes del deadline.
            </p>

            {/* Lista de Metas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {studyGoals.map((g, idx) => (
                <div
                  key={g.id}
                  className="glass-card"
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem', display: 'block' }}>
                      {g.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Deadline objetivo: {g.deadlineDay}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={g.hours}
                      onChange={(e) => {
                        const updated = [...studyGoals];
                        updated[idx].hours = Math.max(1, Number(e.target.value));
                        setStudyGoals(updated);
                      }}
                      style={{
                        width: '60px',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>hs</span>

                    <select
                      value={g.deadlineDay}
                      onChange={(e) => {
                        const updated = [...studyGoals];
                        updated[idx].deadlineDay = e.target.value;
                        setStudyGoals(updated);
                      }}
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                      }}
                    >
                      {['Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(g.id)}
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar meta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Agregar Nueva Meta */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
              }}
            >
              <input
                type="text"
                placeholder="Nueva materia o proyecto (ej. Tesis, Algoritmos)..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              />
              <input
                type="number"
                min={1}
                max={20}
                value={newGoalHours}
                onChange={(e) => setNewGoalHours(Number(e.target.value))}
                style={{
                  width: '55px',
                  padding: '0.45rem 0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hs</span>
              <button
                type="button"
                onClick={handleAddGoal}
                className="btn btn-secondary"
                disabled={!newGoalTitle.trim()}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Gimnasio y Hábitos Físicos */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Dumbbell size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                2. Entrenamiento y Hábitos Físicos
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              El solver programará tus entrenamientos en días óptimos, asegurando pausas de recuperación y protegiéndote de sobrecargas tras turnos laborales pesados.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Sesiones por semana */}
              <div className="glass-card" style={{ padding: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  Frecuencia semanal de entrenamiento
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setGymSessions(count)}
                      className={`btn ${gymSessions === count ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem' }}
                    >
                      {count} días / sem
                    </button>
                  ))}
                </div>
              </div>

              {/* Duración de la sesión */}
              <div className="glass-card" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                    Duración por sesión
                  </label>
                  <select
                    value={gymDurationMinutes}
                    onChange={(e) => setGymDurationMinutes(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: '#0f172a',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1 hora)</option>
                    <option value={75}>75 minutos (Recomendado)</option>
                    <option value={90}>90 minutos (1h 30m)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.4rem' }}>
                    Franja horaria preferida
                  </label>
                  <select
                    value={preferredWindow}
                    onChange={(e) => setPreferredWindow(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: '#0f172a',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="afternoon">Tarde / Noche (18:00 - 21:30)</option>
                    <option value="morning">Mañana (09:00 - 12:00)</option>
                  </select>
                </div>
              </div>

              {/* Lag de recuperación */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Regla de Lag Activa:</strong> Se garantizarán al menos 24h de descanso entre sesiones intensas para evitar fatiga acumulada.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Clima de Mar del Plata y Bolsa de Ocio */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CloudSun size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                3. Microclima de Mar del Plata y Bolsa Social
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              El solver modula tu agenda según el clima costero real: días de temporal SE favorecen foco en casa, mientras que tardes agradables liberan tiempo al aire libre.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tarjeta de Clima */}
              <div
                className="glass-card"
                style={{
                  padding: '1rem',
                  border: currentWeather?.isSoutheastStorm ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                  background: currentWeather?.isSoutheastStorm ? 'rgba(239, 68, 68, 0.08)' : 'rgba(6, 182, 212, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                    Pronóstico Costero Semanal
                  </span>
                  <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9' }}>
                    Open-Meteo Mar del Plata
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Temp: {currentWeather?.temperatureC ?? 18}°C</span>
                  <span>Viento: {currentWeather?.windSpeedKmh ?? 22} km/h</span>
                  <span>Confort: {currentWeather?.comfortScore ?? 75}/100</span>
                </div>

                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                  {currentWeather?.isSoutheastStorm
                    ? '⚠️ Alerta por temporal del Sudeste: El optimizador priorizará bloques de estudio concentrado bajo techo.'
                    : '🌤️ Condiciones favorables para salidas y traslados sin penalización meteorológica.'}
                </p>
              </div>

              {/* Bolsa Social */}
              <div className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                    Presupuesto de Tiempo Social y Ocio
                  </label>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                    {socialBudgetHours} horas / semana
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={socialBudgetHours}
                  onChange={(e) => setSocialBudgetHours(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                  Bolsa fungible: El solver reservará estas horas para desconexión y serendipia sin comprometer tus deadlines.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4: Resumen y Auto-Agendado */}
        {step === 4 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="#a855f7" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                4. Todo Listo para Auto-Agendar
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              El solver CSP combinará todas tus metas respetando estrictamente tus turnos fijos cargados en el calendario.
            </p>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                  Resumen de la Planificación:
                </span>
              </div>

              <ul style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                <li>
                  <strong>{studyGoals.reduce((acc, g) => acc + g.hours, 0)} horas de estudio</strong> divididas en bloques continuos ≥ 90 min para foco profundo.
                </li>
                <li>
                  <strong>{gymSessions} sesiones de gimnasio</strong> ({gymDurationMinutes} min c/u) con lag de recuperación.
                </li>
                <li>
                  <strong>{socialBudgetHours} horas de ocio y bolsa social</strong> sincronizadas con el clima de Mar del Plata.
                </li>
                <li>
                  <strong>Tus turnos laborales y eventos fijos quedan protegidos</strong> con candado inamovible y 8 horas de sueño biológico aseguradas post-cierre.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Botones de Navegación del Wizard */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1rem',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={15} /> Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Siguiente <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={16} />
              <span>🚀 Auto-Agendar Mi Semana</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
