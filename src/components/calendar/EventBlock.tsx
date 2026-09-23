'use client';

import React from 'react';
import { Event } from '@/types/event';
import { Lock, Waves, Shield, Zap, MapPin, Sparkles } from 'lucide-react';

interface EventBlockProps {
  event: Event;
  topPx: number;
  heightPx: number;
  color?: string;
  onClick?: () => void;
  onDismissRepurpose?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  isContinuationFromPrevDay?: boolean;
  continuesToNextDay?: boolean;
}

function formatTime(d?: Date | string): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  topPx,
  heightPx,
  color = '#3b82f6',
  onClick,
  onDismissRepurpose,
  onDragStart,
  isContinuationFromPrevDay,
  continuesToNextDay,
}) => {
  const isShort = heightPx < 45;

  return (
    <div
      className="event-block"
      draggable={!event.isLocked}
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        cursor: event.isLocked ? 'default' : 'grab',
        top: `${topPx}px`,
        height: `${heightPx}px`,
        backgroundColor: `${color}25`, // 15% opacidad
        borderLeftColor: color,
        borderTop: isContinuationFromPrevDay ? '1px dashed rgba(255, 255, 255, 0.4)' : `1px solid ${color}40`,
        borderBottom: continuesToNextDay ? '1px dashed rgba(255, 255, 255, 0.4)' : `1px solid ${color}30`,
        borderRight: `1px solid ${color}30`,
        borderTopLeftRadius: isContinuationFromPrevDay ? '0px' : undefined,
        borderTopRightRadius: isContinuationFromPrevDay ? '0px' : undefined,
        borderBottomLeftRadius: continuesToNextDay ? '0px' : undefined,
        borderBottomRightRadius: continuesToNextDay ? '0px' : undefined,
      }}
      title={`${event.title} (${formatTime(event.startTime)} - ${formatTime(event.endTime)})${isContinuationFromPrevDay ? ' [Continuación]' : ''}${continuesToNextDay ? ' [Continúa mañana]' : ''}`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span className="event-title" style={{ color: '#ffffff' }}>
            {isContinuationFromPrevDay && <span style={{ opacity: 0.7, marginRight: '3px' }}>↳</span>}
            {event.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            {event.isLocked && <span title="Pilar Inamovible"><Lock size={12} color="#fbbf24" /></span>}
            {event.isFloating && <span title="Bloque Flotante"><Waves size={12} color="#818cf8" /></span>}
            {event.isSensitive && <span title="Máscara de Privacidad"><Shield size={12} color="#ec4899" /></span>}
            {event.cognitiveLoad >= 2 && <span title="Alta Demanda Cognitiva"><Zap size={12} color="#38bdf8" /></span>}
          </div>
        </div>

        {!isShort && (
          <div className="event-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>
              {isContinuationFromPrevDay ? '00:00' : formatTime(event.startTime)} -{' '}
              {continuesToNextDay ? '24:00' : formatTime(event.endTime)}
            </span>
            {continuesToNextDay && <span style={{ fontSize: '0.65rem', color: '#93c5fd' }}>→ mañana</span>}
          </div>
        )}
      </div>

      {!isShort && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          {event.location ? (
            <div className="event-location" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={10} />
              <span>{event.location}</span>
            </div>
          ) : <div />}

          {onDismissRepurpose && (event.categoryId === 'cat-social' || event.category?.archetype === 'social_flexible') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismissRepurpose();
              }}
              style={{
                background: 'rgba(236, 72, 153, 0.25)',
                border: '1px solid rgba(236, 72, 153, 0.5)',
                borderRadius: '4px',
                color: '#fbcfe8',
                fontSize: '0.65rem',
                padding: '1px 5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="Descartar este plan social y reutilizar el tiempo para adelantar estudio o gimnasio"
            >
              <Sparkles size={10} /> Reutilizar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
