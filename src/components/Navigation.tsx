'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Flame, Calendar, Compass, Sliders, Download, PlusCircle, FlaskConical, Plus, Award, CalendarCheck } from 'lucide-react';
import { generateIcsCalendar } from '@/lib/calendar/icsGenerator';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const {
    setPanicModalOpen,
    setTriageModalOpen,
    setWhatIfModalOpen,
    setCreateModalOpen,
    setOnboardingModalOpen,
    events,
  } = useScheduleStore();

  const handleExportIcs = () => {
    const icsContent = generateIcsCalendar(events, 'PlanificadorDeMatu');
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'planificador-de-matu.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header
      className="glass-panel"
      style={{
        margin: '1rem auto 1.5rem',
        padding: '0.85rem 1.5rem',
        maxWidth: '1500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      {/* Logotipo y Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-blue)',
          }}
        >
          <Compass size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
              PlanificadorDeMatu
            </span>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', fontSize: '0.65rem' }}>
              CSP Engine Local
            </span>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Mar del Plata • Rotativo &amp; Universitario
          </span>
        </div>
      </div>

      {/* Enlaces de Navegación */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          href="/"
          className={`btn ${pathname === '/' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Calendar size={15} />
          <span>Semana</span>
        </Link>
        <Link
          href="/what-now"
          className={`btn ${pathname === '/what-now' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Compass size={15} />
          <span>¿Qué Hago Ahora?</span>
        </Link>
        <Link
          href="/settings"
          className={`btn ${pathname === '/settings' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Sliders size={15} />
          <span>Perillas &amp; Reglas</span>
        </Link>
        <Link
          href="/retrospective"
          className={`btn ${pathname === '/retrospective' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <Award size={15} />
          <span>Retrospectiva</span>
        </Link>
      </nav>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setOnboardingModalOpen(true)}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            fontSize: '0.825rem',
            borderColor: 'rgba(37, 99, 235, 0.4)',
            color: '#93c5fd',
            background: 'rgba(37, 99, 235, 0.12)',
          }}
          title="Asistente guiado de planificación dominical de 4 pasos"
        >
          <CalendarCheck size={15} color="#60a5fa" />
          <span>Planificar Domingo</span>
        </button>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
          title="Crear un nuevo bloque de estudio, cursada o hábito"
        >
          <Plus size={15} />
          <span>Crear</span>
        </button>

        <button
          onClick={() => setWhatIfModalOpen(true)}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            fontSize: '0.825rem',
            borderColor: 'rgba(139, 92, 246, 0.4)',
            color: '#c4b5fd',
            background: 'rgba(139, 92, 246, 0.12)',
          }}
          title="Modo Sandbox: Simular escenarios hipotéticos sin alterar tu calendario real"
        >
          <FlaskConical size={15} color="#a78bfa" />
          <span>¿Y si...? Sandbox</span>
        </button>

        <button
          onClick={() => setTriageModalOpen(true)}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
          title="Importar evento externo de Google Calendar"
        >
          <PlusCircle size={15} />
          <span>Importar GCal</span>
        </button>

        <button
          onClick={handleExportIcs}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.825rem' }}
          title="Descargar archivo .ics compatible con Google/Apple Calendar"
        >
          <Download size={15} />
          <span>Exportar .ics</span>
        </button>

        <button
          onClick={() => setPanicModalOpen(true)}
          className="btn btn-panic"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}
        >
          <Flame size={18} />
          <span>Botón de Pánico</span>
        </button>
      </div>
    </header>
  );
};
