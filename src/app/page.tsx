'use client';

import React, { useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { TimeGridCalendar } from '@/components/calendar/TimeGridCalendar';
import { MetaSliders } from '@/components/controls/MetaSliders';
import { PanicButtonModal } from '@/components/modals/PanicButtonModal';
import { DiffViewerModal } from '@/components/modals/DiffViewerModal';
import { SemanticTriageModal } from '@/components/modals/SemanticTriageModal';
import { CreateEventModal } from '@/components/modals/CreateEventModal';
import { WhatIfModal } from '@/components/modals/WhatIfModal';
import { WeeklyOnboardingModal } from '@/components/modals/WeeklyOnboardingModal';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { FrictionFeedbackPopover } from '@/components/calendar/FrictionFeedbackPopover';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { RefreshCw, CloudSun, ShieldCheck, Clock } from 'lucide-react';

export default function CalendarPage() {
  const { recalculateSchedule, setWeather } = useScheduleStore();

  useEffect(() => {
    // Consultar clima de Mar del Plata al montar la app
    fetch('/api/weather')
      .then((res) => res.json())
      .then((data) => {
        if (data.forecasts) {
          setWeather(data.forecasts);
        }
      })
      .catch((err) => console.log('Clima local en fallback', err));
  }, [setWeather]);

  return (
    <main style={{ padding: '0 1.5rem 3rem', maxWidth: '1500px', margin: '0 auto' }}>
      <Navigation />

      {/* Barra de Control y Tensión Semanal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <MetaSliders />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Chip de Estado Clima */}
          <div
            className="glass-panel"
            style={{
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            <CloudSun size={16} color="var(--accent-cyan)" />
            <span>Microclima Mardel: Óptimo</span>
          </div>

          {/* Chip de Garantía Biológica */}
          <div
            className="glass-panel"
            style={{
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <span>8h Sueño Protegido</span>
          </div>

          {/* Botón de Recálculo Forzado */}
          <button
            onClick={recalculateSchedule}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.1rem', fontSize: '0.85rem' }}
            title="Ejecuta el solver CSP en < 50ms para verificar la configuración óptima"
          >
            <RefreshCw size={15} />
            <span>Re-optimizar Agenda</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula Horaria Continua Proporcional */}
      <TimeGridCalendar />

      {/* Modales Globales */}
      <PanicButtonModal />
      <DiffViewerModal />
      <SemanticTriageModal />
      <CreateEventModal />
      <WhatIfModal />
      <WeeklyOnboardingModal />
      <EditEventModal />
      <FrictionFeedbackPopover />
    </main>
  );
}
