# PlanificadorDeMatu 🧭⚡

> **Optimizador de Vida y Auto-Scheduling Adaptativo Bajo Restricciones (CSP)**  
> *Motor 100% determinista y local en TypeScript (< 50 ms de latencia, costo $0, cero IA externa).*

---

## 🚀 Filosofía y Arquitectura

PlanificadorDeMatu trasciende las agendas convencionales (lienzos mudos) y gestores de tareas (listas de deseos sin noción espacial de tiempo) para convertirse en un **sistema operativo personal que absorbe el caos cotidiano mediante matemática pura**:

1. **Motor Simbólico Local (< 50 ms):** Basado en consistencia de arcos (AC-3), Forward Checking y evaluación ponderada sin llamadas a APIs de LLMs.
2. **Patrón Constraint Registry / Rule Engine:** Desacoplamiento total entre la UI, la base de datos y las reglas matemáticas. Cada restricción dura o blanda es un archivo TypeScript independiente con contratos estrictos.
3. **Contexto de Dominio Real:** Soporte nativo para turnos rotativos laborales (Casino / Ferro), cursadas universitarias (Facultad / Casa), descanso circadiano dinámico (anclaje de sueño de 8h flotante post-trasnoche), microclima marítimo de Mar del Plata y presupuesto en pesos (ARS).
4. **Explicabilidad Paramétrica Determinista:** Un `DiffViewerModal` que traduce las podas lógicas del solver en lenguaje natural transparente sin alucinaciones.
5. **Integración con Google Calendar:** Wizard de triage semántico, exportación estándar `.ics` (RFC 5545), suscripción en vivo mediante Webcal Feed (`webcal://`) y máscaras de privacidad (`displayAlias`).

---

## 📁 Estructura del Proyecto

```text
src/
├── app/                  # Next.js App Router (Semana, ¿Qué Hago Ahora?, Configuración, Webcal API)
├── solver/               # Núcleo CSP desacoplado (AC-3, TimeDomain, ScoreEvaluator, Scheduler, Diff)
├── constraints/          # Registry central y reglas aisladas (/hard y /soft)
├── components/           # UI Premium (TimeGridCalendar, EventBlock, Modales, MetaSliders)
├── lib/
│   ├── store/            # Estado reactivo local (Zustand)
│   ├── calendar/         # Generador .ics y máscaras de privacidad
│   ├── weather/          # Integración Open-Meteo & Confort Score de Mardel
│   └── supabase/         # Clientes de persistencia relacional
└── styles/               # Design tokens, paleta oscura y layout proporcional
```

---

## 🛠️ Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Correr tests unitarios del solver y restricciones
npm test

# Iniciar servidor de desarrollo
npm run dev

# Compilar build de producción
npm run build
```

---

## 🗄️ Base de Datos (Supabase)

La migración inicial se encuentra en:  
`supabase/migrations/20260923000001_initial_schema.sql`

Incluye:
* Tipos enum de arquetipos (`locked_pillar`, `floating_deadline`, `elastic_routine`, `social_flexible`, `logistics_buffer`).
* Tablas: `categories`, `events`, `user_parameters`, `travel_matrix`, `auto_mapping_rules`, `calendar_sync_tokens`.
* Políticas de seguridad por fila (Row Level Security - RLS).

---

## 🚢 Despliegue en Vercel

1. Vincular el repositorio con tu cuenta de GitHub.
2. Importar el repositorio en [Vercel](https://vercel.com).
3. Configurar las variables de entorno en el panel de Vercel:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. El CI/CD compilará automáticamente en cada push a la rama `main`.
