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

              {/* Render de Bloques de Eventos Proporcionales (con partición exacta en medianoche) */}
              {(slicesByDay.get(dayIdx) || []).map((slice) => {
                const category = categories.find((c) => c.id === slice.event.categoryId);
                const color = category?.color || '#3b82f6';

                return (
                  <EventBlock
                    key={slice.sliceId}
                    event={slice.event}
                    topPx={slice.topPx}
                    heightPx={slice.heightPx}
                    color={color}
                    isContinuationFromPrevDay={slice.isContinuationFromPrevDay}
                    continuesToNextDay={slice.continuesToNextDay}
                    onClick={() => openEditModal(slice.event)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', slice.event.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDismissRepurpose={() => dismissAndRepurposeSlot(slice.event.id)}
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
