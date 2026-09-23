'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useScheduleStore } from '@/lib/store/scheduleStore';
import { constraintRegistry } from '@/constraints/registry';
import { Sliders, Moon, Brain, Shield, Car, DollarSign, ToggleLeft, ToggleRight, Check } from 'lucide-react';

export default function SettingsPage() {
  const { params, setParams } = useScheduleStore();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Forzar re-render local al alternar restricciones
  const [, setTick] = useState(0);

  const handleToggleRule = (id: string, currentEnabled: boolean) => {
    constraintRegistry.setRuleEnabled(id, !currentEnabled);
    setTick((t) => t + 1);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <main style={{ padding: '0 1.5rem 4rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Navigation />

      <div style={{ margin: '2rem 0 2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Consola de Perillas y Restricciones
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
          Configura tus parámetros biológicos, de convivencia, traslados y activa/apaga restricciones de forma aislada.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

        {/* Sección 4: Registro Modular de Restricciones (Toggles ON/OFF) */}
        <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sliders size={20} color="var(--accent-blue)" />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                  Constraint Registry (Reglas Activas)
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Activa o desactiva cualquier regla matemática con un solo clic.
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
