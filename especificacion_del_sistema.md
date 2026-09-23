# Especificación del Sistema: PlanificadorDeMatu
## Optimizador de Vida y Auto-Scheduling Adaptativo Bajo Restricciones (CSP)

---

## 1. ¿Qué es la Aplicación y con qué Propósito Existe?

### 1.1 Naturaleza del Producto
**PlanificadorDeMatu** es una aplicación web progresiva (**PWA**) de auto-scheduling inteligente basada en **Satisfacción de Restricciones (CSP - Constraint Satisfaction Problem)**. A diferencia de las agendas tradicionales, opera como un **sistema operativo personal determinista** que automatiza la distribución del tiempo frente al caos de la vida cotidiana.

### 1.2 El Problema del Mundo Real
Las herramientas de productividad comerciales fallan sistemáticamente ante estilos de vida no corporativos:
1. **Google Calendar / Outlook son "lienzos mudos":** No poseen inteligencia temporal ni noción de fatiga. Si el usuario programa una cursada a las 09:00 AM tras haber cerrado un turno laboral gastronómico a la 01:00 AM, la agenda se mantiene inerte, propiciando el agotamiento biológico.
2. **Todoist / Notion / Trello son "listas de deseos sin tiempo ni espacio":** Permiten acumular decenas de tareas en días donde la disponibilidad física real es de apenas 2 o 3 horas.
3. **Motion / Reclaim.ai / FlowSavvy son "rígidos y corporativos":** Fueron diseñados para ejecutivos con jornadas de oficina fijas de 9 a 17 hs. Colapsan ante turnos rotativos nocturnos, convivencia familiar, microclimas marítimos y planes sociales espontáneos.

### 1.3 Propósito Supremo
Ser un **absorbedor matemático del caos**: cuando surge un imprevisto (un cambio de turno laboral, una salida espontánea con amigos o un temporal oceánico), el usuario no reorganiza decenas de bloques manualmente. El motor recalcula la semana completa en **menos de 50 milisegundos**, garantizando simultáneamente:
- **Descanso biológico protegido:** 8 horas ininterrumpidas de sueño tras cualquier disrupción nocturna.
- **Rendimiento universitario:** Bloques focales de concentración continua (90 a 180 min) para materias densas de ingeniería (Redes de Computadoras, Calidad de Software).
- **Recuperación física:** Intervalos fisiológicos mínimos ($\ge 2$ días) entre sesiones musculares de gimnasio (Torso vs. Piernas).
- **Vínculos sociales y finanzas:** Preservación de la bolsa social y salidas con amigos dentro del presupuesto en pesos argentinos (ARS).
- **Privacidad en el hogar:** Discreción en pantalla compartida y márgenes de descompresión antes de volver al hogar familiar.

---

## 2. ¿Qué Hace la Aplicación? (Especificación Funcional)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PLANIFICADOR DE MATU                            │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│  1. BIO-MOTOR    │   2. ACADÉMICO   │   3. DEPORTIVO   │   4. SOCIAL   │
│  Sueño dinámico  │ Metas flotantes  │ Lag inter-sesión │ Bolsa fungible│
│  8h post-arribo  │ Picos circadianos│ Torso vs Piernas │ Clima costero │
│  Veto cognitivo  │ Temporal Mardel  │ Fatiga muscular  │ Presupuesto $ │
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

### 2.1 Gestión de Pilares Rígidos (Hard Pillars)
- Soporta eventos bloqueados inamovibles (`isLocked: true`) con tolerancia cero a solapamientos ($Overlap = 0$).
- Cubre turnos rotativos laborales (ej. *Turno Sucursal Ferro* 18:00 - 01:00 AM, *Turno Casino* 14:00 - 22:00) y cursadas universitarias con control de asistencia estricto (ej. *AEEC* con tolerancia de tardanza = 0 min).

### 2.2 Anclaje Biológico Flotante Universal (Bio-Engine)
- Sintetiza proactivamente bloques de **sueño continuo de 8 horas** (`cat-sleep`).
- Si una actividad concluye en horario nocturno ($> 22:00$ o madrugada), el horario de descanso no se fija arbitrariamente, sino que **se ancla dinámicamente a la hora real de llegada a casa** sumando el tiempo de viaje en transporte público.
- Incluye **seccionamiento matemático de medianoche**: los eventos que cruzan las 00:00 hs se proyectan con continuidad gráfica entre el final del día actual y el inicio del día siguiente.

### 2.3 Metas de Estudio con Auto-Splitting (Academic Focus)
- En lugar de forzar horas rígidas, el usuario declara objetivos de carga acumulada (ej. *120 min de Redes*, *90 min de CalSoft* antes de una fecha límite).
- El algoritmo divide la cuota en bloques de concentración profunda respetando pisos de foco ($\ge 90$ min) y techos de saturación ($\le 180$ min), ubicándolos en los momentos de mayor lucidez mental.

### 2.4 Rutinas Elásticas y Descanso Inter-Sesión (Gym Split)
- Gestiona variantes de entrenamiento físico (ej. *Torso* vs. *Piernas*).
- Impone un desfase temporal obligatorio de $\ge 2$ días entre variantes del mismo grupo muscular para garantizar la síntesis de recuperación biológica.

### 2.5 Bolsa Social Fungible y Arbitraje Meteorológico
- **Bolsa Fungible:** Evalúa el tiempo compartido semanal sin rigidez por contacto individual.
- **Arbitraje de Microclima (Mar del Plata):** Conexión en vivo con el servicio meteorológico para evaluar viento, lluvia y temperatura. Si se detecta un temporal del Sudeste ($> 35\text{ km/h}$), el motor penaliza planes exteriores y prioriza el estudio bajo techo, liberando las ventanas soleadas para ocio al aire libre.

### 2.6 Botón de Pánico (Desalojo en Cascada)
- Ante una invitación espontánea de alta prioridad, el usuario pulsa un botón; el sistema aloja el nuevo plan y desaloja en cascada las tareas en conflicto, reempaquetándolas en los siguientes huecos libres sin romper compromisos rígidos ni el sueño.

### 2.7 Control Humano: Sliders y Constructor de Restricciones
- **Meta-Sliders en Vivo:** Ponderadores de prioridad (**Académico**, **Social**, **Bienestar**) con tooltips explicativos interactivos.
- **Consola de Configuración y Constructor Personalizado:** Exposición completa de las variables de decisión y un generador visual para crear nuevas restricciones (Hard o Soft) sobre variables temporales, cognitivas, espaciales o financieras.

---

## 3. ¿Cómo lo Logra Técnicamente? (Arquitectura e Implementación)

### 3.1 Principio Rector: Cero Inteligencia Artificial Externa ($0 Cost, < 50ms)
Existe la creencia errónea de que un sistema adaptable requiere un modelo de lenguaje (LLM como GPT-4 o Gemini). Para un problema combinatorio espacio-temporal, un LLM es inadecuado: introduce latencias de 2 a 4 segundos, costos por token, riesgo de alucinaciones lógicas e imposibilidad de operar sin conexión.

**PlanificadorDeMatu utiliza un motor de satisfacción de restricciones (CSP) puramente simbólico y determinista en TypeScript**, ejecutado 100% en el cliente:
- **Latencia:** $< 50$ ms en recálculo semanal completo.
- **Costo:** $0 USD de por vida.
- **Confiabilidad:** Cero alucinaciones; 100% demostrable matemáticamente.

---

### 3.2 La Cuadrícula Temporal Discreta
El tiempo semanal continuo se discretiza en una matriz de intervalos de 15 minutos:
$$\text{Slots por hora} = 4 \quad \Longrightarrow \quad \text{Slots por día} = 96 \quad \Longrightarrow \quad \text{Slots semanales} = 672$$

Cada slot $S_i$ ($i \in [0, 671]$) representa un intervalo $[t_i, t_i + 15\text{ min})$ relativo al Lunes 00:00:00 de la semana en curso.

```
Lunes 00:00                                                              Domingo 23:59
┌─────────┬─────────┬─────────┬─────────┬───────────────────┬─────────┬─────────┐
│ Slot 0  │ Slot 1  │ Slot 2  │ Slot 3  │     · · · · ·     │Slot 670 │Slot 671 │
└─────────┴─────────┴─────────┴─────────┴───────────────────┴─────────┴─────────┘
```

---

### 3.3 El Proceso de Resolución en Dos Fases

```
                         EVENTOS CANDIDATOS
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │         FASE 1: PODA BOOLEANA PURA (HARD - AC-3)       │
      │   · Solapamiento cero (HC-01)                          │
      │   · Pilares inamovibles (HC-02)                        │
      │   · Ventana de sueño inviolable (HC-03)                │
      │   · Veto cognitivo post-desgaste (HC-04)               │
      │   · Viabilidad de transporte físico (HC-05)            │
      │   · Descanso fisiológico de gimnasio (HC-06)           │
      │   · Buffer de convivencia familiar (GHC-01)            │
      └───────────────────────────┬────────────────────────────┘
                                  │ Dominios válidos reducidos
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │       FASE 2: OPTIMIZACIÓN ARITMÉTICA (SOFT SCORING)   │
      │   · Duración óptima de foco (SC-01)                    │
      │   · Protección de picos circadianos (SC-02)            │
      │   · Arbitraje climático costero (SC-03)                │
      │   · Penalización por tardanzas (SC-04)                 │
      │   · Bolsa social fungible (SC-05)                      │
      │   · Optimización de presupuesto ARS (SC-06)            │
      │   · Encadenamiento espacial de rutas (SC-07)           │
      └───────────────────────────┬────────────────────────────┘
                                  │
                                  ▼
                         AGENDA ÓPTIMA FINAL
```

#### Fase 1: Poda de Dominios con AC-3 y Forward Checking
Para cada variable flotante $X$ (ej. *Estudio Redes*), su dominio inicial $D(X)$ consiste en todos los índices de slots libres donde quepa su duración. El algoritmo **AC-3 (Arc Consistency)** poda de forma estricta todo slot que viole cualquiera de las **Hard Constraints** activas:
1. **HC-01 (No Overlap):** Ningún par de eventos puede compartir slots discretos ocupados.
2. **HC-02 (Locked Pillars):** Los eventos con `isLocked: true` son inmutables en tiempo y espacio.
3. **HC-03 (Late Night Sleep Anchor):** Si un evento concluye después de las 22:00 o de madrugada, proyecta una ventana continua de 8 horas desde la llegada al hogar que ningún evento no biológico puede invadir.
4. **HC-04 (Universal Cognitive Ban):** Veta eventos de alta demanda cognitiva (`cognitiveLoad >= 2`) en ventanas de inercia al despertar (90 min) o inmediatamente después de jornadas extenuantes (buffer de aterrizaje de 60 min).
5. **HC-05 (Travel Viability):** Exige que el tiempo libre entre eventos consecutivos en distintas sedes ($A \to B$) sea mayor o igual al tiempo de traslado en colectivo estipulado en la matriz de distancias urbanas.
6. **HC-06 (Split Lag Recovery):** Exige una distancia temporal $\ge 2$ días entre sesiones con requerimiento de descanso muscular.
7. **GHC-01 (Cannabis Buffer):** Prohíbe programar el regreso a la casa familiar antes de cumplirse el piso sobrio de recuperación acordado.

#### Fase 2: Función de Puntuación Aritmética Transparente
Cuando la poda booleana deja múltiples horarios viables, el motor desempata mediante una función de coste algebraico normalizada:

$$\text{Penalty}(Plan) = \sum_{r \in \text{SoftRules}} w_r \cdot \text{Multiplier}(\text{Category}_r) \cdot \text{Penalty}_r(Plan)$$

Donde $\text{Multiplier}$ está determinado por los **Meta-Sliders** en tiempo real:
- $\text{Multiplier}(\text{academic}) = \text{slider}_{\text{academic}} \in [0.2, 2.0]$
- $\text{Multiplier}(\text{social}) = \text{slider}_{\text{social}} \in [0.2, 2.0]$
- $\text{Multiplier}(\text{wellness}) = \text{slider}_{\text{wellness}} \in [0.2, 2.0]$

El slot que minimiza la penalización total resulta seleccionado.

---

### 3.4 Patrón de Diseño: Registry & Rule Engine Desacoplado
El sistema no hardcodea reglas dentro de los componentes de React ni en los modelos de datos. Implementa el patrón **Constraint Registry**:

```typescript
// Contrato de interfaz unificada para reglas duras
export interface HardConstraintRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  validate: (candidate: Event[], context: ConstraintContext) => HardValidationResult;
}

// Contrato de interfaz unificada para reglas blandas
export interface SoftConstraintRule {
  id: string;
  name: string;
  category: 'academic' | 'social' | 'wellness' | 'logistics';
  defaultWeight: number;
  enabled: boolean;
  evaluate: (candidate: Event[], context: ConstraintContext) => number;
}
```

**Beneficios de esta arquitectura:**
- **Modularidad total:** Agregar o modificar una regla no requiere editar el calendario ni la UI.
- **Extensibilidad en caliente:** El Constructor de Restricciones genera dinámicamente instancias de reglas que se inyectan en `constraintRegistry.registerHardRule()` o `registerSoftRule()` en tiempo de ejecución.
- **Explicabilidad sin LLMs:** Cuando una regla poda o penaliza un horario, genera una explicación estructurada en español que alimenta el visor de cambios (`DiffViewer`).

---

### 3.5 Pila Tecnológica

| Componente | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Base** | Next.js 15 (App Router) + React 19 | Arquitectura modular con renderizado híbrido y rutas API ultrarrápidas. |
| **Lenguaje** | TypeScript 5 (Strict Mode) | Tipado estricto para asegurar la inviolabilidad de contratos en el CSP. |
| **Gestor de Estado** | Zustand | Estado global reactivo con suscripciones atómicas sin re-renders innecesarios. |
| **Estilos y Diseño** | Vanilla CSS Moderno | Máximo rendimiento, glassmorphism nativo y control milimétrico de la grilla horaria. |
| **Servicio de Clima** | Open-Meteo API | Pronóstico horario con índice de confort y viento sin API key ($0 costo). |
| **Sincronización** | Offline-First Cache + Webcal | Soporte PWA sin conexión y exportación a Google Calendar vía feed iCal enmascarado. |
| **Testing** | Vitest | Suite automatizada de pruebas unitarias que evalúa el solver en $< 1$ segundo. |

---

## 4. Resumen de Flujo de Operación

```
[ Usuario interactúa con la app ]
               │
               ├─► Mueve un slider (Académico/Social/Bienestar)
               ├─► Cambia un turno laboral o agrega un plan con amigos
               ├─► Se detecta un temporal oceánico en Mar del Plata
               ├─► Pulsa el "Botón de Pánico" ante un imprevisto
               └─► Crea una nueva restricción personalizada en /settings
                               │
                               ▼
               [ scheduleStore.recalculateSchedule() ]
                               │
                               ▼
               [ solveSchedule() en scheduler.ts ]
                 1. Normalización a Lunes 00:00 (672 slots)
                 2. Síntesis de sueño biológico de 8h
                 3. Poda estricta AC-3 (Hard Constraints)
                 4. Scoring ponderado por sliders (Soft Constraints)
                               │
                               ▼
        [ Actualización instantánea en pantalla (< 50ms) ]
        - Cuadrícula continua de 24h con cortes de medianoche
        - Explicación transparente de cambios en DiffViewer
        - Sincronización en caché local para uso offline
```
