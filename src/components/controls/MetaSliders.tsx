'use client';

import React, { useState } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { GraduationCap, Beer, Heart, Info, Sparkles } from 'lucide-react';

interface SliderInfo {
  title: string;
  category: string;
  color: string;
  description: string;
  impact: string;
}

const SLIDER_INFOS: Record<'academic' | 'social' | 'wellness', SliderInfo> = {
  academic: {
    title: 'Ponderador Académico',
    category: 'Estudio y Cursadas UNMDP',
    color: 'var(--accent-blue)',
    description:
      'Multiplica la prioridad de las metas universitarias (Redes, CalSoft) en el motor CSP. Valores altos (> 1.0x) priorizan bloques de concentración continua (SC-01) en picos circadianos lúcidos y ventanas de temporal.',
    impact: 'Afecta: Bloques focales de 90 a 180 min, deadlines y regularidad.',
  },
  social: {
    title: 'Ponderador Social',
    category: 'Amigos y Vínculos',
    color: 'var(--accent-rose)',
    description:
      'Modula la flexibilidad de la bolsa social fungible semanal y salidas recreativas (SC-05). Un valor alto protege el tiempo compartido con amigos (ej. birra con Juancito, salidas costeras) y balancea el presupuesto semanal en pesos (ARS).',
    impact: 'Afecta: Bolsa semanal de ocio, balance de gasto ARS y salidas.',
  },
  wellness: {
    title: 'Ponderador de Bienestar',
    category: 'Sueño Biológico y Gimnasio',
    color: 'var(--accent-emerald)',
    description:
      'Protege rigurosamente tus 8 horas de sueño biológico continuo tras turnos nocturnos (HC-03), respeta los 2 días de recuperación muscular entre sesiones de gimnasio (HC-06), y los buffers de aterrizaje post-desgaste.',
    impact: 'Afecta: 8h de sueño garantizado, descanso muscular del gym y amortiguación.',
  },
};

export const MetaSliders: React.FC = () => {
  const { metaSliders, setMetaSliders } = useScheduleStore();
  const [hovered, setHovered] = useState<'academic' | 'social' | 'wellness' | null>(null);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.75rem',
        flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      {/* Slider Académico */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        onMouseEnter={() => setHovered('academic')}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'help',
          }}
        >
          <GraduationCap size={16} />
          <span>Académico</span>
          <Info size={12} style={{ opacity: 0.6 }} />
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.academic}
          onChange={(e) => setMetaSliders({ academic: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
          aria-label="Ponderador Académico"
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.academic.toFixed(1)}x
        </span>

        {hovered === 'academic' && (
          <TooltipCard info={SLIDER_INFOS.academic} value={metaSliders.academic} />
        )}
      </div>

      {/* Slider Social */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        onMouseEnter={() => setHovered('social')}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--accent-rose)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'help',
          }}
        >
          <Beer size={16} />
          <span>Social</span>
          <Info size={12} style={{ opacity: 0.6 }} />
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.social}
          onChange={(e) => setMetaSliders({ social: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
          aria-label="Ponderador Social"
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.social.toFixed(1)}x
        </span>

        {hovered === 'social' && (
          <TooltipCard info={SLIDER_INFOS.social} value={metaSliders.social} />
        )}
      </div>

      {/* Slider Bienestar */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        onMouseEnter={() => setHovered('wellness')}
        onMouseLeave={() => setHovered(null)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--accent-emerald)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'help',
          }}
        >
          <Heart size={16} />
          <span>Bienestar</span>
          <Info size={12} style={{ opacity: 0.6 }} />
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.wellness}
          onChange={(e) => setMetaSliders({ wellness: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
          aria-label="Ponderador Bienestar"
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.wellness.toFixed(1)}x
        </span>

        {hovered === 'wellness' && (
          <TooltipCard info={SLIDER_INFOS.wellness} value={metaSliders.wellness} />
        )}
      </div>
    </div>
  );
};

const TooltipCard: React.FC<{ info: SliderInfo; value: number }> = ({ info, value }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 12px)',
        left: '0',
        width: '310px',
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderLeft: `4px solid ${info.color}`,
        borderRadius: '12px',
        padding: '1rem',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255,255,255,0.05)',
        zIndex: 100,
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>
          {info.title}
        </span>
        <span
          className="badge"
          style={{
            fontSize: '0.7rem',
            background: 'rgba(255,255,255,0.08)',
            color: info.color,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {value.toFixed(1)}x
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
        {info.category}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.65rem' }}>
        {info.description}
      </p>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '0.5rem',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}
      >
        <Sparkles size={12} color={info.color} />
        <span>{info.impact}</span>
      </div>
    </div>
  );
};
