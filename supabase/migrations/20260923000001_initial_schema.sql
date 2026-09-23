-- PlanificadorDeMatu - Esquema Inicial de Base de Datos
-- PostgreSQL / Supabase Migration

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Arquetipos de Comportamiento Temporal (Trait-Based Classification)
CREATE TYPE archetype_type AS ENUM (
  'locked_pillar',      -- Turnos laborales, cursadas fijas (Overlap = 0)
  'floating_deadline',  -- Estudio de materias, proyectos con entrega
  'elastic_routine',    -- Hábitos con ventanas y descansos (Gym, Cocina)
  'social_flexible',    -- Bolsa social, amigos, salidas espontáneas
  'logistics_buffer'    -- Desplazamientos, viandas, descanso activo
);

-- 2. Categorías de Usuario
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(50) DEFAULT 'calendar',
  archetype archetype_type NOT NULL DEFAULT 'elastic_routine',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- 3. Tabla Principal de Eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  display_alias VARCHAR(255),               -- Máscara de privacidad para vistas públicas / Webcal
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- Flags del Motor CSP
  is_locked BOOLEAN DEFAULT FALSE,          -- Candado inamovible (Hard Pillar)
  is_floating BOOLEAN DEFAULT FALSE,        -- Bloque ubicable por el solver
  is_sensitive BOOLEAN DEFAULT FALSE,       -- Requiere display alias al exportar
  is_schedule_disruptor BOOLEAN DEFAULT FALSE, -- Dispara anclaje de sueño y veto cognitivo
  
  -- Demandas Biológicas y Cognitivas
  cognitive_load INT CHECK (cognitive_load BETWEEN 0 AND 3) DEFAULT 0,
  physical_load INT CHECK (physical_load BETWEEN 0 AND 3) DEFAULT 0,
  energy_drain VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high'
  location VARCHAR(100) DEFAULT 'Casa',
  
  -- Parámetros de Metas Flotantes (Floating Deadlines)
  deadline TIMESTAMPTZ,
  total_required_minutes INT,
  min_block_minutes INT DEFAULT 90,
  max_block_minutes INT DEFAULT 180,
  
  -- Rutinas Elásticas y Descanso Inter-Sesión
  split_variant VARCHAR(50),                -- Ej: 'pecho', 'espalda', 'piernas'
  recovery_days_needed INT DEFAULT 1,       -- LagConstraint
  preferred_time_window JSONB,
  
  -- Tolerancia a Tardanzas (Punctuality Matrix)
  max_lateness_minutes INT DEFAULT 0,       -- 0 min para trabajo y materias estrictas
  lateness_penalty_weight NUMERIC(4,2) DEFAULT 1.0,
  
  -- Dimensión Económica
  estimated_cost_ars NUMERIC(10,2) DEFAULT 0.0,
  
  -- Sincronización Externa
  google_event_id VARCHAR(255),
  sync_etag VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Parámetros de Configuración de Usuario (Consola de Perillas / params.ts)
CREATE TABLE IF NOT EXISTS user_parameters (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_sleep_minutes INT DEFAULT 480,        -- 8 horas de sueño
  night_threshold_time TIME DEFAULT '23:30',    -- Umbral de trasnoche
  cognitive_landing_buffer_minutes INT DEFAULT 60, -- Aterrizaje post-evento pesado
  wake_inertia_buffer_minutes INT DEFAULT 90,      -- Inercia al despertar desfasado
  cannabis_buffer_min_minutes INT DEFAULT 120,     -- GHC-01 piso mínimo (convivencia familiar)
  cannabis_buffer_ideal_minutes INT DEFAULT 240,   -- GHC-01 ideal
  travel_safety_margin_minutes INT DEFAULT 10,
  weekly_social_target_hours NUMERIC(4,1) DEFAULT 6.0,
  weekly_budget_ars NUMERIC(10,2) DEFAULT 50000.0,
  weight_academic NUMERIC(3,2) DEFAULT 1.0,
  weight_social NUMERIC(3,2) DEFAULT 1.0,
  weight_wellness NUMERIC(3,2) DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Matriz de Traslados Espaciales
CREATE TABLE IF NOT EXISTS travel_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  duration_minutes INT NOT NULL,
  transport_mode VARCHAR(50) DEFAULT 'colectivo',
  UNIQUE(user_id, origin, destination)
);

-- 6. Reglas de Auto-Mapeo Semántico (Google Calendar Triage)
CREATE TABLE IF NOT EXISTS auto_mapping_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern VARCHAR(100) NOT NULL,
  match_type VARCHAR(20) DEFAULT 'contains',
  assigned_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  default_is_locked BOOLEAN DEFAULT TRUE,
  default_location VARCHAR(100) DEFAULT 'Casa',
  default_cognitive_load INT DEFAULT 0,
  default_max_lateness INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tokens para Live Sync Webcal Feed (iCal seguro)
CREATE TABLE IF NOT EXISTS calendar_sync_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Seguridad RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
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
