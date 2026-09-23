# Especificación del Sistema: PlanificadorDeMatu
## Optimizador de Vida y Auto-Scheduling Adaptativo Bajo Restricciones (CSP)

**Documento Maestro de Arquitectura y Especificación Funcional**  
**Repositorio GitHub:** [`Mateov000/PlanificadorDeMatu`](https://github.com/Mateov000/PlanificadorDeMatu)  
**Entorno de Producción:** Web PWA / Next.js 15 (App Router) / TypeScript / PostgreSQL (Supabase) / Vercel  
**Destinatario:** Matu (Mar del Plata, Argentina)  

---

## 1. ¿Qué es la Aplicación y Cuál es su Razón de Ser?

### 1.1 Naturaleza del Producto
**PlanificadorDeMatu** es una aplicación web progresiva (**PWA**) de auto-scheduling inteligente basada en **Satisfacción de Restricciones (CSP - Constraint Satisfaction Problem)** con persistencia en **PostgreSQL (Supabase)**. 

No es un calendario pasivo ni una lista de tareas: opera como un **sistema operativo personal determinista** diseñado para absorber el caos de la vida cotidiana y armonizar turnos laborales rotativos, cursadas universitarias de ingeniería, sesiones de entrenamiento físico, vida social activa, descanso biológico garantizado y el microclima oceánico de Mar del Plata.

### 1.2 El Problema del Mundo Real que Resuelve
Las herramientas comerciales de productividad fallan sistemáticamente porque están diseñadas para oficinistas corporativos de Silicon Valley con jornadas estáticas de 9 a 17 hs:
1. **Google Calendar y Outlook son "lienzos mudos":** No poseen noción de fisiología ni fatiga. Si anotas una clase a las 09:00 AM tras cerrar un turno laboral a la 01:00 AM, la agenda permanece en silencio, condenándote al agotamiento o al incumplimiento.
2. **Todoist, Notion y Trello son "listas de deseos sin tiempo ni espacio":** Permiten acumular 20 tareas en un día donde físicamente solo dispones de 2 horas libres.
3. **Motion, Reclaim.ai y FlowSavvy son "rígidos y centralizados":** Dependen de agendas corporativas, carecen de modelado de traslados en transporte público, ignoran turnos nocturnos rotativos, no contemplan el clima costero y cobran suscripciones en dólares.

### 1.3 El Propósito Supremo
Ser un **absorbedor matemático del caos**: cuando surge un imprevisto (un turno laboral de cierre, una invitación espontánea a tomar una cerveza o un temporal con viento del Sudeste), el usuario no pasa 30 minutos reorganizando bloques a mano. Presiona el **Botón de Pánico** o el botón de **Re-optimizar**, y el motor CSP recalcula la semana completa en **menos de 50 milisegundos**, garantizando simultáneamente:
* **8 horas ininterrumpidas de sueño biológico** que se adaptan a la hora real de llegada a casa.
* **Bloques de foco profundo (90 a 180 min)** para materias densas de ingeniería (Redes, Calidad de Software).
* **Descanso fisiológico inter-sesión** entre variantes de entrenamiento muscular en gimnasio.
* **Preservación de la vida social** dentro del presupuesto semanal en pesos argentinos (ARS).
* **Privacidad en pantallas compartidas** mediante máscaras neutrales (`displayAlias`).

---

## 2. ¿Qué Hace la Aplicación? (Especificación Funcional de Módulos Reales)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PLANIFICADOR DE MATU                                  │
├────────────────────┬────────────────────┬───────────────────────┬───────────────────────┤
│ 1. BIO-ENGINE      │ 2. ACADÉMICO / FOCO│ 3. DEPORTIVO / SPLIT  │ 4. SOCIAL Y CLIMA     │
│ • Sueño dinámico   │ • Metas flotantes  │ • LagConstraint       │ • Bolsa fungible      │
│ • Veto cognitivo   │ • Auto-splitting   │ • Descanso muscular   │ • Arbitraje Mardel    │
│ • Descompresión    │ • Picos circadianos│ • Matriz de variantes │ • Presupuesto ARS     │
├────────────────────┴────────────────────┴───────────────────────┴───────────────────────┤
│ 5. CONTROL HUMANO, SIMULACIÓN Y TRIAGE SEMÁNTICO                                        │
│ • Meta-Sliders en vivo  • Botón de Pánico  • Sandbox "¿Y si...?"  • Triage Google Cal   │
│ • Panel de Variables    • Constructor de Restricciones            • Modo "¿Qué hago hoy?"│
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Gestión de Pilares Rígidos (`locked_pillar`)
* Administra compromisos inamovibles con **cero tolerancia a solapamientos** ($Overlap = 0$).
* Modela turnos de trabajo rotativos (diurnos o nocturnos) y cursadas universitarias con asistencia obligatoria.
* Bloqueo inmutable (`isLocked: true`): el solver nunca intentará desplazar estos bloques; cualquier tarea flotante debe rodearlos respetando tiempos de viaje.

### 2.2 Anclaje Biológico Flotante Universal (Bio-Engine)
* **Síntesis Proactiva de Sueño:** Si la agenda carece de bloques de descanso o tras un evento disruptor, el solver genera automáticamente bloques de **8 horas de sueño continuo** (`cat-sleep` / `target_sleep_minutes`).
* **Anclaje Dinámico Post-Disrupción (`ScheduleDisruptor`):** Si una actividad finaliza después de la hora umbral nocturna (`night_threshold_time`, ej. 23:30 hs) o tiene el flag `is_schedule_disruptor: true`, el bloque de sueño no se ubica a una hora fija arbitraria, sino que **se ancla a la hora exacta de regreso a casa**:
  $$t_{\text{inicio\_sueño}} = t_{\text{fin\_evento}} + \text{travelMatrix}(E_{\text{ubicación}}, \text{'Casa'}) + \text{travelSafetyMargin}$$
* **Seccionamiento Continuo de Medianoche:** Los bloques que cruzan las 00:00 hs se proyectan matemáticamente y visualmente divididos entre el final del día actual (23:00 - 24:00) y el inicio del día siguiente (00:00 - 07:00), eliminando deformaciones gráficas.

### 2.3 Veto Cognitivo y Aterrizaje Fisiológico (`CognitiveBan`)
* Protege la corteza prefrontal en momentos de agotamiento neurobiológico mediante dos buffers inviolables:
  1. **Buffer de Aterrizaje:** 60 a 90 minutos inmediatos al llegar de una actividad pesada o turno de cierre.
  2. **Inercia del Despertar:** 90 a 120 minutos tras levantarse cuando el ciclo de sueño fue desfasado a la madrugada.
* Dentro de estas ventanas, el motor **prohíbe tajantemente programar tareas con `cognitiveLoad >= 2`** (estudio denso, diseño de software), admitiendo únicamente tareas de mantenimiento personal (`logistics_buffer`), alimentación o descanso pasivo.

### 2.4 Metas de Estudio con Auto-Splitting (`floating_deadline`)
* El usuario no fija horas rígidas de estudio, sino una **cuota de carga acumulada** (ej. 120 min de Redes, 90 min de CalSoft) con una fecha límite (`deadline`).
* El algoritmo realiza auto-splitting inteligente: divide la meta en bloques continuos respetando el piso mínimo de concentración profunda ($\ge 90$ min) y el techo de saturación mental ($\le 180$ min), ubicándolos en los momentos de mayor lucidez circadiana.

### 2.5 Rutinas Elásticas y Descanso Inter-Sesión (`elastic_routine` & `LagConstraint`)
* Modela hábitos recurrentes con frecuencia semanal y ventanas predilectas (ej. entrenamiento en gimnasio).
* **Mecanismo `LagConstraint<T>`:** Impone un desfase temporal obligatorio de $N$ días entre variantes cruzadas del hábito para garantizar recuperación biológica:
  $$|day(Slot_A) - day(Slot_B)| \ge \text{recoveryDaysNeeded}(Variant_A, Variant_B)$$
* Permite programar variantes musculares (ej. Torso vs. Piernas) garantizando que el solver nunca las agende en días consecutivos si requieren descanso intermedio.

### 2.6 Bolsa Social Fungible y Arbitraje Meteorológico de Mar del Plata (`social_flexible`)
* **Bolsa Social Fungible (`SocialPool`):** Evalúa el tiempo compartido semanal como una cuota global flexible (ej. 6 horas/semana), evitando rigideces por contacto individual.
* **Arbitraje Meteorológico Costero en Tiempo Real:** Conexión en vivo con el microclima de Mar del Plata (API Open-Meteo):
  - Detecta temporales con viento del Sudeste ($> 35\text{ km/h}$) o lluvia persistente.
  - En condiciones adversas, el solver desaconseja planes al aire libre y **premia la concentración de estudio bajo techo**, liberando las ventanas soleadas y de confort para salidas y esparcimiento.
* **Optimización Presupuestaria:** Evalúa el costo estimado de salidas (`estimated_cost_ars`) para no exceder el presupuesto semanal configurado en pesos argentinos.

### 2.7 Botón de Pánico (Desalojo en Cascada)
* Ante un imprevisto o invitación de último momento (ej. *"Cerveza con Juancito a las 19:00"*), el usuario presiona el **Botón de Pánico**.
* El motor aloja el nuevo evento social y **desaloja en cascada** las tareas en conflicto (estudio o batch cooking), reempaquetándolas en los siguientes huecos libres de la semana sin violar horas de sueño ni compromisos fijos.
* El **DiffViewer Modal** presenta la justificación transparente del movimiento en menos de 1 milisegundo: *"CalSoft se movió al viernes de 15:00 a 17:00; llegas a tiempo a tu turno laboral"*.

### 2.8 Wizard de Triage Semántico de Google Calendar
* Intercepta la importación de eventos externos (archivos `.ics` o suscripciones) que ingresan como "lienzos mudos" sin metadatos.
* Despliega un modal interactivo para asignar rápidamente: Arquetipo Temporal, Candado (`is_locked`), Ubicación física y Carga cognitiva/física.
* **Reglas Persistentes de Auto-Mapeo (`auto_mapping_rules`):** Con la opción *"Recordar regla para futuros eventos"*, persiste en Supabase patrones de coincidencia (por subcadena o regex) para que las futuras importaciones de esa materia o turno se clasifiquen automáticamente sin intervención humana.

### 2.9 Control Humano: Sliders y Constructor de Restricciones
* **Meta-Sliders en Vivo:** Tres controles deslizantes en el encabezado (**Académico**, **Social**, **Bienestar**) con tooltips explicativos interactivos que ajustan los pesos algebraicos de la función de evaluación en tiempo real.
* **Dashboard de Variables de Decisión (`/settings`):** Expone las variables biológicas, espaciales, de convivencia y climáticas.
* **Constructor de Restricciones Personalizadas:** Permite al usuario crear reglas personalizadas (Hard o Soft) seleccionando variable, operador y umbral, integrándolas al instante en el registry activo del motor.

### 2.10 Modo "¿Qué Hago Ahora?" y Retrospectiva Semanal
* **Modo "¿Qué Hago Ahora?" (`/what-now`):** Vista minimalista a pantalla completa para el teléfono móvil enfocada en el bloque actual, con cronómetro de foco y botones directos *"Terminé antes"* y *"Necesito 30 min más"*.
* **Retrospectiva Semanal No Punitiva (`/retrospective`):** Panel dominical que evalúa el cumplimiento armonioso de la semana (sueño logrado, horas de estudio efectivas, presupuesto respetado y hábitos completados), ayudando a calibrar expectativas sin generar culpa.

---

## 3. ¿Cómo lo Logra Técnicamente? (Arquitectura Real en el Repositorio)

### 3.1 Cómputo Local Determinista ($0 Cost, < 50ms, Cero LLMs)
El núcleo de cómputo es un solver de **Satisfacción de Restricciones (CSP)** simbólico escrito en TypeScript puro que corre en el cliente:
* **Latencia:** $< 50$ milisegundos para resolver la semana completa (15 a 40 eventos).
* **Costo:** $0 USD de por vida (sin costos de tokens de IA).
* **Determinismo:** 100% verídico y matemáticamente demostrable, sin alucinaciones lógicas.

### 3.2 La Cuadrícula Temporal Discreta (672 Slots)
El tiempo semanal continuo se discretiza en una matriz en [src/solver/core/timeDomain.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/solver/core/timeDomain.ts):
$$\text{Intervalo} = 15\text{ min} \quad \Longrightarrow \quad 96\text{ slots/día} \quad \Longrightarrow \quad 672\text{ slots/semana (Lunes 00:00 a Domingo 23:45)}$$

Cada slot $S_i$ ($i \in [0, 671]$) representa un intervalo $[t_i, t_i + 15\text{ min})$ anclado al inicio de la semana normalizada.

### 3.3 El Proceso de Resolución en Dos Fases

```
                        EVENTOS CANDIDATOS
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       FASE 1: PODA BOOLEANA PURA (Hard Constraints / AC-3)      │
│  • Solapamiento = 0 (HC-01)        • Pilares fijos (HC-02)      │
│  • Anclaje sueño 8h (HC-03)        • Veto cognitivo (HC-04)     │
│  • Tiempos de viaje (HC-05)        • Lag inter-sesión (HC-06)   │
│  • Descenso familiar (GHC-01)      • Reglas Custom Hard         │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Dominios Viables Podados
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│      FASE 2: EVALUACIÓN PONDERADA (Soft Constraints Scoring)    │
│  Score(Slot) =                                                  │
│    + w_académico · SC_EstudioFoco(Slot)                         │
│    - w_bienestar · SC_FatigaCircadiana(Slot)                    │
│    + w_social    · SC_ArbitrajeClima(Slot)                      │
│    - w_logística · SC_PenalizaciónTardanza(Slot)                │
│    - w_social    · SC_BolsaSocial(Slot)                         │
│    - w_presup    · SC_PresupuestoARS(Slot)                      │
│    + w_logística · SC_ClusteringEspacial(Slot)                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
                     AGENDA SEMANAL ÓPTIMA
```

1. **Fase 1 — Poda de Dominios (AC-3 & Forward Checking):**
   Implementado en [src/solver/core/ac3.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/solver/core/ac3.ts). Descarta slots imposibles. Si un slot viola una restricción dura, se descarta ($Penalty = \infty$).
2. **Fase 2 — Función de Puntuación Aritmética:**
   Implementado en [src/solver/core/scoreEvaluator.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/solver/core/scoreEvaluator.ts). Entre los slots viables, desempata calculando una puntuación basada en los coeficientes activos de los Meta-Sliders. El slot con menor penalización resulta seleccionado.

---

## 4. El Sistema de los 5 Arquetipos Temporales en TypeScript

Definido en [src/types/event.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/types/event.ts), desacopla la semántica del usuario de la mecánica del solver, logrando **complejidad constante $O(1)$** al crear nuevas categorías:

```typescript
export type ArchetypeType =
  | 'locked_pillar'      // Turnos laborales, cursadas obligatorias (Overlap = 0)
  | 'floating_deadline'  // Metas de estudio, proyectos con entrega y cuota de horas
  | 'elastic_routine'    // Hábitos recurrentes con ventanas y descansos (Gym, Cocina)
  | 'social_flexible'    // Bolsa social fungible, salidas con amigos, serendipia
  | 'logistics_buffer';  // Desplazamientos, viandas, compras, descanso activo
```

### Tabla de Rasgos (*Traits*) por Arquetipo
| Arquetipo | Rigidez Temporal | Carga Cognitiva | Desalojable | Mecanismo Central |
|---|---|---|---|---|
| `locked_pillar` | Absoluta (`isLocked: true`) | Variable (0 a 3) | **No** | Poda de solapamiento ($Overlap = 0$) |
| `floating_deadline` | Flotante antes de deadline | Alta (2 a 3) | Condicional | Auto-splitting $[minBlock, maxBlock]$ |
| `elastic_routine` | Ventana horaria preferida | Media (1 a 2) | Condicional | `LagConstraint<T>` inter-sesión |
| `social_flexible` | Fungible semanal | Baja/Media (0 a 1) | **Sí** (Botón Pánico) | Arbitraje climático costero |
| `logistics_buffer` | Flexible según ubicación | Nula (`cognitiveLoad = 0`)| **Sí** | Exclusión de veto cognitivo |

---

## 5. Arquitectura de Base de Datos en Supabase (PostgreSQL)

Implementada en [supabase/migrations/20260923000001_initial_schema.sql](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/supabase/migrations/20260923000001_initial_schema.sql), con **Row Level Security (RLS)** activado en todas las tablas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ESQUEMA SUPABASE POSTGRESQL                     │
├─────────────────────┬──────────────────────────────────────────────────┤
│ categories          │ id, user_id, name, slug, color, icon, archetype  │
│ events              │ id, user_id, category_id, title, display_alias,  │
│                     │ start_time, end_time, duration, flags CSP,       │
│                     │ cognitive_load, physical_load, location,         │
│                     │ deadline, split_variant, recovery_days_needed,   │
│                     │ estimated_cost_ars, google_event_id              │
│ user_constraints    │ id, user_id, rule_id, rule_type, is_enabled,     │
│                     │ priority_weight, custom_params (JSONB)           │
│ user_parameters     │ user_id, target_sleep_minutes, night_threshold,   │
│                     │ cognitive_landing_buffer, wake_inertia_buffer,   │
│                     │ cannabis_buffers, weights academic/social/well   │
│ travel_matrix       │ id, user_id, origin, destination, duration, mode │
│ auto_mapping_rules  │ id, user_id, pattern, match_type, category_id,   │
│                     │ default_is_locked, default_location              │
│ calendar_sync_tokens│ id, user_id, token, is_active, last_accessed_at  │
└─────────────────────┴──────────────────────────────────────────────────┘
```

---

## 6. Integración con Google Calendar y Ecosistemas Externos

### 6.1 Suscripción Webcal Feed en Vivo (RFC 5545)
* La aplicación expone el endpoint dinámico [src/app/api/calendar/feed/[token]/route.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/app/api/calendar/feed/%5Btoken%5D/route.ts).
* Devuelve un feed iCalendar estándar (`text/calendar`) consumible directamente por Google Calendar, Apple Calendar o Microsoft Outlook en teléfonos o widgets de Android.
* El acceso está autenticado mediante un token unívoco de 64 caracteres verificado en la tabla `calendar_sync_tokens`.

### 6.2 Máscaras de Privacidad en la Exportación (`PrivacyShield`)
* Implementado en [src/lib/calendar/privacyShield.ts](file:///c:/Users/Matu/Documents/PlanificadorDeMatu/src/lib/calendar/privacyShield.ts).
* Si un evento tiene la bandera `is_sensitive: true` (ej. descanso biológico, terapia, buffer de descenso sobrio):
  - El título original se reemplaza por `displayAlias` (ej. *"Compromiso Personal"* u *"Ocupado"*).
  - Se eliminan descripciones, notas y nombres de contactos.
  - Se emite la cabecera estándar `CLASS:PRIVATE`.

---

## 7. Infraestructura, Repositorio y Despliegue Continuo (CI/CD)

### 7.1 Repositorio GitHub (`Mateov000/PlanificadorDeMatu`)
* **Control de versiones:** Rama protegida `main`.
* **Pipeline de CI (`.github/workflows/ci.yml`):**
  - Chequeo estricto de tipos con `npx tsc --noEmit`.
  - Ejecución de pruebas unitarias del solver con `npx vitest run` (19/19 tests en verde).
  - Verificación de compilación de producción con `npm run build`.

### 7.2 Conexión Cloud: Supabase + Vercel
* **Supabase:** Aloja la base de datos PostgreSQL en la región de Sudamérica (`sa-east-1`, São Paulo) para latencias mínimas desde Argentina ($< 40$ ms).
* **Vercel:** Vinculado al repositorio de GitHub para despliegues atómicos automáticos. Cada commit en `main` dispara la construcción y actualización en producción en menos de 60 segundos.
