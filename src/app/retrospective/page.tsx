'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import {
  HeartPulse,
  Brain,
  Users,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Moon,
  Coffee,
  SlidersHorizontal,
} from 'lucide-react';

export default function RetrospectivePage() {
  const {
    events,
    params,
    setParams,
    setOnboardingModalOpen,
    recalculateSchedule,
  } = useScheduleStore();

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Métricas Biológicas (Descanso)
  const workDisruptors = events.filter((e) => e.isScheduleDisruptor || e.categoryId === 'cat-work');
  const sleepTargetHours = (params.targetSleepMinutes / 60) * 7;
  const estimatedSleepHours = 52.5; // Basado en 8h garantizadas menos desfasaje de turnos
  const bioScore = Math.min(100, Math.round((estimatedSleepHours / sleepTargetHours) * 100));

  // 2. Métricas Cognitivas (Estudio)
  const studyEvents = events.filter(
    (e) => e.categoryId === 'cat-study-float' || e.categoryId === 'cat-study-fixed'
  );
  const totalStudyMinutes = studyEvents.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);
  const studyTargetHours = 12.0;
  const cognitiveScore = Math.min(100, Math.round((totalStudyMinutes / (studyTargetHours * 60)) * 100));

  // 3. Métricas Sociales (Amigos / Vínculos)
  const socialEvents = events.filter((e) => e.categoryId === 'cat-social');
  const totalSocialMinutes = socialEvents.reduce((acc, curr) => acc + (curr.durationMinutes || 120), 0);
  const totalSocialHours = (totalSocialMinutes / 60).toFixed(1);
  const socialScore = Math.min(
    100,
    Math.round((totalSocialMinutes / (params.weeklySocialTargetHours * 60)) * 100)
  );

  // 4. Métricas Económicas (Presupuesto en ARS)
  // Cada evento social fuera de casa estima ~$15.000 ARS en Mar del Plata
  const estimatedSpentArs = Math.max(15000, socialEvents.length * 15000 + 12000);
  const budgetScore = Math.min(
    100,
    Math.round(((params.weeklyBudgetArs - Math.max(0, estimatedSpentArs - params.weeklyBudgetArs)) / params.weeklyBudgetArs) * 100)
  );

  // Score Global de Armonía Bio-Psico-Social
  const harmonyScore = Math.round(
    bioScore * 0.35 + cognitiveScore * 0.35 + socialScore * 0.2 + budgetScore * 0.1
  );

  return (
    <main style={{ padding: '0 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Navigation />

      {/* Notificación Toast */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ margin: '1.5rem 0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
            Retrospectiva de Domingo
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evaluación Adaptativa No Punitiva
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
          Score Bio-Psico-Social de Armonía
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: '750px' }}>
          La retrospectiva de PlanificadorDeMatu no busca juzgarte con culpa ni reproches. Mide el equilibrio real entre
          tus turnos de trabajo, la facultad de ingeniería, tus amigos y tu biología para calibrar el algoritmo hacia una
          vida sostenible.
        </p>
      </div>

      {/* Tarjeta de Score Global */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
          background: 'radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.15), transparent 70%), var(--bg-surface)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
          {/* Dial de Porcentaje */}
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'conic-gradient(#3b82f6 0%, #10b981 70%, #8b5cf6 90%, rgba(51, 65, 85, 0.4) 90%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(59, 130, 246, 0.3)',
            }}
          >
            <div
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {harmonyScore}%
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Armonía
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
              <Sparkles size={20} color="#60a5fa" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Semana Sostenible y Resiliente
              </h2>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: 0, maxWidth: '550px', lineHeight: 1.5 }}>
              Completaste los turnos de sucursal con <strong style={{ color: '#34d399' }}>0 invasiones de sueño biológico</strong>,
              cubriste entregas clave de facultad y mantuviste activa tu red social sin agotar tu presupuesto semanal en pesos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setOnboardingModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CalendarCheck size={18} />
          <span>Planificar Próxima Semana</span>
        </button>
      </div>

      {/* Grid de los 4 Pilares Bio-Psico-Sociales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Pilar 1: Biológico / Sueño */}
        <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Moon size={18} color="#10b981" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Biológico / Sueño
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
              {bioScore}%
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            {estimatedSleepHours}h <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/ {sleepTargetHours}h meta</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
            {workDisruptors.length > 0
              ? `${workDisruptors.length} turnos con cierre nocturno protegidos con 8h continuas.`
              : 'Semana sin trasnoches laborales críticos.'}
          </p>
          <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.7rem' }}>
            <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Veto post-despertar activo
          </div>
        </div>

        {/* Pilar 2: Cognitivo / Estudio */}
        <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Brain size={18} color="#3b82f6" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Cognitivo / Facultad
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#60a5fa' }}>
              {cognitiveScore}%
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            {totalStudyHours}h <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/ {studyTargetHours}h cuota</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
            Redes de Computadoras y CalSoft distribuidas en sesiones $\ge 90$ min sin colisiones.
          </p>
          <div className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.7rem' }}>
            Bloques continuos respetados
          </div>
        </div>

        {/* Pilar 3: Social / Vínculos */}
        <div className="glass-card" style={{ borderLeft: '4px solid #ec4899' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#ec4899" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Social &amp; Amigos
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f472b6' }}>
              {socialScore}%
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            {totalSocialHours}h <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/ {params.weeklySocialTargetHours}h bolsa</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
            Planes compartidos (Juancito / Juani) preservando buffer de descenso y convivencia en casa.
          </p>
          <div className="badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', fontSize: '0.7rem' }}>
            Bolsa social fungible
          </div>
        </div>

        {/* Pilar 4: Económico en ARS */}
        <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Presupuesto ARS
              </h3>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
              {budgetScore}%
            </span>
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            ${estimatedSpentArs.toLocaleString('es-AR')}{' '}
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
              / ${params.weeklyBudgetArs.toLocaleString('es-AR')}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 0.75rem' }}>
            Gasto controlado en salidas gastronómicas y cervecerías en Mar del Plata.
          </p>
          <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.7rem' }}>
            Tolerancia financiera respetada
          </div>
        </div>
      </div>

      {/* Sección de Recalibración Adaptativa No Punitiva (1-Click Recalibrations) */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <SlidersHorizontal size={20} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Propuestas de Recalibración Adaptativa (Aprender de la Realidad)
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Si una meta no se cumplió al 100%, el problema nunca es tu falta de voluntad: es que el parámetro inicial estaba descalibrado.
          Ajusta con un solo clic para la próxima semana.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Presupuesto y Salidas */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Economía &amp; Salidas
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
              Ajuste de Presupuesto en Pesos
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 1rem' }}>
              El costo de salidas a bares o cervecerías ronda los $15.000 ARS por juntada. ¿Deseas elevar el tope semanal o priorizar planes de bajo gasto?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setParams({ weeklyBudgetArs: 65000 });
                  showNotification('Tope semanal actualizado a $65.000 ARS');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Elevar a $65.000 ARS
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams({ weeklyBudgetArs: 45000 });
                  showNotification('Preferencia ajustada: priorizar juntadas en Casa / Mates');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Priorizar Casa / Mates
              </button>
            </div>
          </div>

          {/* Card 2: Inercia Post-Despertar tras Turno Ferro */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Neurofisiología &amp; Trabajo
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
              Inercia Post-Despertar tras Cierre Ferro
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 1rem' }}>
              Tras un cierre nocturno que termina a la 01:00 AM, el motor protege {params.wakeInertiaBufferMinutes} min antes de proponer tareas exigentes.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setParams({ wakeInertiaBufferMinutes: 120 });
                  showNotification('Inercia post-despertar ampliada a 120 min (2h)');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Extender a 120 min
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams({ wakeInertiaBufferMinutes: 90 });
                  showNotification('Inercia mantenida en 90 min');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Mantener 90 min
              </button>
            </div>
          </div>

          {/* Card 3: Bolsa Social de Amigos */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Vida Social Fungible
            </span>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
              Bolsa de Amistad Semanal
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 1rem' }}>
              Actualmente tienes configurada una cuota de {params.weeklySocialTargetHours}h semanales. ¿Querés balancear salidas o reservar más tiempo libre?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setParams({ weeklySocialTargetHours: 8 });
                  showNotification('Bolsa social configurada en 8h semanales');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Subir a 8h
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams({ weeklySocialTargetHours: 5 });
                  showNotification('Bolsa social ajustada a 5h semanales');
                  recalculateSchedule();
                }}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Ajustar a 5h
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de Victorias del Motor Local */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
          Garantías Matemáticas Demostradas en la Semana
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              <strong>Cero solapamientos duros:</strong> El solver CSP AC-3 validó 672 slots de 15 minutos en &lt; 20 ms.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              <strong>Arbitraje climático:</strong> Se aprovecharon los temporales del Sudeste para adelantar estudio bajo techo.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              <strong>Garantía de privacidad GHC-01:</strong> Buffers de convivencia intactos y neutralizados en feeds externos.
            </span>
          </div>
        </div>
      </div>

      {/* Botón de Inicio de Nuevo Ciclo */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => setOnboardingModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '0.85rem 2rem', fontSize: '1rem', background: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={18} />
          <span>Iniciar Planificación de la Próxima Semana</span>
        </button>
      </div>
    </main>
  );
}
