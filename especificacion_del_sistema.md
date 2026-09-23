# Especificación Técnica Integral de Arquitectura e Implementación
# PlanificadorDeMatu — Optimizador de Vida y Auto-Scheduling Adaptativo Bajo Restricciones (CSP)

**Documento Maestro de Ingeniería de Software**  
**Versión:** 2.0 (Edición Definitiva de Producción)  
**Autor:** Matu (Arquitectura de Dominio) & Antigravity (Ingeniería de Sistemas)  
**Entorno Operativo:** Web PWA / Next.js 15 (App Router) / TypeScript / PostgreSQL (Supabase) / Vercel / GitHub  

---

## 0. Rectificación Arquitectónica y Manifiesto de Ingeniería

### 0.1 Naturaleza del Sistema: Persistencia Relacional y Despliegue Continuo
PlanificadorDeMatu **NO** es un prototipo efímero ni una aplicación de juguete con almacenamiento local volátil. Es una plataforma web progresiva (**PWA**) de alta disponibilidad, estructurada con:
1. **Persistencia Relacional Robusta:** Base de datos **PostgreSQL alojada en Supabase**, con esquemas relacionales normalizados, integridad referencial, tipos `ENUM` nativos y seguridad por políticas a nivel de fila (**Row Level Security - RLS**).
2. **Cómputo Local Determinista de Costo Cero ($0 USD, < 50 ms):** El motor CSP opera en el cliente (Browser / PWA Service Worker) en TypeScript puro, desacoplado de servidores pesados y con **cero dependencia de modelos de lenguaje (LLMs)**.
3. **Flujo de Integración y Entrega Continua (CI/CD):** Repositorio sincronizado en **GitHub (`Mateov000/PlanificadorDeMatu`)** conectado a **Vercel** para despliegues atómicos automáticos en cada commit a la rama principal (`main`).

### 0.2 Separación Estricta: Mecanismos Matemáticos vs. Casos de Prueba
Queda formalmente prohibido hardcodear parámetros o nombres propios como si fuesen dogmas del motor. Los turnos en *"Ferro"* o *"Casino"*, las materias *"Redes"* o *"AEEC"*, los amigos *"Juancito"* o *"Juani"*, o las rutinas de *"Torso/Piernas con $\ge 2$ días"* son **casos de prueba y configuraciones de usuario**, no reglas estáticas.
El motor implementa **mecanismos genéricos y parametrizables**:
* **`LagConstraint<T>`:** Desfase temporal inter-sesión configurable entre variantes de cualquier hábito o entrenamiento.
* **`ScheduleDisruptor`:** Mecanismo universal de disrupción circadiana que ancla automáticamente el sueño reparador y el veto cognitivo tras cualquier evento nocturno o extenuante.
* **`CognitiveBan`:** Zona de exclusión para actividades con demanda mental $\ge 2$ durante buffers de aterrizaje e inercia del despertar.
* **`GraduatedConstraint`:** Funciones de penalización suave o rampa entre pisos mínimos e ideales (ej. descompresión y convivencia familiar).
* **`SocialPool`:** Bolsa semanal de horas fungibles con arbitraje meteorológico en tiempo real.

Todos los valores numéricos se leen desde la base de datos (`user_parameters`, `user_constraints`) y desde la consola de configuración (`params.ts`).

---

## 1. Esquema SQL Completo para Supabase (PostgreSQL)

El sistema requiere un esquema relacional estricto con RLS activado en todas las tablas para garantizar aislamiento multitenant y sincronización bidireccional.

```sql
-- ============================================================================
-- PlanificadorDeMatu - Esquema de Base de Datos para Producción
-- Motor: PostgreSQL 15+ (Supabase)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS NATIVOS
-- ----------------------------------------------------------------------------

-- Los 5 Arquetipos Temporales universales del motor CSP
CREATE TYPE archetype_type AS ENUM (
  'locked_pillar',      -- Turnos laborales, cursadas obligatorias (Overlap = 0)
  'floating_deadline',  -- Estudio de materias, entregas de software con cuota
  'elastic_routine',    -- Hábitos recurrentes con ventanas y descansos (Gym, Cocina)
  'social_flexible',    -- Bolsa social elástica, amigos, salidas espontáneas
  'logistics_buffer'    -- Desplazamientos espaciales, viandas, descanso activo
);

CREATE TYPE energy_drain_type AS ENUM ('low', 'normal', 'high');
CREATE TYPE match_type_enum AS ENUM ('contains', 'exact', 'regex');
CREATE TYPE constraint_type_enum AS ENUM ('hard', 'soft');

-- ----------------------------------------------------------------------------
-- 2. TABLA: custom_categories (Categorías Dinámicas del Usuario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(50) DEFAULT 'calendar',
  archetype archetype_type NOT NULL DEFAULT 'elastic_routine',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_categories_user ON categories(user_id);

-- ----------------------------------------------------------------------------
-- 3. TABLA: events (Eventos Fijos, Tareas Flotantes y Hábitos del Calendario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  display_alias VARCHAR(255),               -- Máscara de privacidad para feeds públicos/Webcal
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- Banderas de Comportamiento del Motor CSP
  is_locked BOOLEAN DEFAULT FALSE,          -- Candado absoluto inamovible (Hard Pillar)
  is_floating BOOLEAN DEFAULT FALSE,        -- Bloque ubicable dinámicamente por el solver
  is_sensitive BOOLEAN DEFAULT FALSE,       -- Requiere display_alias al exportar
  is_schedule_disruptor BOOLEAN DEFAULT FALSE, -- Dispara anclaje de sueño y veto cognitivo
  cannabis_consumed BOOLEAN DEFAULT FALSE,  -- Dispara buffer GHC-01 de descenso sobrio
  
  -- Demandas Biológicas, Fisiológicas y Espaciales
  cognitive_load INT CHECK (cognitive_load BETWEEN 0 AND 3) DEFAULT 0,
  physical_load INT CHECK (physical_load BETWEEN 0 AND 3) DEFAULT 0,
  energy_drain energy_drain_type DEFAULT 'normal',
  location VARCHAR(100) DEFAULT 'Casa',
  
  -- Metadatos para Arquetipo floating_deadline
  deadline TIMESTAMPTZ,
  total_required_minutes INT,
  min_block_minutes INT DEFAULT 90,
  max_block_minutes INT DEFAULT 180,
  
  -- Metadatos para Arquetipo elastic_routine (LagConstraint)
  split_variant VARCHAR(50),                -- Identificador del sub-hábito (ej. 'torso', 'piernas')
  recovery_days_needed INT DEFAULT 1,       -- Días de desfase biológico requerido
  preferred_time_window JSONB,              -- Rango horario predilecto {"start": "18:00", "end": "22:00"}
  
  -- Tolerancia a Tardanzas y Penalizaciones
  max_lateness_minutes INT DEFAULT 0,       -- 0 = militar, >0 = tolerancia suave
  lateness_penalty_weight NUMERIC(4,2) DEFAULT 1.0,
  
  -- Dimensión Financiera (Moneda Local ARS)
  estimated_cost_ars NUMERIC(10,2) DEFAULT 0.0,
  
  -- Sincronización Externa (Google Calendar / iCal)
  google_event_id VARCHAR(255),
  sync_etag VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user_time ON events(user_id, start_time, end_time);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_google_id ON events(user_id, google_event_id);

-- ----------------------------------------------------------------------------
-- 4. TABLA: user_constraints (Registro de Restricciones Configuradas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id VARCHAR(100) NOT NULL,            -- Ej: 'HC-03', 'HC-06', 'CUSTOM-01'
  rule_type constraint_type_enum NOT NULL,  -- 'hard' o 'soft'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority_weight NUMERIC(5,2) DEFAULT 1.0, -- Ponderación en función soft de scoring
  custom_params JSONB NOT NULL DEFAULT '{}'::jsonb, -- Umbrales y variables de la regla
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);

CREATE INDEX idx_user_constraints_user ON user_constraints(user_id);

-- ----------------------------------------------------------------------------
-- 5. TABLA: user_parameters (Consola Central de Perillas del Motor CSP)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_parameters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_sleep_minutes INT NOT NULL DEFAULT 480,        -- 8 horas de sueño biológico
  night_threshold_time TIME NOT NULL DEFAULT '23:30',   -- Umbral de disrupción nocturna
  cognitive_landing_buffer_minutes INT NOT NULL DEFAULT 60, -- Aterrizaje post-trabajo/estudio
  wake_inertia_buffer_minutes INT NOT NULL DEFAULT 90,      -- Inercia al despertar desfasado
  cannabis_buffer_min_minutes INT NOT NULL DEFAULT 120,     -- GHC-01 piso mínimo de descenso
  cannabis_buffer_ideal_minutes INT NOT NULL DEFAULT 240,   -- GHC-01 ventana ideal
  travel_safety_margin_minutes INT NOT NULL DEFAULT 10,     -- Margen de seguridad sobre viajes
  weekly_social_target_hours NUMERIC(4,1) NOT NULL DEFAULT 6.0, -- Cuota bolsa social
  weekly_budget_ars NUMERIC(10,2) NOT NULL DEFAULT 50000.0, -- Límite semanal de salidas
  weight_academic NUMERIC(3,2) NOT NULL DEFAULT 1.0,    -- Slider académico
  weight_social NUMERIC(3,2) NOT NULL DEFAULT 1.0,      -- Slider social
  weight_wellness NUMERIC(3,2) NOT NULL DEFAULT 1.0,    -- Slider bienestar
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. TABLA: travel_matrix (Matriz Espacial de Tiempos de Traslado)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS travel_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL,
  transport_mode VARCHAR(50) NOT NULL DEFAULT 'colectivo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, origin, destination)
);

CREATE INDEX idx_travel_matrix_user ON travel_matrix(user_id);

-- ----------------------------------------------------------------------------
-- 7. TABLA: auto_mapping_rules (Reglas de Auto-Mapeo del Triage Semántico)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auto_mapping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern VARCHAR(150) NOT NULL,            -- Ej: 'Casino', 'Redes', 'Dentista'
  match_type match_type_enum NOT NULL DEFAULT 'contains',
  assigned_category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  default_is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  default_location VARCHAR(100) NOT NULL DEFAULT 'Casa',
  default_cognitive_load INT NOT NULL DEFAULT 0,
  default_max_lateness INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auto_mapping_user ON auto_mapping_rules(user_id);

-- ----------------------------------------------------------------------------
-- 8. TABLA: sync_tokens (Tokens de Suscripción Webcal Feed RFC 5545)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_sync_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_tokens_token ON calendar_sync_tokens(token);

-- ----------------------------------------------------------------------------
-- 9. SEGURIDAD: ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ----------------------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_mapping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento estricto por usuario autenticado
CREATE POLICY "Users can manage their own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own events"
  ON events FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own constraints"
  ON user_constraints FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own parameters"
  ON user_parameters FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own travel matrix"
  ON travel_matrix FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mapping rules"
  ON auto_mapping_rules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sync tokens"
  ON calendar_sync_tokens FOR ALL USING (auth.uid() = user_id);
```

---

## 2. Arquitectura de Carpetas en Next.js (App Router) Desacoplada

Para garantizar el principio de responsabilidad única y cero acoplamiento, el sistema aísla por completo el **motor de satisfacción de restricciones (CSP)**, el **registro de reglas**, los **adaptadores de persistencia de Supabase** y la **interfaz de usuario de React**.

```
c:\Users\Matu\Documents\PlanificadorDeMatu/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline CI en GitHub Actions (test, lint, typecheck)
├── supabase/
│   ├── migrations/
│   │   └── 20260923000001_initial_schema.sql  # Migración DDL de producción
│   └── config.toml                # Configuración local de Supabase
├── src/
│   ├── app/                       # Next.js App Router (Páginas y Endpoints)
│   │   ├── api/
│   │   │   ├── calendar/
│   │   │   │   └── feed/
│   │   │   │       └── route.ts   # Endpoint Webcal Feed (.ics) con autenticación por token
│   │   │   └── weather/
│   │   │       └── route.ts       # Proxy cacheado para Open-Meteo Mar del Plata
│   │   ├── settings/
│   │   │   └── page.tsx           # Dashboard de variables de decisión y constructor de reglas
│   │   ├── layout.tsx             # Shell raíz con theme oscuro y navegación
│   │   ├── page.tsx               # Vista principal: Calendario Semanal, Sliders y Clima
│   │   └── globals.css            # Tokens de diseño y utilidades CSS
│   │
│   ├── solver/                    # CAPA PURA: Motor de Satisfacción de Restricciones (CSP)
│   │   ├── core/
│   │   │   ├── ac3.ts             # Algoritmo Arc Consistency 3 y Forward Checking
│   │   │   ├── timeDomain.ts      # Matriz discreta de 672 slots semanales (15 min)
│   │   │   ├── scheduler.ts       # Orquestador del solver (backtracking + heuristics)
│   │   │   └── scoreEvaluator.ts  # Función aritmética unificada de puntuación
│   │   ├── explainability/
│   │   │   └── diffExplainer.ts   # Generador de explicaciones simbólicas (< 1 ms, sin LLMs)
│   │   └── types.ts               # Tipos internos del solver (CSPVariable, CSPDomain)
│   │
│   ├── constraints/               # CAPA MODULAR: Plugin Registry de Restricciones
│   │   ├── contracts.ts           # Interfaces unificadas: ConstraintEvaluator, Hard/Soft Context
│   │   ├── registry.ts            # ConstraintRegistry singleton con carga dinámica
│   │   ├── params.ts              # Valores por defecto y resolución de parámetros
│   │   ├── hard/                  # Restricciones Duras (Poda matemática estricta: P(slot) = boolean)
│   │   │   ├── HC01_NoOverlap.ts          # Solapamiento cero
│   │   │   ├── HC02_LockedPillars.ts      # Inmutabilidad de bloques bloqueados
│   │   │   ├── HC03_SleepAnchor.ts        # Anclaje dinámico de 8h de sueño post-disrupción
│   │   │   ├── HC04_CognitiveBan.ts       # Veto cognitivo post-llegada e inercia al despertar
│   │   │   ├── HC05_TravelViability.ts    # Tiempos de viaje reales entre ubicaciones
│   │   │   ├── HC06_SplitLagRecovery.ts   # LagConstraint inter-sesión de recuperación física
│   │   │   └── GHC01_CannabisBuffer.ts    # Margen sobrio garantizado de convivencia familiar
│   │   └── soft/                  # Restricciones Blandas (Scoring aritmético: Penalty(slot) = [0, 100])
│   │       ├── SC01_StudyFocalBlocks.ts   # Foco continuo (90-180 min) en picos de lucidez
│   │       ├── SC02_CircadianFatigue.ts   # Penalización por deuda de sueño y nocturnidad
│   │       ├── SC03_WeatherArbitrage.ts   # Arbitraje meteorológico de actividades costeras
│   │       ├── SC04_PunctualityPenalty.ts # Matriz de tolerancia a tardanzas
│   │       ├── SC05_SocialPoolBalance.ts  # Cumplimiento de bolsa social semanal
│   │       ├── SC06_BudgetOptimization.ts # Restricción presupuestaria en pesos (ARS)
│   │       └── SC07_SpatialClustering.ts  # Encadenamiento geográfico de proximidad
│   │
│   ├── lib/
│   │   ├── supabase/              # Adaptadores de Datos de Supabase
│   │   │   ├── client.ts          # Cliente Supabase para el navegador (CSR)
│   │   │   ├── server.ts          # Cliente Supabase para Server Components y API Routes
│   │   │   └── middleware.ts      # Verificación de sesión y cookies seguras
│   │   ├── sync/
│   │   │   └── supabaseSync.ts    # Capa de sincronización y mutaciones optimistas
│   │   ├── store/
│   │   │   └── scheduleStore.ts   # Store reactivo Zustand con persistencia local/cloud
│   │   ├── calendar/
│   │   │   ├── icsGenerator.ts    # Serializador estándar RFC 5545 para exportación .ics
│   │   │   └── privacyShield.ts   # Máscaras de privacidad para eventos sensibles
│   │   └── weather/
│   │       └── openMeteoClient.ts # Cliente del microclima marítimo de Mar del Plata
│   │
│   ├── components/                # Interfaz de Usuario y Vistas
│   │   ├── Navigation.tsx         # Barra de navegación superior con estado de red
│   │   ├── calendar/              # Grilla temporal semanal interactiva
│   │   │   ├── WeekGrid.tsx       # Cuadrícula de 7 días x 24 horas con seccionamiento 00:00
│   │   │   ├── DayColumn.tsx      # Columna diaria
│   │   │   ├── EventCard.tsx      # Tarjeta de evento con gradientes por arquetipo
│   │   │   └── TimeRuler.tsx      # Regla horaria de 00:00 a 23:00
│   │   ├── controls/
│   │   │   ├── MetaSliders.tsx    # Sliders de tensión (Académico, Social, Bienestar) con tooltips
│   │   │   └── WeatherWidget.tsx  # Widget meteorológico de Mar del Plata (Viento SE, lluvia)
│   │   └── modals/
│   │       ├── SemanticTriageModal.tsx  # Wizard de Triage para importación de Google Calendar
│   │       ├── DiffViewerModal.tsx      # Modal de explicación de cambios del solver
│   │       ├── PanicButtonModal.tsx     # Modal del Botón de Pánico (desalojo en cascada)
│   │       ├── WhatIfModal.tsx          # Sandbox de simulación "¿Y si...?"
│   │       ├── WeeklyOnboardingModal.tsx # Planificación guiada de domingo
│   │       ├── CreateEventModal.tsx     # Creación de eventos con selector de arquetipo
│   │       └── EditEventModal.tsx       # Edición y ajuste de propiedades
│   │
│   └── types/                     # Contratos de TypeScript
│       ├── event.ts               # Modelos de Evento, Categoría y Arquetipos Temporales
│       ├── parameters.ts          # Tipos de la consola de configuración
│       └── weather.ts             # Tipos meteorológicos
```

---

## 3. El Modelo de los 5 Arquetipos Temporales en TypeScript

Para permitir que el usuario cree **infinitas categorías personalizadas** (ej. *"Guitarra"*, *"Terapia"*, *"Pádel"*, *"Tesis"*, *"Mantenimiento del Auto"*) sin provocar una explosión combinatoria ni obligar a reescribir el solver, el sistema utiliza una **arquitectura de dos capas**:
1. **Capa Semántica (Usuario):** Nombre, icono, color identificatorio y etiquetas visibles.
2. **Capa Funcional (Motor CSP):** Clasificación fija en uno de los **5 Arquetipos de Comportamiento Temporal**.

La complejidad computacional al añadir una categoría es **$O(1)$ constante**, ya que el motor CSP optimiza el arquetipo subyacente mediante ecuaciones ya compiladas.

### 3.1 Definición de Tipos y Rasgos (Traits) en `src/types/event.ts`

```typescript
/**
 * Arquetipos de Comportamiento Temporal del Motor CSP
 */
export type ArchetypeType =
  | 'locked_pillar'      // Turnos laborales, cursadas con asistencia obligatoria (Overlap = 0)
  | 'floating_deadline'  // Metas de estudio o proyectos con cuota de horas antes de una entrega
  | 'elastic_routine'    // Hábitos con frecuencia semanal, ventanas predilectas y descanso inter-sesión
  | 'social_flexible'    // Bolsa de tiempo social fungible, sujeta a desalojo y arbitraje climático
  | 'logistics_buffer';  // Tareas operativas de soporte, viajes, viandas y descanso activo

export type EnergyDrain = 'low' | 'normal' | 'high';

/**
 * Rasgo para Eventos Rígidos e Inamovibles
 */
export interface LockedPillarTrait {
  isLocked: true;
  fixedStartTime: Date | string;
  fixedEndTime: Date | string;
  toleranceMinutes: 0; // Puntualidad estricta
}

/**
 * Rasgo para Metas Flotantes con Auto-Splitting y Fecha Límite
 */
export interface FloatingDeadlineTrait {
  deadline: Date | string;
  totalRequiredMinutes: number;
  minBlockMinutes: number; // Mínimo tiempo para foco profundo (ej. 90 min)
  maxBlockMinutes: number; // Techo de saturación cognitiva (ej. 180 min)
  splitVariant?: string;
}

/**
 * Rasgo para Hábitos Elásticos con Lag Inter-Sesión (Gimnasio, Instrumento)
 */
export interface ElasticRoutineTrait {
  frequencyPerWeek: number;
  durationMinutes: number;
  preferredTimeWindow?: {
    start: string; // "18:00"
    end: string;   // "22:00"
    daysOfWeek?: number[];
  };
  recoveryDaysNeeded: number; // LagConstraint: descanso mínimo entre variantes
  splitVariant?: string;      // Ej: 'torso', 'piernas'
}

/**
 * Rasgo para Salidas Sociales con Bolsa Fungible y Desalojo
 */
export interface SocialFlexibleTrait {
  allocatedHoursPool: number;
  canBeEvictedByPanicButton: true;
  outdoorActivity: boolean;
  minWeatherComfortIndex: number; // Umbral de confort climático de Mar del Plata
  estimatedCostArs: number;
}

/**
 * Rasgo para Tareas de Soporte y Logística
 */
export interface LogisticsBufferTrait {
  cognitiveLoad: 0; // Excluido de veto cognitivo
  physicalLoad: number;
  flexibleAttachmentToLocation: boolean;
}

/**
 * Entidad de Categoría Vinculada a un Arquetipo
 */
export interface Category {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  archetype: ArchetypeType;
}

/**
 * Entidad de Evento Polimórfica Optimizada por el Solver
 */
export interface Event {
  id: string;
  userId?: string;
  categoryId?: string;
  category?: Category;
  title: string;
  displayAlias?: string; // Máscara de privacidad para vistas públicas y Webcal
  description?: string;

  // Marcas temporales exactas (asignadas o propuestas por el solver)
  startTime?: Date | string;
  endTime?: Date | string;
  durationMinutes: number;
  isAllDay?: boolean;

  // Banderas del Algoritmo CSP
  isLocked?: boolean;            // Candado absoluto inamovible (Hard Pillar)
  isFloating?: boolean;          // Bloque auto-ubicable por el solver
  isSensitive?: boolean;         // Requiere display_alias en exportaciones y feeds
  isScheduleDisruptor?: boolean; // Dispara anclaje de sueño dinámico y veto cognitivo
  cannabisConsumed?: boolean;    // Dispara margen GHC-01 de descenso sobrio

  // Metadatos Biológicos y Cognitivos
  cognitiveLoad: number; // 0 = mecánico, 1 = ligero, 2 = moderado, 3 = foco profundo
  physicalLoad: number;  // 0 = reposo, 1 = suave, 2 = moderado, 3 = extenuante
  energyDrain: EnergyDrain;
  location: string;      // 'Casa', 'Facultad', 'Rambla Casino', 'Ferro', etc.

  // Parámetros de Metas Flotantes (Floating Deadlines)
  deadline?: Date | string;
  totalRequiredMinutes?: number;
  minBlockMinutes?: number;
  maxBlockMinutes?: number;

  // Parámetros de Rutinas Elásticas (LagConstraint)
  splitVariant?: string;
  recoveryDaysNeeded?: number;
  preferredTimeWindow?: {
    start: string;
    end: string;
    daysOfWeek?: number[];
  };

  // Tolerancia a Tardanzas (Punctuality Matrix)
  maxLatenessMinutes?: number;
  latenessPenaltyWeight?: number;

  // Dimensión Económica
  estimatedCostArs?: number;

  // Sincronización Externa
  googleEventId?: string;
  syncEtag?: string;

  createdAt?: string;
  updatedAt?: string;
}
```

---

## 4. Mecanismos Paramétricos del Solver (Sin Hardcodeos Dogmáticos)

El solver de PlanificadorDeMatu no contiene reglas fijas con números inmutables. Implementa cinco abstracciones matemáticas puras:

### 4.1 Mecanismo de Desfase Temporal Inter-Sesión (`LagConstraint<T>`)
Aplica a cualquier hábito donde dos variantes requieran descanso fisiológico o mental intermedio (ej. variantes de entrenamiento muscular, sesiones de redacción densa o exámenes sucesivos):
$$|day(Slot_A) - day(Slot_B)| \ge \text{recoveryDaysNeeded}(Variant_A, Variant_B)$$
* **Comportamiento en AC-3:** Al asignar la variante $A$ en el día $d$, el dominio de slots para la variante $B$ en la semana elimina inmediatamente todos los slots de los días $[d - N + 1, d + N - 1]$.
* **Configuración:** El usuario edita la matriz de recuperación en la interfaz sin modificar el solver.

### 4.2 Mecanismo de Disrupción Circadiana Universal (`ScheduleDisruptor`)
Agnóstico a la fuente de la actividad (trabajo de cierre, recital, juntada nocturna):
Cualquier evento $E$ cuyo $t_{\text{end}} > \text{nightThresholdTime}$ o con flag `isScheduleDisruptor: true` proyecta automáticamente:
$$t_{\text{inicio\_sueño}} = t_{\text{fin\_evento}} + \text{travelMatrix}(E_{\text{ubicación}}, \text{'Casa'}) + \text{travelSafetyMargin}$$
$$t_{\text{fin\_sueño}} = t_{\text{inicio\_sueño}} + \text{targetSleepMinutes}$$
* **Hard Constraint inviolable:** La ventana $[t_{\text{inicio\_sueño}}, t_{\text{fin\_sueño}}]$ tiene $\text{Overlap} = 0$. Ninguna tarea flotante puede invadir este bloque.

### 4.3 Mecanismo de Veto Cognitivo (`CognitiveBan`)
Evita agendar actividades con `cognitiveLoad >= 2` en dos ventanas fisiológicas de fatiga:
1. **Buffer de Aterrizaje:** $[t_{\text{llegada\_casa}}, t_{\text{llegada\_casa}} + \text{cognitiveLandingBufferMinutes}]$
2. **Buffer de Inercia de Sueño:** $[t_{\text{despertar}}, t_{\text{despertar}} + \text{wakeInertiaBufferMinutes}]$

En estas franjas horarias, el solver únicamente permite actividades con `cognitiveLoad = 0` (`logistics_buffer`, alimentación o descanso pasivo).

### 4.4 Mecanismo de Restricciones Graduadas (`GraduatedConstraint`)
Modela transiciones fisiológicas o de convivencia mediante una función de penalización en rampa continua:
$$\text{Penalización}(t) = \begin{cases} \infty & \text{si } t < t_{\text{min}} \quad \text{(Violación Hard)} \\ w \cdot \left(1 - \frac{t - t_{\text{min}}}{t_{\text{ideal}} - t_{\text{min}}}\right) & \text{si } t_{\text{min}} \le t < t_{\text{ideal}} \quad \text{(Soft Penalty)} \\ 0 & \text{si } t \ge t_{\text{ideal}} \quad \text{(Zona Óptima)} \end{cases}$$
Utilizado en el buffer de descenso y sobriedad familiar (GHC-01) y en buffers de preparación previa a exámenes.

### 4.5 Mecanismo de Bolsa Social Fungible (`SocialPool`) y Arbitraje Climático
La vida social se computa como una bolsa de horas semanal configurable ($\text{TargetHours}$). El solver utiliza una penalización cuadrática simétrica:
$$\text{Penalty}_{\text{social}} = w_{\text{social}} \cdot (\text{HorasAsignadas} - \text{TargetHours})^2$$
* **Arbitraje Meteorológico Costero:** Si una actividad social tiene `outdoorActivity: true` y el índice de confort climático en Mar del Plata es bajo (viento del Sudeste $> 35\text{ km/h}$ o precipitación $> 1.0\text{ mm}$), el solver desplaza el evento hacia una ventana soleada o sugiere un recinto cerrado (`location: 'Bar techado'`).

---

## 5. Integración con Google Calendar y Wizard de Triage Semántico (Módulo 8)

### 5.1 El Problema del Calendario Externo
Los eventos importados desde Google Calendar o archivos `.ics` externos son **lienzos mudos**: solo contienen título, fecha y hora. Carecen de los metadatos requeridos por el solver (arquetipo, demanda cognitiva, candado fijo, ubicación física para el cálculo de viaje).

### 5.2 El Wizard de Triage Semántico (`SemanticTriageModal.tsx`)
Cuando el sistema detecta eventos externos nuevos:
1. Intercepta la importación antes de incorporarlos a la agenda activa.
2. Despliega el **Modal de Triage Semántico** para clasificar rápidamente cada evento:
   - Asignación de Categoría y Arquetipo Temporal (`locked_pillar`, `floating_deadline`, etc.).
   - Estado de Candado (`is_locked: true/false`).
   - Ubicación física (para cálculo automático de traslados en la matriz espacial).
   - Demanda cognitiva y física (0 a 3).
3. **Persistencia de Reglas de Auto-Mapeo (`auto_mapping_rules`):**
   - El usuario puede marcar *"Recordar regla para futuros eventos"*.
   - Se guarda en la tabla `auto_mapping_rules` de Supabase una regla de coincidencia (por subcadena, coincidencia exacta o regex).
   - En sincronizaciones sucesivas, los eventos coincidentes se importan y enriquecen de forma automática en 0 milisegundos sin requerir intervención manual.

### 5.3 Live Sync Bidireccional y Feed Webcal Seguro (RFC 5545)
* **Suscripción Webcal Dinámica:** La aplicación expone el endpoint `/api/calendar/feed?token=XYZ` que devuelve un calendario estándar iCalendar (`text/calendar`).
* **Autenticación por Token Seguro:** El token de 64 caracteres se valida contra la tabla `calendar_sync_tokens`.
* **Máscaras de Privacidad (`PrivacyShield`):** Si un evento tiene la bandera `is_sensitive: true` (ej. descanso biológico, terapia, buffer de descenso), el serializador `.ics` reemplaza el título por `displayAlias` (ej. *"Compromiso Personal"*), limpia las descripciones y añade la cabecera `CLASS:PRIVATE`.

---

## 6. Plan de Setup del Repositorio en GitHub, Supabase y Deploy en Vercel

### 6.1 Repositorio en GitHub (`Mateov000/PlanificadorDeMatu`)
1. **Estructura de Control de Versiones:**
   - Rama principal protegida: `main` (código verificado y en producción).
   - Convención de commits: *Conventional Commits* (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
2. **Pipeline de Integración Continua (GitHub Actions):**
   Archivo `.github/workflows/ci.yml` ejecutado en cada `push` y `pull_request`:
   ```yaml
   name: CI Pipeline
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: 'npm'
         - run: npm ci
         - run: npx tsc --noEmit
         - run: npx vitest run
         - run: npm run build
   ```

### 6.2 Setup y Despliegue en Supabase (PostgreSQL Cloud)
1. **Creación del Proyecto:**
   - Crear un nuevo proyecto en Supabase: *PlanificadorDeMatu-DB* en la región más cercana (ej. `sa-east-1` São Paulo para mínima latencia desde Argentina).
2. **Aplicación de Migraciones:**
   - Ejecutar la migración SQL `supabase/migrations/20260923000001_initial_schema.sql` en el SQL Editor de Supabase o mediante la CLI de Supabase:
     ```bash
     npx supabase login
     npx supabase link --project-ref <PROJECT_ID>
     npx supabase db push
     ```
3. **Configuración de Variables de Entorno (`.env.local` / Vercel):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_ID>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   NEXT_PUBLIC_APP_URL=https://planificador-de-matu.vercel.app
   ```

### 6.3 Despliegue Continuo en Vercel (Edge PWA Hosting)
1. **Conexión del Proyecto:**
   - Importar el repositorio `Mateov000/PlanificadorDeMatu` desde el Dashboard de Vercel.
   - Framework preset: **Next.js**.
   - Build Command: `npm run build`.
   - Output Directory: `.next`.
2. **Carga de Variables de Entorno en Vercel:**
   - Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en los entornos de *Production*, *Preview* y *Development*.
3. **Configuración de PWA y Cabeceras de Rendimiento (`next.config.ts`):**
   - Soporte offline mediante Service Worker y manifest web (`public/manifest.json`).
   - Cabeceras de caché estricta para activos estáticos y política `no-cache` para el endpoint Webcal `/api/calendar/feed`.
4. **Validación de Despliegue Atómico:**
   - Cada commit en `main` dispara automáticamente la compilación en Vercel, ejecutando el solver sobre los casos de prueba y disponibilizando la aplicación en producción en menos de 60 segundos.
