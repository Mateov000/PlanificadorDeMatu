'use client';

import React, { useMemo } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { EventBlock } from './EventBlock';
import { Event } from '@/types/event';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // 60px por hora = 1px por minuto

function parseDate(d?: Date | string): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

export const TimeGridCalendar: React.FC = () => {
  const {
    events,
    categories,
    dismissAndRepurposeSlot,
    updateEvent,
    setFrictionFeedback,
    setCreateModalOpen,
    openEditModal,
  } = useScheduleStore();

  // Generar los 7 días de la semana actual partiendo del lunes
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Domingo, 1 = Lunes
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }, []);

  const todayStr = useMemo(() => new Date().toDateString(), []);

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    const map = new Map<number, Event[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);

    for (const ev of events) {
      const start = parseDate(ev.startTime);
      if (!start) continue;

      const dayIdx = weekDays.findIndex(
        (wd) =>
          wd.getFullYear() === start.getFullYear() &&
          wd.getMonth() === start.getMonth() &&
          wd.getDate() === start.getDate()
      );

      if (dayIdx >= 0) {
        map.get(dayIdx)?.push(ev);
      }
    }

    return map;
  }, [events, weekDays]);

  // Indicador de hora actual (minutos transcurridos hoy)
  const now = new Date();
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();
  const currentDayIndex = weekDays.findIndex((wd) => wd.toDateString() === todayStr);

  return (
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
          const dayEvents = eventsByDay.get(dayIdx) || [];

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

                // Disparar popover de 2 segundos de feedback de fricción
                setFrictionFeedback({
                  eventId,
                  eventTitle: eventToMove.title,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (
                  target.classList.contains('day-column') ||
                  target.classList.contains('hour-line') ||
                  target.classList.contains('half-hour-line')
                ) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  const rawMinutes = Math.max(0, Math.min(1425, offsetY));
                  const snappedMinutes = Math.floor(rawMinutes / 15) * 15;

                  const targetDay = weekDays[dayIdx];
                  const newStart = new Date(targetDay);
                  newStart.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);
                  const newEnd = new Date(newStart.getTime() + 90 * 60 * 1000);

                  setCreateModalOpen(true, { start: newStart, end: newEnd });
                }
              }}
            >
              {/* Líneas horizontales de horas */}
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="hour-line" style={{ top: `${hour * HOUR_HEIGHT}px` }} />
                  <div className="half-hour-line" style={{ top: `${hour * HOUR_HEIGHT + 30}px` }} />
                </React.Fragment>
              ))}

              {/* Indicador de hora actual si es hoy */}
              {isToday && currentDayIndex === dayIdx && (
                <div className="current-time-line" style={{ top: `${currentMinutesToday}px` }}>
                  <div className="current-time-dot" />
                </div>
              )}

              {/* Render de Bloques de Eventos Proporcionales */}
              {dayEvents.map((ev) => {
                const start = parseDate(ev.startTime);
                if (!start) return null;

                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const topPx = startMinutes; // 1px = 1 min
                const heightPx = Math.max(26, ev.durationMinutes);

                const category = categories.find((c) => c.id === ev.categoryId);
                const color = category?.color || '#3b82f6';

                return (
                  <EventBlock
                    key={ev.id}
                    event={ev}
                    topPx={topPx}
                    heightPx={heightPx}
                    color={color}
                    onClick={() => openEditModal(ev)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', ev.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDismissRepurpose={() => dismissAndRepurposeSlot(ev.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
