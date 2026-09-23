'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useScheduleStore, CustomConstraint } from '@/lib/store/scheduleStore';
import { constraintRegistry } from '@/constraints/registry';
import {
  Sliders,
  Moon,
  Brain,
  Shield,
  Car,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Check,
  Plus,
  Trash2,
  Wind,
  Dumbbell,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    params,
    setParams,
    customConstraints,
    addCustomConstraint,
    removeCustomConstraint,
    toggleCustomConstraint,
  } = useScheduleStore();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [, setTick] = useState(0);

  // Estado del Constructor de Restricciones Personalizadas
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'hard' | 'soft'>('hard');
  const [newRuleVar, setNewRuleVar] = useState('hourOfDay');
  const [newRuleOp, setNewRuleOp] = useState<'>' | '<' | '>=' | '<=' | '===' | '!='>('<=');
  const [newRuleThreshold, setNewRuleThreshold] = useState('22');
  const [newRuleWeight, setNewRuleWeight] = useState(1.2);
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [builderSuccess, setBuilderSuccess] = useState(false);

  const handleToggleRule = (id: string, currentEnabled: boolean) => {
    constraintRegistry.setRuleEnabled(id, !currentEnabled);
    setTick((t) => t + 1);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCreateCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const constraint: CustomConstraint = {
      id: `custom-${Date.now()}`,
      name: newRuleName.trim(),
      description:
        newRuleDesc.trim() ||
        `Restricción personalizada: ${newRuleVar} ${newRuleOp} ${newRuleThreshold}`,
      type: newRuleType,
      variable: newRuleVar,
      operator: newRuleOp,
      threshold: isNaN(Number(newRuleThreshold)) ? newRuleThreshold : Number(newRuleThreshold),
      weight: newRuleWeight,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    addCustomConstraint(constraint);
    setNewRuleName('');
    setNewRuleDesc('');
    setBuilderSuccess(true);
    setTimeout(() => setBuilderSuccess(false), 2500);
  };

  return (
    <main style={{ padding: '0 1.5rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Navigation />

      <div style={{ margin: '2rem 0 2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Consola de Perillas y Motor CSP
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
          Configura tus parámetros biológicos, inspecciona las variables de decisión del algoritmo y construye restricciones personalizadas en vivo.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Panel Destacado: Exposición de Variables del Algoritmo de Decisión CSP */}
        <div
          className="glass-panel"
          style={{
            padding: '1.75rem 2rem',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Layers size={22} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff' }}>
              Variables de Decisión del Algoritmo CSP
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Estas son las variables matemáticas y fisiológicas que el solver local evalúa en cada ciclo de poda lógica AC-3 y optimización de scoring. Puedes utilizarlas para crear restricciones personalizadas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Variable Card 1 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Moon size={16} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Biológicas y Sueño</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>targetSleepMinutes</code>: {params.targetSleepMinutes} min (8h continuo protegido)</li>
                <li><code>nightThresholdHour</code>: {params.nightThresholdHour ?? 23.5} hs (Disrupción nocturna)</li>
                <li><code>cognitiveLandingBuffer</code>: {params.cognitiveLandingBufferMinutes} min (Aterrizaje)</li>
                <li><code>wakeInertiaBuffer</code>: {params.wakeInertiaBufferMinutes} min (Inercia post-despertar)</li>
              </ul>
            </div>

            {/* Variable Card 2 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Dumbbell size={16} color="var(--accent-emerald)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Fisiología y Gym (HC-06)</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>recoveryDaysNeeded</code>: 2 días (Separación mínima Torso/Piernas)</li>
                <li><code>splitVariant</code>: &apos;torso&apos; | &apos;piernas&apos; (Variantes musculares)</li>
                <li><code>physicalLoad</code>: 0 (Reposo), 2 (Moderado), 3 (Extenuante)</li>
                <li><code>preferredTimeWindow</code>: 15:00 a 19:30 (Franja de entrenamiento)</li>
              </ul>
            </div>

            {/* Variable Card 3 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Car size={16} color="var(--accent-purple)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Espacial y Logística</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>travelSafetyMargin</code>: {params.travelSafetyMarginMinutes ?? 10} min de colchón</li>
                <li><code>travelCasaFacultad</code>: 25 min (Línea 511 / Colectivo)</li>
                <li><code>travelCasaFerro</code>: 25 min (Cierre nocturno)</li>
                <li><code>travelCasaCasino</code>: 20 min (Rambla Casino)</li>
              </ul>
            </div>

            {/* Variable Card 4 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Wind size={16} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Microclima Mardel (SC-03)</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>comfortScore</code>: 0 a 100 (Índice de confort exterior)</li>
                <li><code>isSoutheastStorm</code>: Viento SE &gt; 35 km/h (Temporal oceánico)</li>
                <li><code>rainMm</code>: Precipitación horaria en milímetros</li>
                <li><code>arbitrageRule</code>: Temporal = Estudio interior; Sol = Ocio costero</li>
              </ul>
            </div>

            {/* Variable Card 5 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Shield size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Convivencia (GHC-01)</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>cannabisBufferMin</code>: {params.cannabisBufferMinMinutes} min (Piso sobrio)</li>
                <li><code>cannabisBufferIdeal</code>: {params.cannabisBufferIdealMinutes} min (Descenso ideal)</li>
                <li><code>cannabisConsumed</code>: Boolean flag en eventos sociales</li>
                <li><code>locationRule</code>: Prohibido retornar al hogar durante la ventana</li>
              </ul>
            </div>

            {/* Variable Card 6 */}
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <DollarSign size={16} color="var(--accent-rose)" />
                <span style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>Social y Finanzas</span>
              </div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingLeft: '1.2rem', margin: 0 }}>
                <li><code>weeklyBudgetArs</code>: ${params.weeklyBudgetArs.toLocaleString('es-AR')} ARS</li>
                <li><code>weeklySocialHours</code>: {params.weeklySocialTargetHours} hs (Bolsa fungible)</li>
                <li><code>estimatedCostArs</code>: Costo en pesos por actividad social</li>
                <li><code>cognitiveLoad</code>: 0 a 3 (0=Mecánico, 3=Foco profundo)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sección: Constructor de Restricciones Personalizadas */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <Plus size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Constructor de Restricciones Personalizadas
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Define una nueva restricción algorítmica sobre cualquier variable de decisión. Se registrará inmediatamente en el motor CSP sin necesidad de reiniciar la app.
          </p>

          <form onSubmit={handleCreateCustomRule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Nombre de la Restricción
                </label>
                <input
                  type="text"
                  placeholder="Ej: No estudiar después de las 21hs"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Tipo de Restricción
                </label>
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as 'hard' | 'soft')}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="hard">Hard Constraint (Inviolable / Bloqueo en AC-3)</option>
                  <option value="soft">Soft Constraint (Preferencia ponderada)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Variable de Decisión
                </label>
                <select
                  value={newRuleVar}
                  onChange={(e) => setNewRuleVar(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="hourOfDay">hourOfDay (Hora del evento: 0 a 24)</option>
                  <option value="cognitiveLoad">cognitiveLoad (Carga mental: 0 a 3)</option>
                  <option value="durationMinutes">durationMinutes (Duración en minutos)</option>
                  <option value="recoveryDaysNeeded">recoveryDaysNeeded (Descanso muscular)</option>
                  <option value="estimatedCostArs">estimatedCostArs (Costo en pesos)</option>
                  <option value="location">location (Ubicación física)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Operador & Valor Umbral
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={newRuleOp}
                    onChange={(e) => setNewRuleOp(e.target.value as any)}
                    style={{
                      width: '75px',
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '0.6rem 0.4rem',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    <option value="<">&lt;</option>
                    <option value="<=">&le;</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&ge;</option>
                    <option value="===">===</option>
                    <option value="!=">!=</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ej: 21, 15000, Casa"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Descripción o Justificación para el DiffViewer
              </label>
              <input
                type="text"
                placeholder="Ej: Prohíbe agendar estudio después de las 21:00 hs para evitar saturación antes de dormir."
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fórmula activa: <strong style={{ color: 'var(--accent-cyan)' }}>{newRuleVar} {newRuleOp} {newRuleThreshold}</strong> ({newRuleType === 'hard' ? 'Hard AC-3' : `Soft ${newRuleWeight}x`})
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {builderSuccess && (
                  <span style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <Check size={16} /> Restricción agregada al motor CSP
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.85rem' }}>
                  <Plus size={15} />
                  <span>Registrar Restricción en el Motor CSP</span>
                </button>
              </div>
            </div>
          </form>

          {/* Lista de Restricciones Personalizadas Activas */}
          {customConstraints.length > 0 && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
                Restricciones Personalizadas Creadas ({customConstraints.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {customConstraints.map((c) => (
                  <div
                    key={c.id}
                    className="glass-card"
                    style={{
                      padding: '0.9rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      borderLeft: c.type === 'hard' ? '4px solid var(--accent-rose)' : '4px solid var(--accent-purple)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${c.type === 'hard' ? 'badge-locked' : 'badge-floating'}`}>
                          {c.type === 'hard' ? 'HARD' : 'SOFT'}
                        </span>
                        <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{c.name}</strong>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {c.variable} {c.operator} {c.threshold}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {c.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => toggleCustomConstraint(c.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: c.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                        title={c.enabled ? 'Desactivar regla' : 'Activar regla'}
                      >
                        {c.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                      <button
                        onClick={() => removeCustomConstraint(c.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171' }}
                        title="Eliminar regla personalizada"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sección 1: Parámetros Biológicos y Circadianos */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <Moon size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Inteligencia Biológica y Descanso
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Meta de Sueño Continuo (Horas)
              </label>
              <input
                type="range"
                min="360"
                max="600"
                step="30"
                value={params.targetSleepMinutes}
                onChange={(e) => setParams({ targetSleepMinutes: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                {(params.targetSleepMinutes / 60).toFixed(1)} horas ({params.targetSleepMinutes} min)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Buffer de Aterrizaje Post-Desgaste
              </label>
              <input
                type="range"
                min="30"
                max="120"
                step="15"
                value={params.cognitiveLandingBufferMinutes}
                onChange={(e) => setParams({ cognitiveLandingBufferMinutes: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {params.cognitiveLandingBufferMinutes} minutos
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Inercia al Despertar Desfasado
              </label>
              <input
                type="range"
                min="30"
                max="180"
                step="15"
                value={params.wakeInertiaBufferMinutes}
                onChange={(e) => setParams({ wakeInertiaBufferMinutes: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                {params.wakeInertiaBufferMinutes} minutos
              </span>
            </div>
          </div>
        </div>

        {/* Sección 2: Convivencia y Recuperación (GHC-01) */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <Shield size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Convivencia Familiar y Recuperación Sobria (GHC-01)
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Piso Mínimo Sobrio (Horas)
              </label>
              <input
                type="range"
                min="60"
                max="180"
                step="30"
                value={params.cannabisBufferMinMinutes}
                onChange={(e) => setParams({ cannabisBufferMinMinutes: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {(params.cannabisBufferMinMinutes / 60).toFixed(1)} horas ({params.cannabisBufferMinMinutes} min)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Ventana Ideal de Descenso (Horas)
              </label>
              <input
                type="range"
                min="180"
                max="360"
                step="30"
                value={params.cannabisBufferIdealMinutes}
                onChange={(e) => setParams({ cannabisBufferIdealMinutes: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {(params.cannabisBufferIdealMinutes / 60).toFixed(1)} horas ({params.cannabisBufferIdealMinutes} min)
              </span>
            </div>
          </div>
        </div>

        {/* Sección 3: Presupuesto y Vida Social */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <DollarSign size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              Economía y Vínculos Sociales
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Presupuesto Semanal de Ocio (ARS)
              </label>
              <input
                type="range"
                min="10000"
                max="150000"
                step="5000"
                value={params.weeklyBudgetArs}
                onChange={(e) => setParams({ weeklyBudgetArs: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                ${params.weeklyBudgetArs.toLocaleString('es-AR')} ARS
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Meta de Bolsa Social Semanal
              </label>
              <input
                type="range"
                min="2"
                max="14"
                step="1"
                value={params.weeklySocialTargetHours}
                onChange={(e) => setParams({ weeklySocialTargetHours: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                {params.weeklySocialTargetHours} horas semanales
              </span>
            </div>
          </div>
        </div>

        {/* Sección 4: Registro Modular de Restricciones del Sistema */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sliders size={20} color="var(--accent-blue)" />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                  Constraint Registry Nativo (Reglas del Sistema)
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Activa o desactiva cualquier regla matemática nativa con un solo clic.
                </p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Hard Constraints (Lógica Booleana / Inviolables)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
            {constraintRegistry.hardRules.map((rule) => (
              <div
                key={rule.id}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-locked">{rule.id}</span>
                    <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{rule.name}</strong>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {rule.description}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                  title={rule.enabled ? 'Desactivar regla' : 'Activar regla'}
                >
                  {rule.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
            Soft Constraints (Ponderación Aritmética / Preferencias)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {constraintRegistry.softRules.map((rule) => (
              <div
                key={rule.id}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-floating">{rule.id}</span>
                    <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{rule.name}</strong>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                      {rule.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {rule.description}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                  title={rule.enabled ? 'Desactivar regla' : 'Activar regla'}
                >
                  {rule.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {savedSuccess && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: 600 }}>
              <Check size={16} />
              <span>Parámetros guardados y sincronizados</span>
            </span>
          )}
          <button onClick={handleSave} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>
    </main>
  );
}
