'use client';

import React from 'react';
import { Event } from '@/types/event';
import { Lock, Waves, Shield, Zap, MapPin } from 'lucide-react';

interface EventBlockProps {
  event: Event;
  topPx: number;
  heightPx: number;
  color?: string;
  onClick?: () => void;
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
}) => {
  const isShort = heightPx < 45;

  return (
    <div
      className="event-block"
      onClick={onClick}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        backgroundColor: `${color}25`, // 15% opacidad
        borderLeftColor: color,
        borderTop: `1px solid ${color}40`,
        borderRight: `1px solid ${color}30`,
        borderBottom: `1px solid ${color}30`,
      }}
      title={`${event.title} (${formatTime(event.startTime)} - ${formatTime(event.endTime)})`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span className="event-title" style={{ color: '#ffffff' }}>
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
          <div className="event-meta">
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
        )}
      </div>

      {!isShort && event.location && (
        <div className="event-location" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <MapPin size={10} />
          <span>{event.location}</span>
        </div>
      )}
    </div>
  );
};
