'use client';

import React, { useMemo, useState } from 'react';
import { useScheduleStore, getMondayOf } from '@/lib/store/scheduleStore';
import { EventBlock } from './EventBlock';
import { Event } from '@/types/event';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  CalendarDays,
  Plus,
} from 'lucide-react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // 60px por hora = 1px por minuto

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function parseDate(d?: Date | string): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

export const TimeGridCalendar: React.FC = () => {
  const {
    events,
    categories,
    currentWeekStart,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
    deleteCurrentWeekEvents,
    dismissAndRepurposeSlot,
    updateEvent,
    setFrictionFeedback,
    setCreateModalOpen,
    openEditModal,
  } = useScheduleStore();

  const [confirmDelete, setConfirmDelete] = useState(false);

  // Generar los 7 días de la semana en vista partiendo de currentWeekStart
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      return day;
    });
  }, [currentWeekStart]);

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Determinar si la semana en vista es la semana en curso
  const isCurrentWeek = useMemo(() => {
    const currentMon = getMondayOf(new Date());
    return currentWeekStart.toDateString() === currentMon.toDateString();
  }, [currentWeekStart]);

  // Formatear rango de fechas legible en español
  const formattedDateRange = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];

    const m1 = MONTH_NAMES[first.getMonth()];
    const m2 = MONTH_NAMES[last.getMonth()];
    const y1 = first.getFullYear();
    const y2 = last.getFullYear();

    if (y1 === y2) {
      if (m1 === m2) {
        return `${first.getDate()} al ${last.getDate()} de ${m1}, ${y1}`;
      }
      return `${first.getDate()} de ${m1} al ${last.getDate()} de ${m2}, ${y1}`;
    }
    return `${first.getDate()} de ${m1}, ${y1} al ${last.getDate()} de ${m2}, ${y2}`;
  }, [weekDays]);

  // Indicador de semanas de desfase (+1 sem, -1 sem, etc.)
  const weekOffsetLabel = useMemo(() => {
    const currentMon = getMondayOf(new Date());
    const diffDays = Math.round((currentWeekStart.getTime() - currentMon.getTime()) / (24 * 60 * 60 * 1000));
    const diffWeeks = Math.round(diffDays / 7);
    if (diffWeeks > 0) return `+${diffWeeks} sem`;
    if (diffWeeks < 0) return `${diffWeeks} sem`;
    return 'Actual';
  }, [currentWeekStart]);

  // Cantidad de eventos programados en esta semana
  const weekEventsCount = useMemo(() => {
    if (weekDays.length < 7) return 0;
    const startMs = weekDays[0].getTime();
    const endMs = startMs + 7 * 24 * 60 * 60 * 1000;
    return events.filter((ev) => {
      if (!ev.startTime) return false;
      const s = typeof ev.startTime === 'string' ? new Date(ev.startTime).getTime() : ev.startTime.getTime();
      return s >= startMs && s < endMs;
    }).length;
  }, [events, weekDays]);

  // Agrupar eventos por día seccionando con precisión matemática los bloques que cruzan la medianoche
  const slicesByDay = useMemo(() => {
    const map = new Map<
      number,
      Array<{
        sliceId: string;
        event: Event;
        topPx: number;
        heightPx: number;
        isContinuationFromPrevDay: boolean;
        continuesToNextDay: boolean;
      }>
    >();
    for (let i = 0; i < 7; i++) map.set(i, []);

    for (let dayIdx = 0; dayIdx < weekDays.length; dayIdx++) {
      const d = weekDays[dayIdx];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      for (const ev of events) {
        const evStart = parseDate(ev.startTime);
        if (!evStart) continue;

        const evEnd =
          parseDate(ev.endTime) ||
          new Date(evStart.getTime() + (ev.durationMinutes || 60) * 60 * 1000);

        const startMillis = evStart.getTime();
        const endMillis = evEnd.getTime();

        // Calcular la intersección del evento con la ventana de 24h de este día
        const sliceStart = Math.max(startMillis, dayStart);
        const sliceEnd = Math.min(endMillis, dayEnd);

        if (sliceEnd > sliceStart) {
          const topPx = (sliceStart - dayStart) / (60 * 1000);
          const durationMins = (sliceEnd - sliceStart) / (60 * 1000);
          const heightPx = Math.max(18, durationMins);

          const isContinuationFromPrevDay = startMillis < dayStart;
          const continuesToNextDay = endMillis > dayEnd;

          map.get(dayIdx)?.push({
            sliceId: `${ev.id}-slice-${dayIdx}`,
            event: ev,
            topPx,
            heightPx,
            isContinuationFromPrevDay,
            continuesToNextDay,
          });
        }
      }
    }

    return map;
  }, [events, weekDays]);

  // Indicador de hora actual (minutos transcurridos hoy)
  const now = new Date();
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();
  const currentDayIndex = weekDays.findIndex((wd) => wd.toDateString() === todayStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Barra de Control de Navegación de Semanas */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          flexWrap: 'wrap',
          gap: '0.85rem',
        }}
      >
        {/* Lado Izquierdo: Botones de Salto de Semana y Rango de Fechas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={goToPrevWeek}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
              title="Semana anterior"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <button
              onClick={goToCurrentWeek}
              className={`btn ${isCurrentWeek ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
              title="Ir a la semana actual en curso"
            >
              <CalendarIcon size={14} />
              <span>Hoy</span>
            </button>

            <button
              onClick={goToNextWeek}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
              title="Semana siguiente"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Rango de Fechas y Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarDays size={18} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em', color: '#ffffff' }}>
              {formattedDateRange}
            </span>
            {isCurrentWeek ? (
              <span
                className="badge"
                style={{
                  background: 'rgba(16, 185, 129, 0.18)',
                  color: '#34d399',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ● Semana Actual
              </span>
            ) : (
              <span
                className="badge"
                style={{
                  background: 'rgba(59, 130, 246, 0.18)',
                  color: '#60a5fa',
                  fontSize: '0.7rem',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {weekOffsetLabel}
              </span>
            )}
          </div>
        </div>

        {/* Lado Derecho: Contador y Botón de Eliminación Segura de Semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {weekEventsCount} {weekEventsCount === 1 ? 'bloque activo' : 'bloques activos'}
          </span>

          {/* Botón de Creación Rápida */}
          <button
            onClick={() => {
              const start = new Date(weekDays[0]);
              start.setHours(9, 0, 0, 0);
              const end = new Date(start.getTime() + 90 * 60 * 1000);
              setCreateModalOpen(true, { start, end });
            }}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
            title="Crear un nuevo evento en esta semana"
          >
            <Plus size={15} />
            <span>Nuevo Evento</span>
          </button>

          {/* Botón de Vaciar Semana con Confirmación */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                color: '#f87171',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.08)',
              }}
              title="Eliminar todos los eventos que pertenezcan a esta semana"
            >
              <Trash2 size={15} color="#ef4444" />
              <span>Vaciar Semana</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.45)',
              }}
            >
              <span style={{ fontSize: '0.775rem', color: '#fca5a5', fontWeight: 500 }}>
                ¿Eliminar {weekEventsCount} bloques de esta semana?
              </span>
              <button
                onClick={() => {
                  deleteCurrentWeekEvents();
                  setConfirmDelete(false);
                }}
                className="btn btn-danger"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  background: '#ef4444',
                  color: '#ffffff',
                }}
              >
                Sí, vaciar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor Principal de la Grilla Semanal */}
      <div className="timegrid-container">
        {/* Encabezado de los 7 días */}
        <div className="timegrid-header">
          <div className="timegrid-header-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HORA</span>
          </div>
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === todayStr;
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return (
              <div key={idx} className={`timegrid-header-cell ${isToday ? 'today' : ''}`}>
                <div className="day-name">{dayNames[day.getDay()]}</div>
                <div className="day-number" style={{ color: isToday ? 'var(--accent-blue)' : 'inherit' }}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cuerpo continuo de 24 horas */}
        <div className="timegrid-body">
          {/* Columna lateral de marcas de tiempo */}
          <div className="time-gutter">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="time-label"
                style={{ top: `${hour * HOUR_HEIGHT}px` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Columnas de Días */}
          {weekDays.map((day, dayIdx) => {
            const isToday = day.toDateString() === todayStr;

            return (
              <div
                key={dayIdx}
                className={`day-column ${isToday ? 'today' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const eventId = e.dataTransfer.getData('text/plain');
                  if (!eventId) return;

                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const rawMinutes = Math.max(0, Math.min(1425, offsetY));
                  const snappedMinutes = Math.floor(rawMinutes / 15) * 15;

                  const targetDay = weekDays[dayIdx];
                  const newStart = new Date(targetDay);
                  newStart.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);

                  const eventToMove = events.find((ev) => ev.id === eventId);
                  if (!eventToMove) return;

                  const duration = eventToMove.durationMinutes || 60;
                  const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

                  updateEvent(eventId, {
                    startTime: newStart,
                    endTime: newEnd,
                    isFloating: false,
                  });

                  setFrictionFeedback({
                    eventId,
                    eventTitle: eventToMove.title,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onClick={(e) => {
                  if (e.target !== e.currentTarget) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const minutes = Math.floor(offsetY / 15) * 15;

                  const clickedTime = new Date(day);
                  clickedTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
                  const endTime = new Date(clickedTime.getTime() + 60 * 60 * 1000);

                  setCreateModalOpen(true, { start: clickedTime, end: endTime });
                }}
              >
                {/* Líneas guía horarias */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="hour-line"
                    style={{ top: `${hour * HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Línea roja de hora actual si el día coincide */}
                {isToday && currentDayIndex === dayIdx && (
                  <div
                    className="now-indicator"
                    style={{ top: `${currentMinutesToday}px` }}
                  >
                    <div className="now-dot" />
                  </div>
                )}

                {/* Slices de eventos ubicados en este día */}
                {slicesByDay.get(dayIdx)?.map((slice) => {
                  const cat = categories.find((c) => c.id === slice.event.categoryId);
                  return (
                    <EventBlock
                      key={slice.sliceId}
                      event={slice.event}
                      color={cat?.color}
                      topPx={slice.topPx}
                      heightPx={slice.heightPx}
                      isContinuationFromPrevDay={slice.isContinuationFromPrevDay}
                      continuesToNextDay={slice.continuesToNextDay}
                      onClick={() => openEditModal(slice.event)}
                      onDismissRepurpose={() => dismissAndRepurposeSlot(slice.event.id)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
