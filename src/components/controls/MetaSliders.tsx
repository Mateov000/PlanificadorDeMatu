'use client';

import React from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { GraduationCap, Beer, Heart } from 'lucide-react';

export const MetaSliders: React.FC = () => {
  const { metaSliders, setMetaSliders } = useScheduleStore();

  return (
    <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.85rem' }}>
          <GraduationCap size={16} />
          <span>Académico</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.academic}
          onChange={(e) => setMetaSliders({ academic: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.academic.toFixed(1)}x
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', fontWeight: 600, fontSize: '0.85rem' }}>
          <Beer size={16} />
          <span>Social</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.social}
          onChange={(e) => setMetaSliders({ social: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.social.toFixed(1)}x
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.85rem' }}>
          <Heart size={16} />
          <span>Bienestar</span>
        </div>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={metaSliders.wellness}
          onChange={(e) => setMetaSliders({ wellness: parseFloat(e.target.value) })}
          style={{ width: '90px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
        />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metaSliders.wellness.toFixed(1)}x
        </span>
      </div>
    </div>
  );
};
