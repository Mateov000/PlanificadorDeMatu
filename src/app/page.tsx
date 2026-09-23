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
  const { recalculateSchedule, setWeather, weather } = useScheduleStore();

  const currentWeather = React.useMemo(() => {
    if (!weather || weather.length === 0) return null;
    const nowH = new Date().getHours();
    return weather.find((w) => new Date(w.timestamp).getHours() === nowH) || weather[0];
  }, [weather]);

  useEffect(() => {
    // Consultar clima de Mar del Plata al montar la app
    fetch('/api/weather')
      .then((res) => res.json())
      .then((data) => {
        if (data.forecasts && data.forecasts.length > 0) {
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
          {/* Chip de Estado Clima Dinámico de Mar del Plata */}
          {currentWeather ? (
            <div
              className="glass-panel"
              style={{
                padding: '0.65rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                fontSize: '0.825rem',
                color: currentWeather.isSoutheastStorm ? '#fca5a5' : 'var(--text-secondary)',
                border: currentWeather.isSoutheastStorm ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                background: currentWeather.isSoutheastStorm ? 'rgba(239, 68, 68, 0.1)' : undefined,
              }}
              title={`Viento: ${currentWeather.windSpeedKmh} km/h (Ráfagas ${currentWeather.windGustsKmh} km/h). Confort costero: ${currentWeather.comfortScore}/100. ${currentWeather.isSoutheastStorm ? 'Alerta temporal SE activo: el solver prioriza estudio bajo techo.' : 'Condiciones favorables para salidas exteriores.'}`}
            >
              <CloudSun size={16} color={currentWeather.isSoutheastStorm ? '#ef4444' : 'var(--accent-cyan)'} />
              <span>
                Mardel: {currentWeather.temperatureC}°C | {currentWeather.windSpeedKmh} km/h
                {currentWeather.isSoutheastStorm ? ' ⚠️ Temporal SE' : ` (Confort ${currentWeather.comfortScore})`}
              </span>
            </div>
          ) : (
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
              <span>Microclima Mardel: Conectando...</span>
            </div>
          )}

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
