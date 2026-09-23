# Especificación Integral de Features: PlanificadorDeMatu
## Optimizador de Vida y Auto-Scheduling Adaptativo Bajo Restricciones (Del Orden Rígido al Caos Cotidiano)

**Destinatario:** Matu (Mar del Plata, Argentina)  
**Propósito:** Definir el ecosistema integral de características (*features*) que debe tener tu aplicación de auto-scheduling, explicando qué hace cada una, cuál es su **razón de ser** en tu vida real, y cómo interactúa algorítmicamente con las demás para generar una experiencia sin fricción.

---

## Índice General

0. [Prólogo: Perfil del Usuario, Contexto Real y Manifiesto (Separación Mecanismo vs. Ejemplos)](#0-prólogo-perfil-del-usuario-contexto-del-mundo-real-y-manifiesto-de-la-aplicación)
1. [Filosofía y Arquitectura Conceptual del Sistema (Desacoplamiento y Constraint Registry)](#1-filosofía-y-arquitectura-conceptual-del-sistema)
2. [Módulo 1: El Motor Central de Auto-Scheduling (Constraint Engine)](#2-módulo-1-el-motor-central-de-auto-scheduling-constraint-engine)
3. [Módulo 2: Inteligencia Biológica, Fisiológica y Circadiana (Bio-Engine)](#3-módulo-2-inteligencia-biológica-fisiológica-y-circadiana-bio-engine)
4. [Módulo 3: Logística Espacial, Desplazamientos y Microclima Costero](#4-módulo-3-logística-espacial-desplazamientos-y-microclima-costero)
5. [Módulo 4: Vínculos Sociales, Privacidad y Convivencia Familiar](#5-módulo-4-vínculos-sociales-privacidad-y-convivencia-familiar)
6. [Módulo 5: Interfaz de Usuario, Control Humano y Ergonomía Diaria](#6-módulo-5-interfaz-de-usuario-control-humano-y-ergonomía-diaria)
7. [Módulo 6: Ciclo de Vida Semanal, Retrospectiva y Aprendizaje Adaptativo](#7-módulo-6-ciclo-de-vida-semanal-retrospectiva-y-aprendizaje-adaptativo)
8. [Módulo 7: Dimensión Económica en Moneda Local (ARS)](#8-módulo-7-dimensión-económica-en-moneda-local-ars)
9. [Módulo 8: Integración con Google Calendar y Ecosistemas Externos](#9-módulo-8-integración-con-google-calendar-y-ecosistemas-externos)
10. [Matriz de Interacción: Cómo se unen las piezas ante un Imprevisto](#10-matriz-de-interacción-cómo-se-unen-las-piezas-ante-un-imprevisto)

---

## 0. Prólogo: Perfil del Usuario, Contexto del Mundo Real y Manifiesto de la Aplicación

> [!IMPORTANT]
> **DIRECTIVA PARA EL AGENTE DE IA O EQUIPO DE DESARROLLO:**
> Este documento no es un resumen teórico ni la idea para un "calendario genérico". Es el **documento maestro de requisitos y contexto de dominio real** para construir una aplicación funcional de auto-scheduling hecha a la medida exacta de la vida de su usuario (Matu).
> Si estás recibiendo este documento en una nueva conversación para generar una especificación técnica o para codificar la aplicación:
> 1. **NO asumas una vida corporativa de 9 a 17 de oficina estadounidense.** Este sistema está diseñado para un estudiante de ingeniería con turnos rotativos, trasnoches y vida social activa en Argentina.
> 2. **NO intentes conectar modelos de lenguaje (LLMs / GPT-4 / Gemini) para el motor central de cálculo.** El motor es un solver CSP simbólico local y determinista escrito en TypeScript que debe correr en $< 50$ milisegundos en el navegador o PWA a costo $0.
> 3. **Respeta estrictamente las restricciones biológicas y de contexto real** que se detallan a continuación.

### 0.1 ¿Quién es el Usuario? (El Contexto de Matu)
* **Estudiante Universitario:** Cursa Ingeniería en Informática en la Universidad Nacional de Mar del Plata (UNMDP). Sus sedes habituales para cursar o estudiar son la Facultad y su Casa.
  * *Materias densas de alta demanda cognitiva:* **Redes de Computadoras**, **Análisis y Diseño de Sistemas (AyDS)**, **Calidad de Software (CalSoft)** (ejemplos ilustrativos de materias cursadas). Requieren bloques continuos de concentración profunda (90 a 120 min) en momentos de mente lúcida.
  * *Materias con asistencia estricta:* **Aspectos Éticos, Económicos y Sociales (AEEC)** (ejemplo ilustrativo de cátedra con asistencia estricta). Llegar tarde cuenta como falta y arriesga la regularidad (Tolerancia = 0 minutos).
* **Trabajador con Turnos Rotativos:** Trabaja en sucursales comerciales/gastronómicas de Mar del Plata:
  * *Sucursal Rambla Casino:* Turnos diurnos o intermedios.
  * *Sucursal Ferro San Juan:* Turnos de cierre nocturno (salida habitual ~01:00 AM, llegada a casa ~01:30 AM).
* **Entorno Geográfico y Microclima:** Vive en **Mar del Plata, Argentina**.
  * Clima marítimo con vientos del Sudeste $> 35\text{ km/h}$, lloviznas persistentes y frío húmedo. Estar al aire libre en días de mal clima es inviable.
  * Tiempos reales de viaje en transporte público (colectivo) de 20 a 30 minutos entre puntos clave (la teletransportación no existe).
* **Convivencia y Vida Personal:**
  * Vive con sus padres en su casa familiar. Necesita privacidad en pantalla (alias de eventos sensibles), orden y un **margen de recuperación/descenso garantizado (GHC-01)** antes de volver a casa tras salidas sociales con consumo recreativo de cannabis.
  * No utiliza el hogar familiar para recibir juntadas casuales masivas.
* **Vínculos Sociales y Ocio:**
  * Amigos cercanos (Juancito, Juani) y salidas casuales a bares o cervecerías artesanales.
  * Maneja un presupuesto semanal en pesos argentinos (ARS) para salidas y comidas afuera.
* **Salud, Deporte y Descanso:**
  * Entrena musculación en gimnasio. Requiere descansos fisiológicos configurables entre sesiones o variantes de entrenamiento (los esquemas y días de separación son ejemplos de partida a definir por Matu).
  * **Descanso Biológico Dinámico:** Los horarios de sueño no responden a una jornada fija corporativa (ej. 23:00 a 07:00), sino que se anclan de forma natural y flotante a la hora real de llegada post-actividad nocturna (turnos de trabajo rotativos o salidas).

### 0.2 ¿Qué es la Aplicación y Cuál es su Razón de Ser?
* **¿Qué es?:** Es una **Progressive Web App (PWA) de auto-scheduling inteligente y optimización bajo restricciones (CSP)** llamada *PlanificadorDeMatu*.
* **¿Qué problema resuelve?:**
  1. **Google Calendar / Outlook son "lienzos mudos":** No tienen cerebro; si anotas una tarea a las 9 AM tras cerrar un turno a la 1 AM, la agenda se queda muda y te condena a la frustración o al agotamiento biológico.
  2. **Notion / Todoist son "listas de deseos sin tiempo ni espacio":** Te dejan acumular 20 tareas en un día donde físicamente solo tienes 3 horas libres.
  3. **Reclaim.ai / Motion / FlowSavvy son rígidos y corporativos:** Están diseñados para oficinistas de Silicon Valley con jornadas de 9 a 17, jefes y calendarios de Google Workspace. Colapsan ante turnos nocturnos rotativos, microclima oceánico y salidas espontáneas con amigos.
* **El Propósito Supremo de la App:**
  * Ser un **sistema operativo personal que absorbe el caos cotidiano mediante matemática**: cuando surge un imprevisto (un amigo te invita a una cerveza o te cambian un turno), tú no reorganizas 15 bloques a mano. Presionas el **Botón de Pánico** y el motor re-calcula la semana completa en **menos de 50 milisegundos**, garantizando que el estudio se cumpla, el cuerpo descanse 8 horas, los amigos no se posterguen y las finanzas en pesos se respeten.

### 0.3 Principio Fundamental: Separación entre Mecanismos del Motor y Ejemplos Ilustrativos (Configurabilidad Dinámica)

> ⚠️ **REGLA METODOLÓGICA PARA EL AGENTE IMPLEMENTADOR Y MATU:**
> Todo nombre propio, valor numérico, materia académica o rutina específica mencionado a lo largo de este documento (como *"mínimo 2 días de descanso entre pecho y espalda"*, materias como *"Redes"* o *"AEEC"*, sucursales como *"Casino"* o *"Ferro"*, amigos como *"Juancito"* o *"Juani"*, o hábitos como *"Batch Cooking"*) **ES ESTRICTAMENTE UN CASO DE PRUEBA O EJEMPLO ILUSTRATIVO** para demostrar cómo opera la matemática del solver en situaciones de la vida real.
>
> **El motor de PlanificadorDeMatu NUNCA hardcodea estos valores en el código.** Opera mediante **mecanismos genéricos y configurables**:
> 1. **Mecanismo de Desfase Temporal (`LagConstraint<T>`):** El algoritmo AC-3 sabe cómo imponer $N$ días entre una variante $A$ y una variante $B$. Que $A$ sea "Pecho", $B$ sea "Espalda" y $N$ sea 2 días fue un ejemplo de entrenamiento. Matu definirá y confirmará con el agente su rutina real, sus grupos musculares y sus días de descanso intermedios.
> 2. **Mecanismo de Demanda Cognitiva y Tolerancia (`CognitiveTier`, `PunctualityTolerance`):** Que "AEEC" tenga tolerancia 0 o "Redes" demande 120 min de foco continuo son ejemplos. Cualquier materia o examen futuro se clasifica dinámicamente según su carga y rigidez.
> 3. **Mecanismo de Disrupción Circadiana Universal (`ScheduleDisruptor`):** No importa si el trabajo se llama "Ferro", "Casino" o un nuevo empleo: si una actividad termina de noche o de madrugada, dispara dinámicamente el anclaje de sueño de 8 horas y el veto cognitivo post-despertar.
> 4. **Mecanismo de Bolsa Social Fungible (`SocialPool`):** Juancito y Juani son ejemplos de amigos para probar el motor; el sistema opera con una bolsa de tiempo global y pistas suaves, completamente abierto a cualquier contacto o plan nuevo.
> 5. **Mecanismo de Restricciones Graduadas (`GraduatedConstraint`):** El buffer post-consumo o cualquier ventana de descompresión tiene parámetros iniciales (ej. 2h piso, 4h ideal) completamente editables en la consola de configuración (`params.ts`).
>
> **Susceptibilidad Total al Cambio:** El sistema está concebido como una plataforma viva. Todas las restricciones están modularizadas y son susceptibles de ser ajustadas, activadas, desactivadas o redefinidas por Matu en cualquier momento sin requerir rediseñar el motor CSP.

---

## 1. Filosofía y Arquitectura Conceptual del Sistema

Las agendas convencionales (Google Calendar, Outlook) son **lienzos mudos**: asumen que si anotas una tarea a las 9 AM después de haber trabajado hasta la 1 AM, la vas a cumplir por arte de magia. Por otro lado, los gestores de tareas (Todoist, Notion) son **listas de deseos sin noción de espacio ni tiempo**: puedes anotar 30 tareas para hoy aunque el día solo tenga 4 horas libres.

Tu vida no responde a una jornada corporativa de 9 a 17 en una oficina fija. Combina **turnos rotativos diurnos y nocturnos**, **materias universitarias exigentes**, **amigos con horarios propios**, la **fisiología del descanso**, la **convivencia en casa familiar** y el **clima cambiante de Mar del Plata**.

Por eso, el sistema no es una agenda pasiva: es un **motor de satisfacción de restricciones (CSP) bio-psico-social** que opera bajo tres principios inquebrantables:
1. **La matemática absorbe el caos:** Cuando la realidad cambia (un amigo te invita a salir o te cambian un turno), tú no reorganizas 15 bloques a mano; el motor re-calcula la solución óptima en menos de 50 milisegundos.
2. **Respeto a la biología:** El cerebro no rinde igual tras una noche de guardia que tras un día libre. El descanso y la lucidez son restricciones de primer orden, no premios optativos.
3. **El algoritmo propone, el humano dispone:** El sistema nunca te obliga dictatorialmente; te ofrece la mejor configuración matemática posible, explicándote con total transparencia el porqué de cada movimiento.

### 1.1 ¿Por qué NO usamos Inteligencia Artificial (LLMs) para el Motor Central y las Explicaciones?
Existe un mito extendido en el software moderno de que cualquier sistema inteligente, explicable y adaptable requiere un modelo de lenguaje (como GPT-4 o Gemini). Para un problema de auto-scheduling de alta precisión matemática, **un LLM es la peor herramienta posible**:
1. **Latencia Inaceptable:** Una llamada a una API de IA tarda entre 1.5 y 3 segundos. Tu aplicación necesita recalcular agendas y absorber imprevistos en **menos de 5 a 50 milisegundos**.
2. **Alucinaciones y Falta de Rigor Lógico:** Los LLMs inventan justificaciones verosímiles pero falsas (*"te moví la cursada porque estabas estresado"*). No pueden garantizar solapamiento cero ni respetar restricciones duras con consistencia matemática demostrable.
3. **Costo Financiero y Dependencia de Red:** Requieren suscripciones, tokens pagos por uso o fallan cuando no tienes conexión a internet o se agotan las cuotas gratuitas.

En su lugar, el sistema utiliza un **Motor de Restricciones Simbólico (CSP) y Trazabilidad Paramétrica**:
* **Costo $0 de por vida:** Corre 100% en tu máquina local o navegador.
* **Velocidad instantánea (< 5 ms):** Respuestas en tiempo real ante cualquier imprevisto.
* **100% Determinista y Verídico:** Cada explicación refleja con exactitud la ecuación o regla que forzó el cambio, sin inventar nada.

### 1.2 La Doble Fase Computacional: Lógica Pura vs. Función de Puntuación
El motor opera mediante dos fases algorítmicas claramente diferenciadas:
1. **Fase 1 — Lógica Booleana Pura (Hard Constraints / Sin Heurísticas):**
   * Poda matemática estricta mediante el algoritmo **AC-3 (Arc Consistency)** y Forward Checking.
   * Evalúa verdades y falsedades absolutas: ¿Hay solapamiento? ($Inicio_A < Fin_B \land Inicio_B < Fin_A$). ¿El sueño es $< 8$ horas tras noche cerrada? ¿El tiempo de viaje es insuficiente?
   * Si una condición se viola, el plan es lógicamente inválido ($\text{Penalización } \infty$) y queda descartado. Aquí no hay opiniones ni adivinanzas.
2. **Fase 2 — Función de Puntuación Aritmética Transparente (Scoring Function):**
   * Cuando la lógica pura deja varias alternativas viables (ej. 4 huecos posibles para estudiar Redes), el motor desempata mediante una fórmula algebraica transparente basada en tus prioridades:
     $$\text{Score}(Slot) = w_{\text{entrega}} \cdot \text{DíasHastaEntrega} - w_{\text{fatiga}} \cdot \text{NivelFatiga} + w_{\text{clima}} \cdot \text{AfinidadClima} - w_{\text{frag}} \cdot \text{Fragmentación}$$
   * El slot con mayor puntuación gana. No hay cajas negras: es aritmética pura, explicable y predecible.

### 1.3 Arquitectura del Sistema en 4 Capas

```
┌────────────────────────────────────────────────────────┐
│               CAPA 1: LÓGICA PURA (HCs)                │
│    Poda matemática estricta: Solapamientos = 0,        │
│    Sueño inviolable, Traslados reales de Mardel.       │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│           CAPA 2: EVALUACIÓN PONDERADA (SCs)           │
│    Fórmula aritmética transparente basada en tus       │
│    pesos configurables ($w_1, w_2, \dots, w_n$).       │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│          CAPA 3: EXPLICABILIDAD SIMBÓLICA              │
│    DiffViewer con plantillas paramétricas en español:  │
│    Cero IA, costo $0, 100% verídico y sin alucinación. │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│          CAPA 4: BUCLE DE FEEDBACK Y CALIBRACIÓN       │
│    Sliders de parámetros, detección de fricción al     │
│    mover bloques y retrospectiva semanal no punitiva.  │
└────────────────────────────────────────────────────────┘
```

### 1.4 Modularización Aislada de Restricciones (El Patrón Constraint Registry & Rule Engine)

Para garantizar que el sistema sea mantenible, escalable y fácilmente editable sin riesgo de romper el resto de la aplicación, las restricciones **están estrictamente desacopladas de la interfaz de usuario, de la base de datos y del propio algoritmo de búsqueda del solver**.

#### 1.4.1 El Principio de Caja Negra y Contrato Estándar
* **La app no conoce la lógica interna de cada regla:** Ni los componentes de React, ni los endpoints de API, ni la función de backtracking del solver saben *cómo* se calcula el descanso del gimnasio o el veto de estudio post-trabajo.
* **Todo pasa por un Contrato de Interfaz Estándar:** Cada restricción es un archivo TypeScript autónomo e independiente dentro de `/constraints/hard/` o `/constraints/soft/`, que implementa una interfaz unificada:

```typescript
export interface ConstraintContext {
  events: Event[];
  originalSchedule?: Event[];
  params: ConstraintParams;
  weather?: WeatherCondition[];
  contacts?: Contact[];
  travelMatrix?: TravelMatrix;
}

// Para Hard Constraints (Fase 1: Poda Lógica AC-3 / Validador Booleano)
export interface HardConstraintRule {
  id: string; // Ej: 'HC-01', 'HC-03', 'HC-GYM-REST'
  name: string; // 'Descanso Inter-Sesión Muscular'
  description: string;
  enabled: boolean; // Permite prender/apagar la regla desde configuración
  validate: (candidate: Event[], context: ConstraintContext) => {
    satisfied: boolean;
    reason?: string;
    violatingEventIds?: string[];
  };
}

// Para Soft Constraints (Fase 2: Función de Puntuación Aritmética)
export interface SoftConstraintRule {
  id: string; // Ej: 'SC-01', 'SC-08'
  name: string;
  description: string;
  category: 'academic' | 'social' | 'wellness' | 'logistics';
  defaultWeight: number; // Peso base en la función de costo
  enabled: boolean;
  evaluate: (candidate: Event[], context: ConstraintContext) => number; // Retorna penalización normalizada (0.0 a 1.0)
}
```

#### 1.4.2 El Registro Central (`constraintRegistry.ts`)
El motor de scheduling no importa 30 funciones sueltas repartidas por el código. Simplemente consulta el **Registro Central**:
```typescript
export const hardConstraintsRegistry: HardConstraintRule[] = [
  hc01_noOverlapRule,
  hc02_lockedEventsRule,
  hc03_sleepAnchorRule,
  hc05_travelViabilityRule,
  hc_splitRecoveryRule,
  // Agregar una regla nueva es solo agregar un elemento a esta lista
];

export const softConstraintsRegistry: SoftConstraintRule[] = [
  sc01_studyBlocksRule,
  sc04_circadianFatigueRule,
  sc08_weatherArbitrageRule,
  // ...
];
```

#### 1.4.3 Cómo la App consulta los Constraints al calcular
Cuando el solver evalúa una propuesta de horario, se limita a iterar sobre el registro activo:
```typescript
// En Fase 1 (Hard Constraints):
const activeHardRules = hardConstraintsRegistry.filter(r => r.enabled);
for (const rule of activeHardRules) {
  const result = rule.validate(candidateSchedule, context);
  if (!result.satisfied) {
    return { valid: false, reason: result.reason }; // Poda matemática inmediata
  }
}

// En Fase 2 (Soft Constraints):
const activeSoftRules = softConstraintsRegistry.filter(r => r.enabled);
let totalCost = 0;
for (const rule of activeSoftRules) {
  const penalty = rule.evaluate(candidateSchedule, context);
  const weight = getEffectiveWeight(rule.id, rule.category, metaSliders);
  totalCost += penalty * weight;
}
```

#### 1.4.4 ¿Qué se logra con esta separación arquitectónica?
1. **Editar una restricción sin tocar la app:** Si decides cambiar la regla de descanso de gimnasio, solo abres su archivo específico (`HC_splitRecovery.ts`) o modificas `params.ts`. No tocas ni una sola línea del calendario, ni de los modales, ni del solver general.
2. **Crear una nueva restricción en minutos:** Creas `HC12_nuevaRegla.ts`, implementas `validate`, la agregas al registro y listo. El solver la empieza a ejecutar de inmediato, el DiffViewer aprende a reportar sus violaciones y la UI la puede mostrar en la lista de reglas activas.
3. **Activar / Desactivar con un clic:** Si una semana de vacaciones no quieres que aplique el veto de estudio post-trabajo o la restricción de presupuesto, cambias `enabled: false` en la configuración y el solver la ignora por completo.
4. **Testeo unitario ultrarrápido y aislado:** Cada regla tiene su propio archivo de test (`rule.test.ts`) donde pasas 3 eventos simulados y testeas si la lógica es correcta en 2 milisegundos, sin necesidad de levantar la aplicación ni la base de datos.

---

## 2. Módulo 1: El Motor Central de Auto-Scheduling (Constraint Engine)

Este módulo traduce la realidad en ecuaciones de tiempo, separando los pilares rígidos de los bloques flotantes y permitiendo una flexibilidad absoluta ante imprevistos.

### 2.1 Gestión de Pilares Inamovibles (Hard Locks Absolutos)
* **Qué es:** Capacidad de marcar cualquier evento con un "candado universal" (`is_locked: true`). Incluye turnos confirmados en las sucursales (Casino / Ferro San Juan), cursadas universitarias fijas (Redes, AyDS, AEEC, CalSoft) y compromisos ineludibles.
* **Razón de ser:** Tu base semanal tiene compromisos cuya alteración acarrea costos graves (perder la regularidad de una materia o una sanción laboral). El motor debe garantizar matemáticamente solapamiento cero ($Overlap = 0$) contra estos bloques.
* **Cómo lo logra:** El motor los trata como **Hard Constraints (HC-01 y HC-02)**. Al discretizar la semana en slots de 15 minutos, estos eventos se restan inmediatamente del dominio de tiempo disponible antes de evaluar cualquier otra tarea.

### 2.2 Objetivos Flotantes con Deadlines y Auto-Splitting Inteligente
* **Qué es:** En lugar de forzarte a fijar "Estudiar CalSoft el martes a las 15:00", introduces una meta semanal flotante: *"Necesito 10 horas de estudio para Redes antes del viernes a las 18:00"*. La app divide ese total en bloques y los ubica en los huecos libres más óptimos de tu semana.
* **Razón de ser:** Intentar adivinar a principio de semana en qué hora exacta vas a poder estudiar genera frustración apenas surge el primer retraso. Lo que necesitas garantizar es la **cuota acumulada antes de la entrega**, no la hora fija en que se ejecuta.
* **Cómo lo logra:** 
  * Toma prestado el concepto de **Task Splitting de FlowSavvy**, pero enriquecido: no fragmenta en bloques arbitrarios, sino respetando una **duración mínima de foco** (ej. 90 a 120 minutos continuos, ya que estudiar ingeniería de software en bloques de 20 minutos no sirve) y una **duración máxima de saturación** (ej. 3 horas continuas).
  * El algoritmo empaqueta los bloques en los intervalos libres antes de la fecha límite utilizando una heurística de tipo Earliest Deadline First (EDF) pesada por prioridad.

### 2.3 El "Botón de Pánico" y Desalojo en Cascada (Cascade Eviction)
* **Qué es:** Un control de un solo toque que resuelve la fricción de los planes imprevistos. Si a las 18:00 te escribe Juancito para tomar una cerveza o surge una juntada espontánea, ingresas el evento o activas el botón: el motor **desaloja automáticamente los bloques de estudio o tareas que estaban programados para esa franja y los empuja hacia adelante en la semana**, asegurando que sigas cumpliendo con tus metas y entregas.
* **Cómo lo logra:** 
  * Congela todo lo ocurrido hasta el minuto actual ($t < t_{\text{now}}$).
  * Asigna al nuevo evento social prioridad de presencia inmediata.
  * Ejecuta un **algoritmo de desalojo en cascada** (inspirado en Reclaim.ai pero local y ultrarrápido): las tareas de estudio desplazadas vuelven a la cola de pendientes y se reubican en los mejores slots libres de los días siguientes.
  * Si el margen de tiempo para llegar a la entrega se vuelve crítico, la interfaz te alerta con precisión quirúrgica: *"Para aceptar este plan social de 3 horas, el jueves deberás adelantar la sesión de Redes a las 14:00 o recortar 1 hora de batch cooking"*. Cero incertidumbre.

### 2.4 Hábitos Elásticos y Rutinas Logísticas Configurables
* **Qué es:** Programación de actividades recurrentes necesarias (Entrenamiento de gimnasio, Batch Cooking, etc.) sin horarios rígidos fijados en piedra, sino con ventanas de conveniencia totalmente configurables y dinámicas por el usuario.
* **Ventanas de tiempo dinámicas y no fijas:** En lugar de asumir un horario preconcebido, el usuario define las franjas horarias reales en las que puede y desea realizar cada actividad, contemplando:
  * **Horarios reales de apertura de la sede:** Ej. gimnasio abierto de 07:00 a 22:30 Lun-Vie, 09:00 a 19:00 Sábados.
  * **Múltiples ventanas por día o por tipo de turno:** Ej. en días con turno diurno de Casino se habilita la ventana nocturna (18:30 a 21:30); en días con turno nocturno de Ferro se habilita la ventana vespertina previa al ingreso (14:30 a 16:30); en días francos se habilitan ventanas matutinas o intermedias.
  * **Duración elástica y resiliente:** Duración ideal (ej. 75 min) vs. piso mínimo aceptable para no abandonar el hábito en semanas caóticas (ej. 45 min).
* **Razón de ser:** Un hábito no puede depender de un horario rígido. Si se te atrasa una cursada o saliste a la madrugada del trabajo, un sistema estático descarta el gimnasio. Un sistema elástico busca el mejor hueco dentro de tus ventanas reales de disponibilidad.
* **Cómo lo logra:** El solver utiliza **Soft Constraints** para evaluar los huecos libres dentro de la máscara horaria válida de cada hábito, penalizando las desviaciones respecto de la hora de preferencia pero garantizando la meta de sesiones semanales.

### 2.5 Reglas de Descanso Mínimo Inter-Sesión y Matriz de Recuperación Muscular (Split Recovery Constraints)

> ⚠️ **ACLARACIÓN CRÍTICA (EJEMPLO ILUSTRATIVO, NO REGLA FIJA):**
> La mención de *"Pecho / Push"*, *"Espalda / Pull"* y *"Piernas"*, así como el valor de *"mínimo 2 días de separación entre Pecho y Espalda"*, constituyen **ESTRICTAMENTE UN CASO DE PRUEBA ILUSTRATIVO** para explicar cómo opera el mecanismo de desfase temporal (*Lag Constraint*).
> **La aplicación NO asume esta rutina como fija ni definitiva para Matu.** El sistema está diseñado para que Matu defina, confirme y edite libremente con el agente o en la aplicación sus grupos musculares reales, su división de entrenamiento (ej. Fullbody, Upper/Lower, o cualquier split personalizado), su cuota semanal y sus días de descanso intermedios requeridos. El motor CSP es 100% agnóstico a los nombres y valores particulares.

* **Qué es:** La capacidad de definir restricciones de separación y recuperación fisiológica entre sesiones consecutivas de una misma actividad o entre sub-rutinas específicas (Splits de entrenamiento en sala de pesas):
  1. **Nivel 1 — Buffer de Descanso Mínimo General:**
     * Exigir una separación mínima obligatoria entre dos sesiones cualesquiera de una misma actividad (ej. mínimo 24 o 48 horas entre entrenamientos generales, impidiendo que el motor programe dos sesiones en días consecutivos si se desea descansar entre medio).
  2. **Nivel 2 — Matriz de Descanso Cruzado por Sub-Rutinas (Split Matrix):**
     * Si la actividad tiene variantes con demandas anatómicas o fisiológicas diferentes (ejemplo clásico de rutina de gimnasio: **Día de Piernas**, **Día de Pecho / Push**, **Día de Espalda / Pull**):
       * **Cuota semanal balanceada:** Exigir exactamente 1 sesión (o $N$ sesiones) de cada variante por semana (1x Piernas, 1x Pecho, 1x Espalda).
       * **Matriz de descansos mínimos cruzados (Inter-variant recovery matrix):**
         * $\text{Pecho} \longleftrightarrow \text{Espalda}$: Mínimo **2 días de descanso completo** intermedios (48 horas libres entre ambos por recuperación de hombros, escápulas y fatiga neuromuscular de torso).
         * $\text{Piernas} \longleftrightarrow \text{Pecho / Espalda}$: Mínimo **1 día de descanso** (24 horas) o contiguos si no hay solapamiento articular.
         * Misma variante consigo misma (ej. Pecho con Pecho si se entrena con frecuencia 2): Mínimo 4-5 días de separación.
* **Razón de ser:**
  * Si el auto-scheduler solo "empaqueta 3 bloques de gimnasio en cualquier hueco libre", un algoritmo codicioso ingenuo los ubicaría Lunes, Martes y Miércoles seguidos si esos son los días con menos cursada universitaria.
  * Para el cuerpo humano y el sistema musculoesquelético, entrenar Pecho el Lunes y Espalda el Martes sin el descanso adecuado degrada el rendimiento en sala, anula la recuperación y multiplica el riesgo de tendinitis o sobreentrenamiento.
  * La biología muscular exige que el descanso no sea una consecuencia accidental de la agenda, sino una **restricción estructural matemática (Inter-Activity Lag Constraint)**.
* **Cómo lo logra técnicamente en el motor CSP:**
  * **Modelado como Lag Constraints (Restricciones de Distancia Temporal):**
    Para cualquier par de sesiones asignadas $s_A, s_B$ con tipos de entreno $T_A, T_B$:
    $$|day(s_A) - day(s_B)| \ge \text{min\_recovery\_days}(T_A, T_B)$$
  * **Poda inmediata de Dominios por Forward Checking (AC-3):**
    Cuando el solver asigna tentativamente el bloque "Pecho" en el slot del Lunes a las 18:00:
    * El dominio de slots disponibles para "Espalda" en la semana elimina automáticamente todos los slots del Lunes, Martes y Miércoles ($|day - 1| < 2$).
    * El slot más temprano viable para "Espalda" pasa a ser el Jueves.
    * Si además se inserta "Piernas", se ubica con su propia regla de separación (mínimo 1 día de diferencia respecto a los demás).
  * **Sinergia con tu aplicación Gym PWA:**
    * Al registrar una sesión de "Pecho" completada en tu app Gym PWA, el scheduler recibe ese evento, actualiza el estado de fatiga real y ajusta automáticamente los días óptimos para "Piernas" y "Espalda" durante el resto de la semana sin que tengas que reprogramar nada.

### 2.6 Sistema Dinámico de Categorías y Arquetipos Extensibles (Trait-Based Classification)
* **Qué es:** La capacidad de organizar cualquier evento dentro de las categorías nativas del sistema o **crear categorías y etiquetas personalizadas ilimitadas al vuelo** (ej: *"Terapia"*, *"Guitarra / Música"*, *"Side Project / Programación"*, *"Trámites Facultad"*, *"Mantenimiento del Hogar"*, etc.), asignándoles un color identificatorio y un icono/emoji.
* **El Patrón de Dos Capas (Semántica de Usuario vs. Arquetipo Funcional):**
  Para evitar que crear categorías nuevas sobrecomplique el algoritmo matemático, cada categoría personalizada se vincula a uno de los **5 Arquetipos de Comportamiento Temporal** que el motor CSP ya sabe optimizar de forma nativa:
  1. **Arquetipo Candado (`locked_pillar`):** Evento inamovible con horario y día fijos ($Overlap = 0$). Ej: cursadas fijas, turnos de trabajo, sesiones de terapia con turno asignado.
  2. **Arquetipo Flotante con Deadline (`floating_deadline`):** Meta de horas semanales a distribuir en bloques de foco antes de una fecha límite. Ej: estudio de materias, avances en tu proyecto personal de software.
  3. **Arquetipo Hábito Elástico (`elastic_routine`):** Actividad recurrente con cuota semanal (ej. 3 veces por semana), ventana de conveniencia horaria, duración flexible (ideal vs. mínima) y descansos inter-sesión obligatorios. Ej: gimnasio, práctica de instrumento, lectura.
  4. **Arquetipo Social / Relacional (`social_flexible`):** Integra la bolsa social elástica, sensible a personas asociadas, sujeta a desalojo inteligente ("Botón de Pánico"), conversión a tiempo libre y arbitraje meteorológico. Ej: salidas, asados, juntadas.
  5. **Arquetipo Logístico / Mantenimiento (`logistics_buffer`):** Tareas de soporte de baja exigencia mental. Ej: batch cooking, compras semanales, limpieza.
* **Razón de ser (¿Por qué esto NO sobrecomplica la aplicación?):**
  * **Si se hiciera mal:** Crear una categoría nueva obligando a escribir código nuevo en el solver causaría una explosión combinatoria inmanejable.
  * **Haciéndolo con Arquetipos:** La complejidad computacional es **$O(1)$ constante**. Para el algoritmo matemático, una sesión de *"Guitarra"* vinculada al arquetipo de *Hábito Elástico* se computa con las mismas ecuaciones que ya conoce (busca slots libres en tu ventana preferida, respeta descanso y no solapa con sueño). Para ti, en cambio, la identidad semántica es 100% limpia y personalizada.
* **Habilitación de Analíticas y Finetuning Futuro:**
  * **Retrospectiva Semanal Enriquecida:** Al final de la semana puedes ver métricas reales de cómo distribuyes tu vida (*"Esta semana: 12h cursada, 10h estudio, 4h Side Project, 2h Terapia, 3h gimnasio"*).
  * **Calibración Progresiva:** Permite en el futuro crear reglas de ajuste fino específicas por categoría sin alterar las demás (ej: *"La categoría Side Project solo puede agendarse cuando el índice de fatiga acumulada sea < 30"* o *"Guitarra máximo 45 minutos por sesión"*).

---

## 3. Módulo 2: Inteligencia Biológica, Fisiológica y Circadiana (Bio-Engine)

Ninguna app comercial (ni Google, ni Notion, ni Reclaim) entiende la fisiología humana: asumen que tu energía es plana y que puedes rendir igual a las 9 AM tras una jornada corporativa que tras haber cerrado un local de noche o haber salido con amigos hasta la madrugada. Este módulo es el corazón de la protección de tu salud física, mental y circadiana.

### 3.1 Ventana de Sueño Flotante Universal Post-Actividad Nocturna (Turnos Laborales o Salidas Sociales)
* **Qué es:** Cada vez que una actividad concluye en horario nocturno o de madrugada —ya sea un turno de trabajo en Ferro San Juan, una salida imprevista a un bar con amigos, un recital, un asado o un boliche que termine después de una hora umbral (configurable, ej. > 23:30 o madrugada)—, la app **reserva automáticamente un bloque continuo de 8 horas de sueño inviolable** (configurable: `target_sleep_window`, ej. 480 min) que se inicia en el momento exacto en que llegas efectivamente a tu casa.
* **Cálculo de hora de llegada real:** No parte de la hora en que termina la actividad, sino que le suma automáticamente el tiempo de traslado de regreso según la matriz de transporte:
  $$t_{\text{inicio\_sueño}} = t_{\text{fin\_evento}} + \text{travelMatrix}(E_{\text{ubicación}}, \text{'Casa'})$$
  *(Ejemplo: si la salida con Juancito termina a las 02:00 AM y el viaje a casa toma 30 min, el bloque de sueño se fija automáticamente de 02:30 AM a 10:30 AM).*
* **Razón de ser:** Tu biología no distingue si estuviste de pie atendiendo clientes en Ferro o charlando en una cervecería: si llegas a tu casa a las 02:30 AM, intentar que el calendario te ponga estudio o cursada a las 08:00 AM es fisiológicamente inviable, destructivo para tu ritmo circadiano y genera culpa artificial por incumplimiento. El descanso de 8 horas debe ser dinámico, flotante y protegido sin importar la causa que originó el trasnoche.
* **Cómo lo logra:** Regla **HC-03 Universal (Late Night Sleep Anchor)**: cualquier evento $E$ con etiqueta `night_activity: true`, `work_shift: ferro`, o cuyo horario de finalización supere el umbral nocturno, proyecta obligatoriamente este bloque continuo como **Hard Constraint**. Ninguna tarea, hábito ni evento flotante puede invadir esa franja de recuperación celular.

### 3.2 Veto Cognitivo Post-Disrupción y Ventana de Descompresión (Universal Cognitive Ban Window)
* **Qué es:** Buffer de protección cognitiva y descompresión: evita agendar tareas de alta demanda mental (como estudio pesado o modelado complejo) en dos momentos naturales de fatiga o desfasaje circadiano:
  1. **En la descompresión inmediata post-actividad (Buffer de Aterrizaje):** Durante los primeros 60 a 90 minutos posteriores a regresar de cualquier evento de alto desgaste o finalización tardía (llegar de una jornada laboral agotadora, de un viaje largo, de una reunión demandante o de una salida social intensa). Pretender sentarse a estudiar a los 10 minutos de cruzar la puerta de casa es irreal.
  2. **En la inercia post-despertar tras horario desfasado:** Durante los primeros 90 a 120 minutos posteriores a levantarte cuando tu ciclo habitual de sueño haya sido alterado (despertar tarde o al mediodía tras haberte acostado a la madrugada, o despertar tras una noche de sueño irregular).
* **Razón de ser:** El cerebro humano no es un interruptor eléctrico con conmutación instantánea; tiene una **inercia neurofisiológica y homeostática ineludible**. Cuando una actividad rompe tus ritmos circadianos habituales o drena tu energía ejecutiva, la corteza prefrontal experimenta un período refractario de baja concentración, fatiga ocular y menor capacidad de memoria de trabajo. Forzar bloques de estudio exigentes en esos momentos solo produce frustración, culpa artificial, parálisis por procrastinación y un aprendizaje de pésima calidad.
* **Cómo lo logra el motor (Agnóstico a la fuente de disrupción):**
  * El sistema no busca nombres fijos ni se ata a una sola empresa o local. Clasifica cualquier evento mediante métricas universales de disrupción:
    * `is_schedule_disruptor: true` (se activa automáticamente si el evento termina después del umbral nocturno, si excede una duración prolongada continua, o si tiene etiqueta de fatiga psicofísica `energy_drain: high`).
  * Regla **HC-04 / HC-11 Universal (Cognitive Ban & Decompression Window)**:
    * Inyecta una zona de exclusión cognitiva obligatoria sobre:
      $$\text{Zona 1 (Aterrizaje): } [t_{\text{llegada\_casa}}, t_{\text{llegada\_casa}} + \text{buffer\_aterrizaje}]$$
      $$\text{Zona 2 (Inercia de sueño): } [t_{\text{despertar}}, t_{\text{despertar}} + \text{buffer\_inercia\_sueño}]$$
    * Dentro de estas ventanas, el solver veta terminantemente todo bloque con `cognitiveLoad >= 2` o categoría `study_heavy`.
    * Únicamente admite actividades pasivas o de mantenimiento personal: `logistics`, `rest`, `meals` o `personal_care` (desayuno/almuerzo relajado, ducha, ordenar viandas o descansar la vista).

### 3.3 Matching de Demanda Cognitiva vs. Cronotipo Diario
* **Qué es:** Clasificación de tus asignaturas por esfuerzo mental (Redes, AyDS y CalSoft = Demanda Alta; AEEC = Demanda Media; tareas administrativas = Demanda Baja) y colocación automática en tus momentos de máxima energía real.
* **Razón de ser:** 2 horas de estudio de calidad con la mente fresca valen más que 5 horas peleando contra el sueño. El tiempo no es homogéneo; su valor depende de la energía disponible.
* **Cómo lo logra:** Soft Constraint que penaliza la asignación de materias cognitivamente densas en valles circadianos o en días consecutivos de sobrecarga laboral o nocturnidad.

### 3.4 Rastreador de Deuda de Fatiga Acumulada (Laboral + Social)
* **Qué es:** Un indicador continuo que evalúa cuántas noches trasnochadas (turnos de cierre nocturno o salidas sociales hasta tarde) y jornadas pesadas consecutivas llevas en la semana.
* **Razón de ser:** Si sales el viernes hasta tarde y el sábado trabajas de noche en Ferro, el domingo tu cuerpo estará exhausto aunque hayas tenido 8 horas de sueño fraccionado. Compensar todo el estudio atrasado de golpe un domingo trasnochado conduce al agotamiento físico.
* **Cómo lo logra:** Si el índice de fatiga cruzada supera un umbral crítico, el solver incrementa automáticamente los buffers de descanso entre tareas, prioriza el domingo para descanso activo o logística suave, y eleva el costo de programar sesiones de estudio maratónicas.

---

## 4. Módulo 3: Logística Espacial, Desplazamientos y Microclima Costero

Las agendas tradicionales asumen teletransportación: un evento termina a las 15:00 en la Rambla y el siguiente empieza a las 15:00 en la Facultad. En el mundo real, eso destruye cualquier planificación y te condena a vivir apurado.

### 4.1 Matriz de Tiempos de Traslado y Encadenamiento Espacial Inteligente (Spatial State Tracking)
* **Qué es:** Cálculo automático de tiempos de viaje entre tus puntos neurálgicos conocidos: Casa, Sucursal Rambla Casino, Sucursal Ferro San Juan, Facultad (UNMDP), Gimnasio y puntos de encuentro habituales. El usuario puede añadir o editar los pares origen-destino con sus tiempos reales de viaje (en colectivo, a pie o en auto).
* **Rastreo continuo de ubicación ($Location(t)$):** El motor sabe en qué punto geográfico te encuentras al terminar cada actividad. Cuando el algoritmo evalúa qué tarea o hábito ubicar a continuación (ej. entrenar, hacer compras o cursar), computa el tiempo de viaje desde tu ubicación real y **favorece el encadenamiento geográfico inteligente** (clustering de proximidad).
  *(Ejemplo: si sales a las 16:00 de cursar en la Facultad, el motor preferirá encadenar pasar por el gimnasio si te queda de paso o ir directo a un compromiso, en lugar de hacerte volver a casa para tener que salir de nuevo 40 minutos después).*
* **Razón de ser:** El traslado en Mar del Plata no es despreciable (30 min a Casino, 30 min a Ferro, esperas de colectivo). Si la agenda no sabe dónde estás físicamente en cada momento, genera planes inviables con desplazamientos absurdos de ida y vuelta que desgastan energía inútilmente.
* **Cómo lo logra:** **HC-05 y HC-05b (Travel Buffer & Viability)**: consulta la matriz de traslados (`travelMatrix.ts`), verifica la continuidad espacial entre eventos consecutivos ($E_i.location \to E_{i+1}.location$) e inyecta automáticamente el bloque de viaje correspondiente. Si dos eventos consecutivos son físicamente inalcanzables en el tiempo intermedio, el solver marca el plan como inválido.

### 4.2 Graduación de Puntualidad y Tolerancia a Tardanzas por Compromiso (Punctuality Strictness Matrix)

> *(NOTA DE CONFIGURABILIDAD: Los ejemplos de turnos laborales, la materia AEEC con asistencia estricta o las juntadas casuales son casos ilustrativos para plasmar los 3 niveles de severidad. Cualquier materia, evento laboral o compromiso puede asignarse a cualquiera de estos 3 niveles en cualquier momento).*

* **Qué es:** La capacidad de configurar explícitamente **a qué eventos es inaceptable llegar tarde y a cuáles se tolera impuntualidad**, definiendo la severidad y el margen máximo admisible:
  1. **Nivel 1 — Cero Tolerancia / Puntualidad Crítica (Hard Constraint):**
     * **Turnos laborales:** Llegar tarde en el local es causal de sanción disciplinaria.
     * **Materias con asistencia estricta (ej. AEEC):** La cátedra toma asistencia; una tardanza cuenta como falta y pone en riesgo la regularidad.
     * **Exámenes parciales y finales:** La puerta se cierra al inicio.
     * *Regla:* Tolerancia = 0 minutos. El viaje se calcula con margen de seguridad adicional. Si el arribo previsto supera la hora de inicio por 1 minuto, el plan es rechazado ($\text{Penalización } \infty$).
  2. **Nivel 2 — Tardanza Leve Tolerable con Penalización Moderada (Graduated Soft Constraint):**
     * **Otras materias universitarias sin asistencia estricta (Redes, AyDS, CalSoft):** Llegar 5 a 10 minutos tarde es tolerable en situaciones de cuello de botella si eso permite terminar de almorzar, completar una serie en el gimnasio o empalmar un colectivo. Sin embargo, tiene una penalización creciente porque perderse los primeros minutos de clase tiene costo académico.
     * *Regla:* Tolerancia máxima de 10-15 min con función de penalización cuadrática según los minutos de retraso.
  3. **Nivel 3 — Alta Elasticidad Social (Puntualidad Relajada):**
     * **Juntadas casuales con amigos cercanos (Juancito, Juani), mates en la costa o cenas informales:** Llegar 15, 20 o 30 minutos más tarde es socialmente normal y admisible mediante un mensaje de WhatsApp.
     * *Regla:* Tolerancia amplia (hasta 30-40 min) con penalización ínfima o nula. El solver puede aprovechar este margen para estirar una sesión de estudio previa o no cortar abruptamente una tarea importante.
* **Razón de ser:** Tratar todos los eventos con el mismo rigor de puntualidad militar genera una agenda hiper-rígida que se quiebra ante la menor demora de un colectivo. Conocer la elasticidad de cada compromiso permite al motor resolver cuellos de botella sin estresarte en compromisos donde unos minutos no importan, pero garantizando puntualidad suiza en tu trabajo y en AEEC.
* **Cómo lo logra el solver CSP:** Asigna a cada evento un parámetro `maxLatenessMinutes` y un coeficiente de severidad `latenessPenaltyWeight`. El optimizador calcula el tiempo de arribo efectivo y aplica la penalización correspondiente dentro de la función de costo global.

### 4.3 Inteligencia Meteorológica, Arbitraje Climático del Tiempo y Propuestas Adaptativas Proactivas
* **Qué es:** Integración continua con una API meteorológica profesional (ej. Open-Meteo con modelos numéricos ECMWF/GFS hasta **14 días de pronóstico horario**) que evalúa las variables críticas del microclima de Mar del Plata:
  * **Viento fuerte:** Velocidad sostenida y ráfagas (con foco estricto en vientos del Sudeste $> 35\text{ km/h}$, que vuelven inviable e inhóspita cualquier actividad costera).
  * **Lluvia y precipitaciones:** Probabilidad de lluvia y milímetros acumulados por hora.
  * **Frío intenso y sensación térmica:** Temperatura real y baja sensación térmica por humedad y viento marítimo.
* **El Concepto de Arbitraje Climático del Tiempo (Weather Arbitrage):**
  * Ante la detección de mal clima (lluvia, frío polar o temporal de viento), el motor no solo busca "un bar techado", sino que **prioriza utilizar estratégicamente ese tiempo feo para actividades productivas de encierro (estudio pesado de Redes, modelado en AyDS, CalSoft o batch cooking en casa)**.
  * **Liberación de días dorados:** Al adelantar y concentrar las horas de estudio semanales durante los días o tardes de tormenta, el sistema **despeja y protege proactivamente los días y noches de clima óptimo venideros** (tardes templadas, poco viento, cielo despejado) para disfrutar al aire libre, tomar mate en la costa o salir con amigos, eliminando la culpa de estar perdiendo tiempo de estudio.
* **Propuestas Adaptativas Proactivas No Intrusivas (El sistema propone, el usuario decide):**
  * La atmósfera es dinámica y los pronósticos a varios días cambian. Cuando el sistema detecta un **cambio significativo en las predicciones meteorológicas**:
    * El motor ejecuta una **re-optimización en segundo plano** (*shadow calculation*).
    * **No modifica la agenda automáticamente ni te impone cambios a traición:** el usuario puede haberse organizado previamente con otras personas, comprado insumos o mentalizado para su rutina.
    * En su lugar, el sistema genera una **Propuesta de Reacomodamiento Climático** en la interfaz o mediante notificación contextual:
      > *"Alerta climática: El pronóstico para el sábado cambió a tormenta con viento SE de 40 km/h y lluvia. Propuesta del motor: Adelantar 3 horas de estudio de CalSoft al sábado de temporal bajo techo y liberar la tarde del domingo (23°C, soleado) para la costa. [Ver Comparativa en DiffViewer] [Aceptar Propuesta] [Mantener Agenda Como Está]"*
* **Razón de ser:** Mar del Plata tiene un clima oceánico cambiante y severo. Los días de buen clima son un recurso escaso y valioso que merece ser aprovechado activamente; quedarse encerrado estudiando un domingo radiante habiendo pasado un sábado lluvioso sin hacer nada es un desperdicio vital. Al mismo tiempo, alterar la agenda unilateralmente genera sensación de pérdida de control. El sistema debe actuar como un estratega meteorológico que te ofrece la jugada óptima, pero dejándote siempre el control soberano de la decisión.
* **Cómo lo logra el motor CSP:**
  * **Watcher meteorológico:** Monitorea la API periódicamente y calcula un índice horario de confort (`ComfortScore` de 0 a 100).
  * **Afinidad climática por categoría:** Asigna alta afinidad al estudio y la cocina cuando $ComfortScore < 40$, y alta afinidad al esparcimiento al aire libre cuando $ComfortScore > 75$.
  * **Umbral de cambio significativo:** Si la variación del pronóstico ($|\Delta ComfortScore|$) sobre un día con eventos planificados supera un umbral configurable, dispara el solver en modo simulación y presenta la propuesta como un diff interactivo.
  * **Fallback indoor encadenado:** Para planes sociales que no pueden cancelarse ante lluvia, mantiene la cadena automática:
    $$\text{Aire Libre} \longrightarrow \text{Depto de contacto (si aplica)} \longrightarrow \text{Bar o Cervecería techada}$$

### 4.4 Buffer Graduado Post-Consumo (Graduated Hard Constraint - GHC)

> *(NOTA DE CONFIGURABILIDAD: Los valores de 2 horas mínimas y 4 horas ideales son parámetros de prueba iniciales sugeridos para convivencia familiar. La duración del buffer, los pesos de penalización o la activación de esta restricción son 100% configurables por Matu en `params.ts` o desde la configuración).*

* **Qué es:** Restricción temporal inteligente para eventos sociales que incluyan consumo recreativo de cannabis (`cannabis_consumed: true`). Garantiza una ventana de tiempo suficiente antes de regresar a casa.
* **Razón de ser:** Vives con tus padres en Mar del Plata. Llegar a casa en un estado alterado genera incomodidad, estrés y tensión familiar innecesaria. Se necesita un margen de descenso y recuperación sobria antes del regreso.
* **Cómo lo logra:** Se modela como una **Graduated Hard Constraint (GHC-01)**:
  * **Tiempo objetivo ideal:** 4 horas (240 min) $\to$ Penalización = 0.
  * **Piso mínimo absoluto:** 2 horas (120 min) $\to$ Por debajo de este tiempo la penalización es infinita ($\infty$), impidiendo que el motor proponga un regreso prematuro.
  * **Zona de graduación (2 a 4 horas):** Penalización cuadrática continua: el solver puede tolerar un regreso de 3 horas solo si eso salva una cursada o un compromiso crucial al día siguiente, pero siempre preferirá darte el tiempo completo para llegar sobrio y tranquilo.

---

## 5. Módulo 4: Vínculos Sociales, Privacidad y Convivencia Familiar

El ser humano no es un autómata productivo; la calidad de vida está determinada por la calidad de sus relaciones afectivas. El auto-scheduling debe proteger los vínculos sin sacrificar los estudios.

### 5.1 Bolsa Global de Tiempo Social y Pistas Suaves de Disponibilidad (Soft Social Hints)
* **Qué es:** En lugar de imponer metas numéricas rígidas y aisladas por persona (que tratan la amistad como una planilla contable de horas fijas), el sistema opera con una **Bolsa Global Flexible de Tiempo Social**:
  * **Tiempo social fungible y grupal:** El usuario define una orientación general semanal (ej. un rango deseable de 5 a 8 horas sociales en total). Este tiempo se satisface con total fluidez: juntadas con varios amigos a la vez (que suman para el grupo sin duplicar horas de agenda), salidas con amigos individuales, o **planes orientados a conocer gente nueva**.
  * **Prioridad adaptativa (no punitiva):** Las necesidades sociales cambian semana a semana y no tienen la rigidez de un trabajo o una cursada. El sistema no penaliza drásticamente si una semana de parciales se reduce el tiempo social.
  * **Pistas Suaves de Amigos (Soft Availability Hints):** El usuario puede registrar de forma orientativa los horarios de cursada de Juancito o los turnos de Juani. El sistema los utiliza **exclusivamente como sugerencias suaves de conveniencia** (ej. saber que Juancito suele cursar los martes por la tarde para sugerir cenas en vez de meriendas), pero **JAMÁS bloquean ni atan la agenda de Matu**: si Juancito está ocupado o no puede salir, el slot sigue 100% abierto para salir con Juani, con otra persona, sumarse a un plan nuevo o reconvertirlo.
* **Razón de ser:** La vida social real es dinámica y espontánea. Atar un calendario a cuotas rígidas por persona genera culpa artificial y fricción cuando los amigos no coinciden. Además, cuando el foco vital está en expandir el círculo y conocer gente nueva, la disponibilidad de un amigo particular no debe frenar las oportunidades sociales.

### 5.2 Botón "Descartar Slot Social y Reutilizar Tiempo" (Dismiss & Repurpose Social Slot)
* **Qué es:** Si el sistema había reservado una ventana para vida social o salida y el usuario sabe que ese día no va a poder hacer nada (sus amigos no pueden, no surgió ningún plan con gente nueva o simplemente no tiene energía para salir), un solo toque activa: *"Acá no se puede hacer nada social $\to$ Reutilizar tiempo en otra cosa"*.
* **Efecto algorítmico inmediato:** 
  * El motor levanta la expectativa social sobre esa franja horaria.
  * En menos de 50 milisegundos, el solver **re-calcula y re-empaqueta la agenda aprovechando ese tiempo liberado para lo que más convenga**: adelantar bloques de estudio de materias pesadas (Redes, AyDS, CalSoft) para liberar el fin de semana, encastrar una sesión de batch cooking, meter un entrenamiento de gimnasio o agendar descanso reparador.
* **Razón de ser:** Nada es más frustrante en un auto-scheduler que tener un bloque bloqueado como "Social / Libre" en el que sabes que vas a quedarte en tu casa scrolleando el teléfono porque nadie puede salir. La app debe permitirte capitalizar ese hueco inmediatamente para sacarte trabajo de encima y ganar libertad futura.

### 5.3 Slots de Serendipia Social (Social Opportunity Slots)
* **Qué es:** Ventanas estratégicas en horarios de alta probabilidad social (ej. viernes o sábados por la tarde/noche) protegidas de tareas cognitivas pesadas, pensadas para salidas espontáneas, eventos o conocer gente nueva. Si no se utilizan, se reconvierten al instante mediante el botón de la sección 5.2.
* **Razón de ser:** Preservar espacio para la espontaneidad y la expansión social sin que el estudio colonice ciegamente los momentos más propicios del fin de semana.

### 5.4 Privacidad y Modo Convivencia Familiar
* **Qué es:** Dos características clave para la vida en el hogar paterno:
  1. **Separación Funcional de Espacios:** El hogar familiar se reserva principalmente para estudio, descanso y vida cotidiana, asignando por defecto las juntadas casuales numerosas o salidas a espacios exteriores (bares, cervecerías o espacios públicos).
  2. **Alias de Privacidad en Pantalla (Display Aliases):** La app permite configurar nombres ficticios o neutrales para eventos sensibles (ej. en vez de mostrar detalles personales, la vista general muestra *"Compromiso Personal"* o *"Trámite"*), impidiendo miradas indiscretas sobre la pantalla.
* **Razón de ser:** Compartir vivienda familiar implica negociar espacios comunes y cuidar la privacidad personal cotidiana.

---

## 6. Módulo 5: Interfaz de Usuario, Control Humano y Ergonomía Diaria

Un motor algorítmico brillante fracasa si su interfaz se siente como una planilla de cálculo fría o un laberinto de opciones confusas.

### 6.1 Vista de Calendario en Cuadrícula Temporal Continua (Time-Grid Proporcional Diaria y Semanal)
* **Qué es:** Una interfaz gráfica construida como una **cuadrícula horaria continua de dos dimensiones** (el formato estándar de las vistas de agenda como Google Calendar, pero potenciada con la inteligencia del optimizador):
  * **Eje vertical continuo (Escala espacial de tiempo constante):** La línea vertical representa las 24 horas del día con una escala métrica fija (por ejemplo, exactamente $H$ píxeles o centímetros por cada hora de tiempo, subdividida con líneas sutiles cada 15 y 30 minutos).
  * **Eje horizontal (Días):** Una columna por cada día de la semana (en vista semanal de 7 columnas) o una columna focalizada (en vista diaria).
  * **Posicionamiento geométrico exacto de cada bloque:** Cada evento, cursada, turno o sesión de estudio no es una tarjeta abstracta en una lista, sino un bloque que se dibuja **físicamente sobre la cuadrícula entre sus marcas de tiempo reales**:
    * **Límite superior ($Y_{\text{top}}$):** Coincide con precisión matemática con su hora de inicio (ej. un evento a las 14:15 arranca exactamente en el primer cuarto de la celda de las 14:00).
    * **Límite inferior ($Y_{\text{bottom}}$):** Coincide exactamente con su hora de conclusión (ej. si concluye a las 16:45, el bloque se estira cubriendo 2 horas y 30 minutos de cuadrícula vertical).
    * **Huecos libres literales:** El espacio vacío entre dos bloques consecutivos no es un vacío estético, sino la representación gráfica visible de tu **tiempo libre real disponible** en esa franja horaria.
* **Iconografía de Estado y Jerarquía Visual:**
  * 🔒 **Candado cerrado:** Compromiso inamovible (Turno de sucursal, cursada universitaria fija).
  * 🌊 **Ondas / Flotante:** Tarea o hábito ubicado algorítmicamente por el motor, que se desplazará de forma fluida si surge un imprevisto.
  * 🛡️ **Escudo (Time Defense):** Tarea que comenzó siendo elástica pero que el motor ha blindado como ocupada porque el margen para llegar al deadline es inminente.
  * **Diferenciación cromática:** Paleta visual por categoría (Estudio universitario, Trabajo, Social, Fisiológico/Descanso, Gimnasio, Viajes).
* **Razón de ser:**
  * La mente humana comprende la disponibilidad de tiempo mediante analogías espaciales. Si una cursada de 4 horas y una pausa de 15 minutos se dibujan como tarjetas del mismo tamaño (como hace Notion o una lista de tareas), se genera una ilusión de disponibilidad engañosa que lleva al colapso de la agenda.
  * Al ver una cuadrícula continua proporcional, basta un vistazo de 2 segundos para entender la densidad real del día: reconoces al instante los huecos continuos para meter estudio profundo, detectas cuellos de botella de traslado y sabes qué bloques son negociables si alguien te propone una salida.

### 6.2 El DiffViewerModal con Constraint Trace (Explicabilidad Algorítmica a Costo $0 sin IA)
* **Qué es:** Cada vez que el motor re-optimiza tu semana (por un imprevisto o por presionar el botón de recálculo), no te cambia las cosas en silencio: te abre una ventana comparativa (*Diff View*) que muestra el **Antes vs. Después** y una **Traza de Explicación** en lenguaje natural sin requerir IA generativa.
* **Cómo se implementa sin IA (Trazabilidad Simbólica y Plantillas Paramétricas):**
  * El motor ya conoce con precisión matemática el motivo de cada cambio: ningún bloque se mueve por azar; se mueve porque una Hard Constraint lo invalidó o una Soft Constraint mejoró el score global.
  * Compara los arrays $\text{Schedule}_{\text{original}}$ vs. $\text{Schedule}_{\text{nuevo}}$, detecta los bloques modificados y consulta el diccionario de causas exactas (`constraintTrace.ts`):
    ```typescript
    if (causa === 'HC-03_SLEEP') {
      return `• ${evento.name} se pospuso a las ${nuevoInicio} para respetar tus ${horasSueno}h de sueño ininterrumpido tras la trasnochada.`;
    }
    if (causa === 'HC-08_WEATHER') {
      return `• ${evento.name} cambió de locación a "${nuevaLocacion}" porque a las ${hora} hay pronóstico de lluvia / viento SE > 35 km/h.`;
    }
    if (causa === 'HC-01_OVERLAP') {
      return `• ${evento.name} se reacomodó al ${nuevoDia} a las ${nuevoInicio} porque colisionaba con tu salida con ${amigo}. Su entrega vence el ${diaEntrega}, por lo que sigue a tiempo.`;
    }
    if (causa === 'GHC-01_CANNABIS') {
      return `• Llegada a casa proyectada a las ${horaRegreso} (${horasSobrias}h de margen), garantizando el descenso completo antes de interactuar en casa.`;
    }
    ```
* **Resultado para el usuario:**
  > **Propuesta ante imprevisto (Juancito a las 19:00):**
  > * **CalSoft:** Se movió a mañana viernes de 15:00 a 17:00 *(Motivo: colisión directa; hay hueco libre antes de tu turno de las 18:00)*.
  > * **Batch Cooking:** Se dividió en 2 bloques *(Motivo: no cabía completo el jueves sin quitarte horas de sueño)*.
  > * **Garantía:** Llegas a casa a las 23:00 con 3h de buffer familiar cumplido.
  > 
  > *Tiempo de generación: 4 milisegundos. Consumo de API: $0.*
* **Razón de ser:** Si una app mueve tus cosas sin explicarte por qué, pierdes el control y dejas de confiar en ella. La explicabilidad determinista genera tranquilidad mental inmediata.

### 6.3 Modo "¿Qué Hago Ahora?" (What Now Mode)
* **Qué es:** Una vista ultra-limpia a pantalla completa en el teléfono que responde una sola pregunta: *"En este preciso momento, ¿cuál es mi única prioridad?"*.
* **Razón de ser:** La parálisis por decisión es el mayor enemigo de la productividad. Mirar un calendario lleno de 40 bloques puede abrumar. Este modo apaga el ruido y te muestra solo el bloque activo con un cronómetro de foco y dos botones gigantes: **"Terminé antes"** (libera tiempo para adelante) y **"Necesito 30 min más"** (empuja el resto con suavidad).

### 6.4 Meta-Sliders de Prioridad Global en Tiempo Real
* **Qué es:** Tres controles deslizantes en la barra superior que reflejan la tensión real de tu vida:
  * 📚 **Prioridad Académica** (Estudio / Entregas)
  * 🍻 **Prioridad Social** (Amigos / Vínculos / Salidas)
  * 🧘 **Prioridad de Bienestar / Descanso** (Sueño / Gimnasio / Cocina)
* **Razón de ser:** Hay semanas donde tienes 2 parciales y la prioridad social debe bajar temporalmente al mínimo. Hay semanas de vacaciones donde el estudio desaparece y quieres maximizar la vida social.
* **Cómo lo logra:** Los sliders modifican directamente los coeficientes de ponderación de la función de penalización unificada del solver en milisegundos. Subir el slider social reorganiza la semana dándole ventaja a las juntadas sobre las tareas no urgentes.

### 6.5 Modo Simulación "Y si..." (What-If Sandbox)
* **Qué es:** Un modo de prueba donde puedes experimentar escenarios hipotéticos sin alterar tu calendario real: *"¿Qué pasa con mi semana si acepto hacer un turno extra en el Casino el sábado?"* o *"¿Qué pasa si me voy de viaje con amigos de viernes a domingo?"*.
* **Razón de ser:** Tomar decisiones sobre compromisos nuevos produce ansiedad porque no sabes qué estás sacrificando hasta que ya dijiste que sí.
* **Cómo lo logra:** Clona el estado del calendario en memoria, ejecuta el solver con la nueva restricción y te muestra el impacto exacto en tus horas de sueño, estudio y gimnasio antes de que confirmes tu respuesta en la vida real.

---

## 7. Módulo 6: Ciclo de Vida Semanal, Retrospectiva y Aprendizaje Adaptativo

El sistema aprende de tus patrones reales para dejar de planificar para un "tú idealizado" y empezar a planificar para tu "yo verdadero".

### 7.1 Sesión de Planificación Guiada de Domingo (Weekly Onboarding)
* **Qué es:** Un ritual guiado de 5 minutos todos los domingos por la tarde:
  1. Confirmación de los turnos de la semana (Casino y Ferro).
  2. Carga de objetivos flotantes de la facultad (horas requeridas para cada materia).
  3. Chequeo rápido de pronóstico de clima para el fin de semana.
  4. Presionar "Generar Propuesta Semanal" y aprobar o ajustar.
* **Razón de ser:** Arrancar el lunes sabiendo exactamente cómo encastran todas las piezas de tu vida elimina la ansiedad dominical y te da claridad mental para toda la semana.

### 7.2 Retrospectiva Semanal No Punitiva (El Score Bio-Psico-Social)
* **Qué es:** Una revisión al final del domingo que evalúa la armonía de la semana:
  * Horas reales de sueño logradas vs. meta.
  * Horas de estudio efectivas vs. entregas.
  * Cumplimiento de metas de amistad (Juancito / Juani).
  * Sesiones de cocina y ejercicio completadas.
* **Razón de ser:** El puntaje no es para castigarte ni generar culpa (*"Fallaste en un 30%"*), sino para darte visibilidad y calibrar el sistema: si una meta nunca se cumple, el problema es de calibración del objetivo, no de falta de voluntad.

### 7.3 Sistema de Aprendizaje de Patrones Reales
* **Qué es:** El motor observa silenciosamente tus comportamientos repetidos:
  * Si el sistema te programa estudio los miércoles a las 9 AM pero tú siempre lo pospones o cancelas tras haber cerrado Ferro, el motor aprende que ese slot tiene una fricción biológica real no modelada.
* **Cómo lo logra:** Aplica un peso de penalización adaptativo sobre los slots habitualmente pospuestos, dejando de proponerte estudio en momentos donde históricamente tu cuerpo no responde.

### 7.4 Los 5 Mecanismos de Calibración Continua y Adaptabilidad Dinámica de Restricciones
Ningún modelo inicial refleja la vida real de una persona en el Día 1. Para evitar que la aplicación quede obsoleta o se vuelva rígida, el sistema incorpora 5 mecanismos explícitos de calibración progresiva y evolución:
1. **La Consola de Perillas (Knobs & Sliders en UI — `params.ts`):**
   * Ningún parámetro de tu vida está cableado rígidamente en el código. Todo vive en un objeto de configuración accesible desde la interfaz:
     * *Tiempos biológicos:* Target de sueño post-trasnoche (6h a 9h), inercia cognitiva al despertar (30 min a 180 min).
     * *Tolerancias de viaje:* Margen de seguridad sobre el transporte público (5 min a 25 min).
     * *Descanso de gimnasio:* Días mínimos entre grupos musculares cruzados (1 a 3 días).
   * Si notas que 90 min post-despertar trasnochado te queda corto, mueves el slider a 120 min y el motor adopta tu nuevo ritmo al instante.
2. **Ajuste de Prioridades por Pesos (Meta-Sliders de Tensión Semanal):**
   * Modifica en tiempo real el balance entre Foco Académico, Vida Social y Descanso/Bienestar según el momento del cuatrimestre.
3. **Registro de Fricción al Mover Bloques (Drag & Drop Feedback):**
   * Si el motor ubicó un bloque de estudio el miércoles a las 11:00 AM pero tú lo arrastras manualmente al jueves, la app detecta el override y despliega un mini-selector no intrusivo de 2 segundos:
     > *"¿Por qué moviste este bloque?"*
     > * [ 💤 Estaba muy cansado a esa hora ] $\longrightarrow$ *(El motor eleva la penalización de fatiga para esa franja horaria).*
     > * [ ⚡ Prefiero estudiar esta materia de mañana ] $\longrightarrow$ *(El motor registra una preferencia horaria para esa materia).*
     > * [ 🎲 Imprevisto puntual que no se repetirá ] $\longrightarrow$ *(No altera las reglas generales).*
4. **Retrospectiva Dominical de Calibración No Punitiva:**
   * Al final del domingo, la app no te juzga ni genera culpa por lo no completado; te ayuda a calibrar los objetivos:
     * *"Planificamos 3 sesiones de gimnasio pero fuiste a 1. ¿El tiempo disponible fue insuficiente o el bloque de 75 min fue demasiado ambicioso? [Reducir a 50 min] [Bajar a 2 sesiones semanales]"*.
     * *"Aceptaste 4 salidas que superaron el techo semanal configurado. ¿Ajustamos el presupuesto semanal en pesos o reforzamos la sugerencia de juntadas en casa?"*.
5. **Arquitectura Abierta para Modificación Dinámica de Restricciones (El Sistema como Plataforma Viva):**
   * El sistema está diseñado específicamente para que las restricciones NO estén soldadas al motor de búsqueda.
   * Cada restricción dura o blanda es un módulo independiente desacoplado (ubicado en `/constraints/hard/` y `/constraints/soft/`), que implementa una interfaz común `ConstraintEvaluator`.
   * **¿Qué permite esto en la práctica?:**
     * **Confirmar o reemplazar reglas iniciales:** Si Matu cambia su rutina de gimnasio a un esquema de 4 días (Torso/Pierna) o decide que los descansos entre grupos son de 1 día en vez de 2, simplemente se actualiza el objeto `splitRecoveryMatrix` en la configuración sin tocar una sola línea del algoritmo de resolución.
     * **Añadir nuevas restricciones al vuelo:** Si surge una nueva necesidad vital (ej. *"No programar tareas de pantalla después de las 22:00 los domingos"* o *"Pausa de descanso visual tras 3 horas continuas de pantalla"*), se agrega una nueva función evaluadora y el solver la incorpora en su próxima corrida en < 50 ms.
     * **Activar o apagar reglas:** Cualquier restricción puede prenderse o apagarse mediante un flag booleano (`enabled: true/false`) desde la UI o `params.ts`.

---

## 8. Módulo 7: Dimensión Económica en Moneda Local (ARS)

Planificar el tiempo sin considerar el dinero es una fantasía: no puedes aceptar 4 salidas sociales a bares o cenas en una misma semana si tu presupuesto mensual en pesos argentinos no lo resiste.

### 8.1 Presupuesto Semanal de Ocio y Salidas
* **Qué es:** Asignación de un presupuesto semanal en pesos (ARS) para salidas sociales, bares, cervezas con amigos y comidas afuera.
* **Razón de ser:** Proponer juntadas sociales o cenas sin límite presupuestario te obliga a cancelar planes por razones económicas a mitad de semana, generando fricción social o desbalance en tus finanzas personales.
* **Cómo lo logra:** Cada categoría de salida social tiene un costo estimado promedio (ej. Salida a bar/cerveza = $\$X$, Cena afuera = $\$Y$). Si el plan de la semana supera el tope configurado de gastos de ocio, el motor prioriza juntadas sin costo o de gasto mínimo (juntada de amigos en casa, mateadas al aire libre si el clima acompaña).

---

## 9. Módulo 8: Integración con Google Calendar y Ecosistemas Externos

No vives en un vacío tecnológico: tu facultad, tus empleadores o tus amigos a menudo te envían invitaciones por Google Calendar, o tú mismo consultas la app de Google Calendar en tu teléfono móvil o widget de Android. PlanificadorDeMatu no pretende aislarte del mundo, sino ser el **cerebro optimizador central** que dialoga fluidamente con Google Calendar mediante tres pilares:

### 9.1 Importación Asistida y Wizard de Triage Semántico (Semantic Mapping Wizard)
* **Qué es:** La capacidad de traer eventos desde Google Calendar a PlanificadorDeMatu (mediante conexión OAuth directa de Google, subida de archivo `.ics` o URL de suscripción iCal de Google).
* **El Problema del Calendario Externo:** Un evento importado de Google Calendar es "mudo": solo contiene un título (*"Turno Casino"*, *"Cursada Redes"*, *"Dentista"*), fecha y hora. Carece por completo de la información que el solver CSP necesita: ¿Es fijo o movible? ¿Qué demanda cognitiva o física tiene? ¿En qué ubicación física transcurre para calcular el viaje?
* **El Flujo de Triage Guiado al Importar:**
  1. Al sincronizar o importar eventos nuevos de Google Calendar, el sistema abre un **Modal de Triage Rápido**:
     > *"Se importaron eventos nuevos sin clasificar de Google Calendar. Ayúdame a entenderlos para proteger tu agenda:"*
     > * Evento: *"Turno Casino"* (Viernes 14:00 - 22:00) $\longrightarrow$ Sugerencia: ¿Categoría Trabajo? ¿Bloque inamovible (`is_locked: true`)? ¿Ubicación: Rambla Casino?
     > * Evento: *"Clase Redes"* (Miércoles 16:00 - 19:00) $\longrightarrow$ Sugerencia: ¿Categoría Cursada? ¿Ubicación: Facultad?
  2. **Reglas Persistentes de Mapeo Automático (Auto-Mapping Rules):**
     * Con un checkbox *"Recordar para futuros eventos con este nombre"*, el sistema guarda una regla semántica:
       * Si el título contiene `"Casino"` $\longrightarrow$ `category: 'trabajo'`, `is_locked: true`, `location: 'rambla_casino'`, `physicalLoad: 2`.
       * Si el título contiene `"Redes"` o `"CalSoft"` $\longrightarrow$ `category: 'cursada'`, `is_locked: true`, `location: 'facultad'`, `cognitiveLoad: 2`.
     * A partir de ese momento, cada vez que tu empleador o tu facultad agregue un evento en tu Google Calendar, PlanificadorDeMatu lo absorberá automáticamente clasificado, inyectando los tiempos de viaje y respetando el descanso sin que tengas que volver a configurar nada.

### 9.2 Exportación Estándar `.ics` y Live Sync en Tiempo Real (Webcal Feed)
* **Qué es:** La capacidad de ver tu agenda optimizada por PlanificadorDeMatu directamente en Google Calendar (en tu teléfono, tablet o smartwatch).
* **Mecanismos Disponibles:**
  1. **Live iCal Feed (URL de Suscripción Webcal — Recomendado):**
     * La aplicación genera un enlace privado y seguro (ej. `webcal://planificador.matu.app/api/calendar/feed?token=xyz` o `.ics` servido por el backend/Supabase).
     * En Google Calendar, vas a *"Añadir calendario" $\longrightarrow$ "Desde URL"* y pegas el enlace una sola vez.
     * Google Calendar se sincroniza periódicamente en segundo plano: cada vez que el optimizador mueve una sesión de estudio o apruebas una propuesta del Botón de Pánico, los cambios se reflejan automáticamente en la app de calendario nativa de tu teléfono.
  2. **Exportación Manual de Archivo `.ics` (RFC 5545):**
     * Un botón directo en la barra superior ("Exportar a Calendario") que descarga al instante `planificador-de-matu.ics`, compatible con Google Calendar, Apple Calendar o Microsoft Outlook.
  3. **Conexión Directa por API de Google Calendar (OAuth 2.0):**
     * Para sincronización instantánea bidireccional, la app puede autenticarse con tu cuenta de Google y crear un **calendario secundario dedicado llamado "PlanificadorDeMatu"**. De este modo, los bloques calculados se escriben allí de forma aislada, sin mezclar ni ensuciar tu calendario personal preexistente.

### 9.3 Máscaras de Privacidad en la Exportación (Privacy Shields & Display Aliases)
* **Qué es:** Protección estricta de tu intimidad al exportar hacia Google Calendar.
* **Razón de ser:** Tu Google Calendar puede estar sincronizado en dispositivos compartidos, pantallas familiares o ser visible para terceros. Eventos personales o sensibles (como tu sesión de terapia, tus buffers de recuperación y descanso biológico, o el buffer post-consumo GHC-01) no deben exponerse con lujo de detalles en una app externa.
* **Cómo lo logra:** Al generar el feed o archivo `.ics`:
  * Si el evento tiene `is_sensitive: true`:
    * El título se sustituye automáticamente por su alias neutral configurado (`displayAlias`, ej. *"Compromiso Personal"* o simplemente *"Ocupado"*).
    * Se eliminan la descripción, notas privadas y contactos asociados (`CLASS:PRIVATE`).
  * Los eventos habituales (cursadas, turnos, estudio, gimnasio) se exportan con su iconografía y detalles completos.

---

## 10. Matriz de Interacción: Cómo se unen las piezas ante un Imprevisto

Para visualizar la experiencia integral, veamos qué ocurre paso a paso en un caso de la vida real:

```
                              ESCENARIO REAL: JUEVES 17:30 HS
                 Juancito te llama para juntarse a tomar una cerveza a las 19:00.
                 Tenías programado: 2 horas de estudio de CalSoft (19:00 a 21:00)
                 y Batch Cooking para preparar tus viandas de la semana (21:30 a 23:30).
                                                │
                                                ▼
                                    PRESIONAS "BOTÓN DE PÁNICO"
                                (O ingresas el evento con Juancito)
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           VERIFICACIÓN METEOROLÓGICA                              EVALUACIÓN CSP
   ¿Viento sudeste > 35 km/h o lluvia?                       1. El plan social desaloja
   → El motor sugiere automáticamente un bar                 CalSoft y Batch Cooking.
   techado en lugar de la costa.                             2. ¿Cuándo vence la entrega de CalSoft?
                                                             → Vence el sábado. Hay un hueco libre
                                                             el viernes de 15:00 a 17:00.
                                                             3. ¿El viernes trabajas en Ferro?
                                                             → Sí, pero entras a las 18:00. Con
                                                             matriz de viaje (30 min), es viable.
                                                             4. ¿Y el Batch Cooking?
                                                             → Se divide en dos sesiones o pasa al
                                                             sábado por la mañana antes de cursar.
                                                │
                                                ▼
                                  DIFF VIEWER MODAL EN PANTALLA
                   "Juancito agendado hoy 19:00 a 22:00 en bar techado.
                   • CalSoft se movió a mañana viernes 15:00 a 17:00 (llegas a tiempo a Ferro).
                   • Batch cooking se reacomodó al sábado 10:00 AM.
                   • GHC-01: Llegada a casa a las 23:00 garantiza margen de descanso familiar.
                   ¿Aceptar cambio?"  ───▶  [ SÍ, APLICAR ] (< 50 milisegundos)
```

---

## Conclusión

Este set integral de features trasciende por completo a Notion, FlowSavvy y Reclaim.ai. 
* **Notion** solo aporta almacenamiento de texto sin inteligencia temporal.
* **FlowSavvy** aporta la mecánica de empaquetar tareas en huecos, pero no tiene noción del cuerpo ni de los vínculos.
* **Reclaim.ai** aporta la elegancia de los hábitos elásticos y el desalojo por prioridad, pero está atrapado en la mentalidad corporativa de oficina 9-to-5.

Tu aplicación combina la **velocidad de cálculo de FlowSavvy**, la **elasticidad de hábitos de Reclaim**, y le añade la **dimensión biológica, social, urbana y climática** que exige tu vida real en Mar del Plata. Es una herramienta diseñada no para maximizar horas de trabajo ciego, sino para **armonizar tus estudios, tu trabajo, tus afectos y tu bienestar biológico sin fricción**.
