'use client';

import React, { useState, useRef } from 'react';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { parseIcsCalendar, ParsedIcsEvent } from '@/lib/calendar/icsParser';
import { Event } from '@/types/event';
import {
  Calendar,
  Upload,
  Link as LinkIcon,
  FileText,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  Clock,
  MapPin,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';

interface StagedEvent {
  id: string;
  original: ParsedIcsEvent;
  title: string;
  categoryId: string;
  isLocked: boolean;
  selected: boolean;
}

export const SemanticTriageModal: React.FC = () => {
  const {
    isTriageModalOpen,
    setTriageModalOpen,
    categories,
    addEvent,
    recalculateSchedule,
  } = useScheduleStore();

  const [activeTab, setActiveTab] = useState<'file' | 'url' | 'text'>('file');
  const [calendarUrl, setCalendarUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stagedEvents, setStagedEvents] = useState<StagedEvent[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isTriageModalOpen) return null;

  // Clasificador heurístico inicial según palabras clave
  const suggestCategoryAndLock = (title: string, location?: string): { categoryId: string; isLocked: boolean } => {
    const text = `${title} ${location || ''}`.toLowerCase();

    if (
      text.includes('turno') ||
      text.includes('guardia') ||
      text.includes('ferro') ||
      text.includes('casino') ||
      text.includes('rambla') ||
      text.includes('trabajo') ||
      text.includes('work') ||
      text.includes('shift')
    ) {
      return { categoryId: 'cat-work', isLocked: true };
    }

    if (
      text.includes('gym') ||
      text.includes('gimnasio') ||
      text.includes('entrenar') ||
      text.includes('piernas') ||
      text.includes('pecho') ||
      text.includes('espalda') ||
      text.includes('pesas')
    ) {
      return { categoryId: 'cat-gym', isLocked: false };
    }

    if (
      text.includes('facultad') ||
      text.includes('clase') ||
      text.includes('cursada') ||
      text.includes('parcial') ||
      text.includes('final') ||
      text.includes('redes') ||
      text.includes('calsoft') ||
      text.includes('estudio') ||
      text.includes('fiuba') ||
      text.includes('mdp')
    ) {
      return { categoryId: 'cat-study-float', isLocked: false };
    }

    if (
      text.includes('asado') ||
      text.includes('cumple') ||
      text.includes('salida') ||
      text.includes('birra') ||
      text.includes('amigos') ||
      text.includes('cena') ||
      text.includes('almuerzo')
    ) {
      return { categoryId: 'cat-social-pool', isLocked: false };
    }

    // Default
    return { categoryId: 'cat-work', isLocked: true };
  };

  const processIcsText = (icsContent: string) => {
    setErrorMsg(null);
    try {
      const parsed = parseIcsCalendar(icsContent);
      if (parsed.length === 0) {
        setErrorMsg('No se encontraron eventos válidos en el archivo o texto proporcionado.');
        return;
      }

      const staged: StagedEvent[] = parsed.map((item, idx) => {
        const { categoryId, isLocked } = suggestCategoryAndLock(item.title, item.location);
        return {
          id: `ics-${Date.now()}-${idx}`,
          original: item,
          title: item.title,
          categoryId,
          isLocked,
          selected: true,
        };
      });

      setStagedEvents(staged);
    } catch (err: any) {
      setErrorMsg('Error al analizar el formato iCalendar: ' + (err?.message || 'Formato no reconocido'));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processIcsText(content);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo local.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleUrlFetch = async () => {
    if (!calendarUrl.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/calendar/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: calendarUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo descargar el calendario desde esa URL.');
      }

      processIcsText(data.icsContent);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = () => {
    if (!rawText.trim()) return;
    processIcsText(rawText);
  };

  const toggleSelectAll = (select: boolean) => {
    setStagedEvents((prev) => prev.map((e) => ({ ...e, selected: select })));
  };

  const updateStagedEvent = (id: string, updates: Partial<StagedEvent>) => {
    setStagedEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleConfirmImport = () => {
    const selectedToImport = stagedEvents.filter((e) => e.selected);
    if (selectedToImport.length === 0) return;

    for (const staged of selectedToImport) {
      const cat = categories.find((c) => c.id === staged.categoryId);
      const isShift = staged.categoryId === 'cat-work';

      const newEvent: Event = {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        title: staged.title,
        categoryId: staged.categoryId,
        startTime: staged.original.startTime,
        endTime: staged.original.endTime,
        durationMinutes: staged.original.durationMinutes,
        location: staged.original.location || 'Casa',
        description: staged.original.description,
        isAllDay: staged.original.isAllDay,
        isLocked: staged.isLocked,
        isScheduleDisruptor: isShift && staged.original.endTime.getHours() < 6 && staged.original.endTime.getHours() >= 0,
        cognitiveLoad: staged.categoryId.includes('study') ? 3 : 1,
        physicalLoad: staged.categoryId.includes('gym') ? 3 : staged.categoryId.includes('work') ? 2 : 0,
        energyDrain: isShift ? 'high' : 'normal',
      };

      addEvent(newEvent);
    }

    // Cerrar modal y re-optimizar con diff viewer automático
    setTriageModalOpen(false);
    recalculateSchedule();
  };

  const selectedCount = stagedEvents.filter((e) => e.selected).length;

  return (
    <div className="modal-overlay" onClick={() => setTriageModalOpen(false)}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '2rem', maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <Calendar size={22} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>
                Importador de Google Calendar / iCal
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Importa turnos rotativos, eventos y compromisos externos con clasificación semántica CSP.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTriageModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Si no hemos cargado eventos aún, mostrar los métodos de ingesta */}
        {stagedEvents.length === 0 ? (
          <div>
            {/* Pestañas de Fuente */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`btn ${activeTab === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Upload size={15} />
                <span>Subir Archivo .ics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`btn ${activeTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LinkIcon size={15} />
                <span>Enlace Google Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`btn ${activeTab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={15} />
                <span>Pegar Texto .ics</span>
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tab 1: Subir Archivo .ics */}
            {activeTab === 'file' && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--border-subtle)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".ics,.ical,text/calendar"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <Upload size={36} color="var(--accent-blue)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#ffffff', marginBottom: '0.5rem' }}>
                  Arrastrá tu archivo .ics o hacé clic para seleccionarlo
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                  Podés descargar tu calendario completo desde Google Calendar en:
                  <br />
                  <strong>Configuración &gt; Importar y Exportar &gt; Exportar</strong>
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{isLoading ? 'Procesando...' : 'Seleccionar Archivo .ics'}</span>
                </button>
              </div>
            )}

            {/* Tab 2: Enlace URL de Google Calendar */}
            {activeTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Dirección iCal secreta o pública de tu Google Calendar
                  </label>
                  <input
                    type="url"
                    value={calendarUrl}
                    onChange={(e) => setCalendarUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/usuario%40gmail.com/private-token/basic.ics"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                    En Google Calendar: <em>Configuración de tu calendario &gt; Integrar el calendario &gt; Dirección secreta en formato iCal</em>.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleUrlFetch}
                    className="btn btn-primary"
                    disabled={isLoading || !calendarUrl.trim()}
                    style={{ padding: '0.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    <span>{isLoading ? 'Conectando...' : 'Obtener y Analizar Eventos'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Pegar Texto Plano */}
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Pegá el contenido de tu archivo .ics directamente
                  </label>
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="BEGIN:VCALENDAR...&#10;BEGIN:VEVENT...&#10;SUMMARY:Turno Ferro...&#10;END:VEVENT...&#10;END:VCALENDAR"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#ffffff',
                      fontSize: '0.825rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleTextSubmit}
                    className="btn btn-primary"
                    disabled={!rawText.trim()}
                    style={{ padding: '0.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Check size={16} />
                    <span>Analizar Texto</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Vista de Eventos Parseados y Clasificación Semántica */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Barra de Herramientas de Triage */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                  {stagedEvents.length} eventos detectados
                </span>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
                  {selectedCount} seleccionados
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  <CheckSquare size={13} style={{ marginRight: '3px' }} /> Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  <Square size={13} style={{ marginRight: '3px' }} /> Deseleccionar
                </button>
                <button
                  type="button"
                  onClick={() => setStagedEvents([])}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#fca5a5' }}
                >
                  Cambiar archivo
                </button>
              </div>
            </div>

            {/* Lista Scrollable de Eventos Parseados */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.5rem', maxHeight: '420px' }}>
              {stagedEvents.map((item) => {
                const sDate = item.original.startTime;
                const eDate = item.original.endTime;
                const dateStr = sDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
                const timeStr = item.original.isAllDay
                  ? 'Todo el día'
                  : `${sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <div
                    key={item.id}
                    className="glass-card"
                    style={{
                      padding: '0.85rem 1rem',
                      borderLeft: item.selected ? '4px solid var(--accent-blue)' : '4px solid var(--border-subtle)',
                      background: item.selected ? 'rgba(30, 41, 59, 0.4)' : 'rgba(15, 23, 42, 0.3)',
                      opacity: item.selected ? 1 : 0.65,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    {/* Checkbox y Datos Principales */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => updateStagedEvent(item.id, { selected: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} />
                            {dateStr} Â· {timeStr} ({item.original.durationMinutes}m)
                          </span>
                          {item.original.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={12} />
                              {item.original.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controles Semánticos: Categoría y Candado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                      {/* Selector de Categoría */}
                      <select
                        value={item.categoryId}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          const isLock = newCat === 'cat-work';
                          updateStagedEvent(item.id, { categoryId: newCat, isLocked: isLock });
                        }}
                        style={{
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: '#0f172a',
                          border: '1px solid var(--border-subtle)',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          outline: 'none',
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Botón de Candado (Hard Pillar) */}
                      <button
                        type="button"
                        onClick={() => updateStagedEvent(item.id, { isLocked: !item.isLocked })}
                        className={`btn ${item.isLocked ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderColor: item.isLocked ? 'rgba(239, 68, 68, 0.4)' : undefined,
                          background: item.isLocked ? 'rgba(239, 68, 68, 0.15)' : undefined,
                          color: item.isLocked ? '#fca5a5' : 'var(--text-muted)',
                        }}
                        title={item.isLocked ? 'Pilar inamovible (fijo)' : 'Bloque reubicable por el solver'}
                      >
                        {item.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                        <span>{item.isLocked ? 'Pilar Fijo' : 'Flexible'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra Inferior de Acción */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTriageModalOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedCount === 0}
                onClick={handleConfirmImport}
                style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Sparkles size={16} />
                <span>Importar {selectedCount} Eventos a la Agenda</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
