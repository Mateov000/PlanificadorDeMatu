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
-- 2. TABLA: custom_categories (Categorías Dinámicas del Usuario en O(1))
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

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- ----------------------------------------------------------------------------
-- 3. TABLA: events (Eventos Fijos, Tareas Flotantes y Hábitos del Calendario)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  display_alias VARCHAR(255),                  -- Máscara de privacidad para feeds públicos/Webcal
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- Banderas de Comportamiento del Motor CSP
  is_locked BOOLEAN DEFAULT FALSE,             -- Candado absoluto inamovible (Hard Pillar)
  is_floating BOOLEAN DEFAULT FALSE,           -- Bloque ubicable dinámicamente por el solver
  is_sensitive BOOLEAN DEFAULT FALSE,          -- Requiere display_alias al exportar
  is_schedule_disruptor BOOLEAN DEFAULT FALSE, -- Dispara anclaje de sueño y veto cognitivo
  cannabis_consumed BOOLEAN DEFAULT FALSE,     -- Dispara buffer GHC-01 de descenso sobrio
  
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
  split_variant VARCHAR(50),                   -- Identificador de variante (ej. 'torso', 'piernas')
  recovery_days_needed INT DEFAULT 1,          -- Días de desfase biológico requerido
  preferred_time_window JSONB,                 -- Rango horario predilecto {"start": "18:00", "end": "22:00"}
  
  -- Tolerancia a Tardanzas y Penalizaciones
  max_lateness_minutes INT DEFAULT 0,          -- 0 = militar, >0 = tolerancia suave
  lateness_penalty_weight NUMERIC(4,2) DEFAULT 1.0,
  
  -- Dimensión Financiera (Moneda Local ARS)
  estimated_cost_ars NUMERIC(10,2) DEFAULT 0.0,
  
  -- Periodicidad y Recurrencia Personalizable
  recurrence_rule JSONB,                       -- Regla {"frequency": "weekly", "interval": 1, "daysOfWeek": [1,3,5], "count": 10}
  recurrence_parent_id UUID REFERENCES events(id) ON DELETE CASCADE, -- ID del evento padre de la serie

  -- Sincronización Externa (Google Calendar / iCal)
  google_event_id VARCHAR(255),
  sync_etag VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_google_id ON events(user_id, google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent ON events(recurrence_parent_id);

-- ----------------------------------------------------------------------------
-- 4. TABLA: user_constraints (Registro de Restricciones del Constraint Registry)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id VARCHAR(100) NOT NULL,               -- Ej: 'HC-03', 'HC-06', 'CUSTOM-01'
  rule_type constraint_type_enum NOT NULL,     -- 'hard' o 'soft'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  priority_weight NUMERIC(5,2) DEFAULT 1.0,    -- Ponderación en función soft de scoring
  custom_params JSONB NOT NULL DEFAULT '{}'::jsonb, -- Umbrales y variables configurables
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);

CREATE INDEX IF NOT EXISTS idx_user_constraints_user ON user_constraints(user_id);

-- ----------------------------------------------------------------------------
-- 5. TABLA: user_parameters (Consola Central de Perillas del Motor CSP / params.ts)
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

CREATE INDEX IF NOT EXISTS idx_travel_matrix_user ON travel_matrix(user_id);

-- ----------------------------------------------------------------------------
-- 7. TABLA: auto_mapping_rules (Reglas del Wizard de Triage Semántico de Google Calendar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auto_mapping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern VARCHAR(150) NOT NULL,               -- Ej: 'Casino', 'Redes', 'Dentista'
  match_type match_type_enum NOT NULL DEFAULT 'contains',
  assigned_category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  default_is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  default_location VARCHAR(100) NOT NULL DEFAULT 'Casa',
  default_cognitive_load INT NOT NULL DEFAULT 0,
  default_max_lateness INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_mapping_user ON auto_mapping_rules(user_id);

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

CREATE INDEX IF NOT EXISTS idx_sync_tokens_token ON calendar_sync_tokens(token);

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

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own categories') THEN
    CREATE POLICY "Users manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own events') THEN
    CREATE POLICY "Users manage own events" ON events FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own constraints') THEN
    CREATE POLICY "Users manage own constraints" ON user_constraints FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own parameters') THEN
    CREATE POLICY "Users manage own parameters" ON user_parameters FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own travel matrix') THEN
    CREATE POLICY "Users manage own travel matrix" ON travel_matrix FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own mapping rules') THEN
    CREATE POLICY "Users manage own mapping rules" ON auto_mapping_rules FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own sync tokens') THEN
    CREATE POLICY "Users manage own sync tokens" ON calendar_sync_tokens FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
