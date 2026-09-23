'use client';

import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { Event } from '@/types/event';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Lock,
  Trash2,
  Save,
  Shield,
  Brain,
  Sparkles,
} from 'lucide-react';

export const EditEventModal: React.FC = () => {
  const {
    isEditModalOpen,
    selectedEventToEdit,
    closeEditModal,
    updateEvent,
    deleteEvent,
    categories,
    recalculateSchedule,
  } = useScheduleStore();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat-study-float');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [location, setLocation] = useState('Casa');
  const [isLocked, setIsLocked] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);
  const [displayAlias, setDisplayAlias] = useState('');

  useEffect(() => {
    if (!selectedEventToEdit || !isEditModalOpen) return;

    setTitle(selectedEventToEdit.title);
    setCategoryId(selectedEventToEdit.categoryId || 'cat-study-float');
    setLocation(selectedEventToEdit.location || 'Casa');
    setIsLocked(Boolean(selectedEventToEdit.isLocked));
    setIsSensitive(Boolean(selectedEventToEdit.isSensitive));
    setDisplayAlias(selectedEventToEdit.displayAlias || '');

    const pad = (n: number) => n.toString().padStart(2, '0');

    const start = selectedEventToEdit.startTime
      ? new Date(selectedEventToEdit.startTime)
      : new Date();
    setStartDateStr(
      `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    );
    setStartTimeStr(`${pad(start.getHours())}:${pad(start.getMinutes())}`);

    const end = selectedEventToEdit.endTime
      ? new Date(selectedEventToEdit.endTime)
      : new Date(start.getTime() + (selectedEventToEdit.durationMinutes || 60) * 60 * 1000);
    setEndDateStr(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
    setEndTimeStr(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
  }, [selectedEventToEdit, isEditModalOpen]);

  if (!isEditModalOpen || !selectedEventToEdit) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
    const [sHour, sMin] = startTimeStr.split(':').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay, sHour, sMin);

    const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
    const [eHour, eMin] = endTimeStr.split(':').map(Number);
    const end = new Date(eYear, eMonth - 1, eDay, eHour, eMin);

    const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / (60 * 1000)));

    updateEvent(selectedEventToEdit.id, {
      title,
      categoryId,
      startTime: start,
      endTime: end,
      durationMinutes,
      location,
      isLocked,
      isSensitive,
      displayAlias: isSensitive ? (displayAlias || 'Compromiso Personal') : undefined,
    });

    closeEditModal();
    recalculateSchedule();
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar el evento "${selectedEventToEdit.title}"?`)) {
      deleteEvent(selectedEventToEdit.id);
      closeEditModal();
      recalculateSchedule();
    }
  };

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="modal-overlay" onClick={closeEditModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '95%', padding: '1.75rem' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `${currentCategory?.color || '#3b82f6'}25`,
                border: `1px solid ${currentCategory?.color || '#3b82f6'}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color={currentCategory?.color || '#3b82f6'} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Editar Evento
              </h2>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                ID: {selectedEventToEdit.id}
              </span>
            </div>
          </div>
          <button
            onClick={closeEditModal}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Título */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              Título del Evento
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#ffffff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#ffffff',
                fontSize: '0.875rem',
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Horario de Inicio y Fin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', color: '#94a3b8', marginBottom: '4px' }}>
                Fecha y Hora de Inicio
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="date"
                  required
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.775rem',
                  }}
                />
                <input
                  type="time"
                  required
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.775rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', color: '#94a3b8', marginBottom: '4px' }}>
                Fecha y Hora de Fin
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="date"
                  required
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.775rem',
                  }}
                />
                <input
                  type="time"
                  required
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    color: '#ffffff',
                    fontSize: '0.775rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
              Ubicación (para tiempos de viaje en Mar del Plata)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Casa, Facultad, Ferro, Rambla Casino, Gimnasio"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#ffffff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Switches / Checkboxes */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '8px',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isLocked}
                onChange={(e) => setIsLocked(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={14} color="#f59e0b" />
                Pilar Inamovible (El solver no moverá este bloque)
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={14} color="#ec4899" />
                Máscara de Privacidad (Ocultar título en Google Calendar / feeds externos)
              </span>
            </label>

            {isSensitive && (
              <div style={{ paddingLeft: '1.5rem', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Alias neutral (ej: Compromiso Personal, Ocupado)"
                  value={displayAlias}
                  onChange={(e) => setDisplayAlias(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(236, 72, 153, 0.4)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1rem',
            }}
          >
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.5rem 1rem',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={15} />
              <span>Eliminar</span>
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={closeEditModal}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.825rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
