'use client';

import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import { X, Calendar, Clock, MapPin, Brain, Shield, Lock, AlertTriangle, Cannabis, Sparkles } from 'lucide-react';

export const CreateEventModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen, createModalInitialTimes, categories, addEvent, recalculateSchedule } = useScheduleStore();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat-study-float');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [location, setLocation] = useState('Casa');
  const [cognitiveLoad, setCognitiveLoad] = useState(2);
  const [physicalLoad, setPhysicalLoad] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isScheduleDisruptor, setIsScheduleDisruptor] = useState(false);
  const [cannabisConsumed, setCannabisConsumed] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);
  const [displayAlias, setDisplayAlias] = useState('');

  useEffect(() => {
    if (!isCreateModalOpen) return;

    const start = createModalInitialTimes?.start || new Date();
    const end = createModalInitialTimes?.end || new Date(start.getTime() + 90 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    setStartDateStr(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
    setStartTimeStr(`${pad(start.getHours())}:${pad(start.getMinutes())}`);

    setEndDateStr(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
    setEndTimeStr(`${pad(end.getHours())}:${pad(end.getMinutes())}`);

    setTitle('');
    setLocation('Casa');
    setIsLocked(false);
    setIsScheduleDisruptor(false);
    setCannabisConsumed(false);
    setIsSensitive(false);
    setDisplayAlias('');
  }, [isCreateModalOpen, createModalInitialTimes]);

  if (!isCreateModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [sHour, sMin] = startTimeStr.split(':').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay, sHour, sMin);

    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const [eHour, eMin] = endTimeStr.split(':').map(Number);
    const end = new Date(eYear, eMonth - 1, eDay, eHour, eMin);

    const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / (60 * 1000)));

    const selectedCategory = categories.find((c) => c.id === categoryId);

    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      categoryId,
      category: selectedCategory,
      startTime: start,
      endTime: end,
      durationMinutes,
      isLocked,
      isFloating: !isLocked,
      isScheduleDisruptor,
      cannabisConsumed,
      isSensitive,
      displayAlias: displayAlias.trim() || undefined,
      cognitiveLoad,
      physicalLoad,
      energyDrain: isScheduleDisruptor ? 'high' : 'normal',
      location: location.trim() || 'Casa',
    };

    addEvent(newEvent);
    setCreateModalOpen(false);
    recalculateSchedule();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: '520px', width: '95%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} color="#60a5fa" />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Nuevo Bloque / Compromiso
            </h2>
          </div>
          <button
            onClick={() => setCreateModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Título y Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
              Título del Evento o Tarea
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Estudio Redes, Turno Ferro, Cerveza con Juancito"
              className="form-input"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#ffffff',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Categoría / Arquetipo
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.archetype})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Sede / Ubicación (Mardel)
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="Casa">Casa (Familiar)</option>
                <option value="Facultad">Facultad UNMDP</option>
                <option value="Rambla Casino">Rambla Casino</option>
                <option value="Ferro">Ferro San Juan</option>
                <option value="Gimnasio">Gimnasio</option>
                <option value="Cervecería">Cervecería / Bar</option>
                <option value="Costa">Costa / Playa</option>
              </select>
            </div>
          </div>

          {/* Horarios */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Inicio
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Fin
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
                <input
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Carga Cognitiva y Candado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                Demanda Cognitiva
              </label>
              <select
                value={cognitiveLoad}
                onChange={(e) => setCognitiveLoad(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                }}
              >
                <option value={0}>0 - Mecánica / Reposo</option>
                <option value={1}>1 - Ligera / Repaso</option>
                <option value={2}>2 - Moderada / Cursada</option>
                <option value={3}>3 - Foco Profundo (Ingeniería)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#e2e8f0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                />
                <Lock size={14} color="#fbbf24" />
                <span>Pilar Inamovible (Candado)</span>
              </label>
            </div>
          </div>

          {/* Banderas Circadianas y Familiares */}
          <div style={{ padding: '0.75rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isScheduleDisruptor}
                onChange={(e) => setIsScheduleDisruptor(e.target.checked)}
              />
              <AlertTriangle size={14} color="#f59e0b" />
              <span>Actividad Nocturna / Extenuante (Dispara Sueño 8h + Veto)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={cannabisConsumed}
                onChange={(e) => setCannabisConsumed(e.target.checked)}
              />
              <Cannabis size={14} color="#10b981" />
              <span>Consumo Recreativo (GHC-01: Buffer Sobrio Familiar 2h-4h)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
              />
              <Shield size={14} color="#ec4899" />
              <span>Sensible (Usar alias neutral en pantalla y exportación)</span>
            </label>

            {isSensitive && (
              <input
                type="text"
                value={displayAlias}
                onChange={(e) => setDisplayAlias(e.target.value)}
                placeholder="Alias en pantalla (ej: Compromiso Personal)"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(236, 72, 153, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem',
                }}
              />
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.1rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              Guardar Bloque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
