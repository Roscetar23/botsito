# Avatar — Plan Maestro del Personaje

> **El corazón del proyecto.** El asistente se define por su avatar: un muñeco 2D que se
> siente **"casi inteligente"** — respira, parpadea, mira, habla y reacciona con emoción.
> Este documento es la fuente de verdad del avatar; la **Fase 5** de
> [`PLAN.md`](./PLAN.md) apunta aquí y este documento tiene sus **propias fases** (AV-0…AV-6).

- **Dominio:** `libs/avatar` (`avatar-model`, `avatar-ui`)
- **Stack:** React + SVG + **Framer Motion** (ver decisión D-06 del PLAN)
- **Estado:** AV-0 (definición) — a la espera del arte del personaje
- **Regla del repo:** ≤150 líneas por archivo, Screaming Architecture, TS estricto

---

## 1. Visión

No es un icono que cambia de cara: es un **personaje con vida propia**. Aunque esté "quieto",
nunca está estático (respira, parpadea, la mirada deriva). Reacciona a lo que pasa en el
asistente (una tarea creada, un recordatorio, una respuesta del LLM) con **transiciones
suaves** entre estados emocionales. La calidad de la animación es un objetivo de primera
clase, no un adorno.

**Referencia viva (personaje de muestra):**
- `design/avatar/avatar-demo.gif` — animación completa en bucle (idle, hablar, pensar, feliz, triste, notifica).
- `design/avatar/states.png` — los estados en una sola imagen.
- `design/avatar/examples/` — cada **capa** suelta + `README.md` con el checklist de exportación.

> `design/avatar/` está en `.gitignore` (arte fuente, no versionado). El blob de muestra se
> **reemplaza** por el personaje real del usuario conservando todas las animaciones.

---

## 2. Cómo funciona: rig por capas

La técnica: el personaje se **descompone en capas separadas** (cuerpo, ojos, pupilas, cejas,
bocas). Cada capa es un elemento en el DOM/SVG que se posiciona y anima por código (como un
títere). Así podemos parpadear (intercambiar ojos), hablar (intercambiar bocas), mirar (mover
pupilas), respirar (escalar el cuerpo) y expresar emociones combinando piezas.

### 2.1 Especificación del arte (qué exportar desde Photoshop)

**Regla de oro:** cada pieza que se mueve = **un PNG con fondo transparente**, todas al
**mismo tamaño de lienzo** (ej. 1024×1024), **sin recortar** por capa (así se alinean al apilarse).

| Archivo | Qué es | Anima |
|---|---|---|
| `body` | Cuerpo/cara base **sin** ojos ni boca | respiración, rebote, inclinación |
| `eyes-open` | Ojos abiertos (blanco/forma) | despierto |
| `eyes-closed` | Ojos cerrados ("línea") | **parpadeo** |
| `pupils` | Pupilas/iris por separado | mirar / seguir el cursor |
| `brows` | Cejas (separadas) | emociones |
| `mouth-neutral` | Boca en reposo | idle |
| `mouth-open` | Boca abierta | **hablar** |
| `mouth-smile` | Sonrisa | feliz |
| `mouth-sad` | Boca triste (opcional) | triste |
| `_reference` | Personaje completo aplanado | solo referencia de estilo |

Piezas propias del personaje que se muevan (antena, orejas, cola, mechón, brillos) → cada una
en su PNG. **Mínimo viable:** `body`, `eyes-open`, `eyes-closed`, `mouth-neutral/open/smile`.
**Recomendado añadir:** `pupils` y `brows`.

Especificaciones: PNG-24 con alfa · mismo lienzo en todas · ≥1024px · nombres en minúscula.
Si puedes exportar **SVG** vectorial, mejor (más nítido); PNG por capas está perfecto.

### 2.2 Pipeline del arte

```
design/avatar/ (arte fuente, gitignoreado)
        │  optimizar (comprimir PNG / limpiar SVG)
        ▼
apps/client/public/avatar/  ó  libs/avatar/ui/src/lib/assets/   (versionado, servido por Next)
        │  el rig consume estas piezas
        ▼
<Avatar state="..." />
```

---

## 3. Arquitectura en el monorepo (`libs/avatar`)

Todo en piezas pequeñas (≤150 líneas), respetando Screaming Architecture. `scope:avatar` solo
depende de `scope:avatar` y `scope:shared`. El avatar es **presentacional**: recibe su estado
por props; no abre sockets ni conoce la lógica de negocio (eso lo conecta el front).

```
libs/avatar/model/src/lib/
  avatar-state.ts        # AvatarState (union) + metadatos de cada emoción
  avatar-event.ts        # eventos que pueden pedir un estado (opcional)

libs/avatar/ui/src/lib/
  Avatar.tsx             # contenedor: compone capas + orquesta estado
  machine/
    useAvatarMachine.ts  # máquina de estados (reducer/hook)
    transitions.ts       # reglas de transición entre estados
  behaviors/
    useBlink.ts          # parpadeo con timing aleatorio
    useBreathing.ts      # respiración (escala/deriva sutil)
    useGaze.ts           # mirada: deriva idle + seguir cursor/objetivo
  parts/                 # una capa por archivo
    Body.tsx  Eyes.tsx  Pupils.tsx  Brows.tsx  Mouth.tsx
  animation/
    variants.ts          # variantes Framer Motion por estado/emoción
    timings.ts           # constantes de duración/curvas
  assets/                # piezas del personaje (o en apps/client/public/avatar)
```

---

## 4. Catálogo de estados (contrato `AvatarState`)

Núcleo del MVP (el `avatar-model` es la fuente de verdad):

| Estado | Qué expresa | Señales visuales |
|---|---|---|
| `idle` | reposo con vida | respira, parpadea, mirada deriva |
| `speaking` | está "hablando" | boca abre/cierra + leve balanceo |
| `listening` | atento al usuario | ojos algo abiertos, leve inclinación |
| `thinking` | procesando (p. ej. LLM) | mirada arriba, una ceja, micro-pausa |
| `happy` | éxito / confirmación | sonrisa, ojos entornados |
| `sad` | error / nada que mostrar | cejas caídas, boca abajo |
| `notify` | llamar la atención | rebote + halo de color + sorpresa |

Extensible a futuro: `surprised`, `sleepy`, `celebrate`, guiño, lipsync por amplitud de audio.
Cada estado lleva metadatos (mouth, brows, gaze target, timing) para que el rig los aplique.

---

## 5. Sistema de animación

- **Micro-animaciones idle (siempre activas):** respiración (escala/deriva del `body`),
  parpadeo con timing **aleatorio**, deriva sutil de pupilas → nunca se ve "congelado".
- **Mirada:** en idle deriva sola; puede **seguir el cursor** o un objetivo (una tarea, una
  notificación). Easing suave hacia el objetivo.
- **Hablar:** alterna `mouth-open`/`mouth-neutral` (a futuro, sincronía con amplitud de audio).
- **Transiciones entre estados:** con **Framer Motion** (springs), no cortes secos.
- **Notify:** rebote de atención + halo/pulso de color.
- **Accesibilidad:** respeta `prefers-reduced-motion` (desactiva bucles), y `<Avatar>` expone
  `aria-label` según el estado.

---

## 6. Fases del Avatar (roadmap propio)

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

> **Personaje real recibido:** robot line-art con **audífonos** y **manos** (capas: body,
> headphones, brows, eyes-open/closed, mouth-neutral/talking/happy, hands). **Sin capa de
> pupilas** → la mirada por pupilas no aplica; la expresividad viene de cejas, boca, parpadeo,
> respiración/inclinación, rebote y manos. Piezas en `apps/client/public/avatar/*.png` (1024²).

### AV-0 — Definición y arte
- [x] **AV-0.1** Demo de referencia + capas de ejemplo + spec de exportación (`design/avatar/`).
- [x] **AV-0.2** Este documento y enlace desde `PLAN.md` (Fase 5).
- [x] **AV-0.3** Arte del personaje recibido (`myDesign/Bot/`) y llevado a `apps/client/public/avatar/`.

### AV-1 — Modelo del avatar
- [x] **AV-1.1** `avatar-model`: `AvatarState` (7 estados) + `AvatarExpression` + `AVATAR_EXPRESSIONS`.
- [~] **AV-1.2** `avatar-event` (opcional): se hará al conectar realtime (AV-6).

### AV-2 — Rig base (capas + montaje)
- [x] **AV-2.1** Arte real en `apps/client/public/avatar/` (servido por Next en `/avatar/*.png`).
- [x] **AV-2.2** `parts/` (Body, Headphones, Brows, Eyes, Mouth, Hands) — una capa por archivo, alineadas.
- [x] **AV-2.3** `Avatar.tsx` compone las capas en z-order y acepta `state`, `size`, `assetsBase`.

### AV-3 — Comportamientos idle (dar vida)
- [x] **AV-3.1** `useBreathing` (respiración sutil).
- [x] **AV-3.2** `useBlink` (parpadeo con timing aleatorio).
- [x] **AV-3.3** ~~`useGaze`~~ N/A (sin pupilas). Movimiento vivo vía inclinación + bob de manos.

### AV-4 — Máquina de estados y emociones
- [x] **AV-4.1** `useAvatarMachine` (combina `AVATAR_EXPRESSIONS` + blink + speaking).
- [x] **AV-4.2** `animation/variants` + `timings` con Framer Motion (transiciones spring).
- [x] **AV-4.3** `notify` (rebote + halo de acento) y "hablar" (`useSpeaking` alterna la boca).

### AV-5 — Integración en el cliente
- [x] **AV-5.1** `<Avatar>` montado en el dashboard de `apps/client`.
- [x] **AV-5.2** Panel de pruebas (`avatar-playground` + `state-buttons`) para forzar estados.

### AV-6 — Reactividad e inteligencia
- [ ] **AV-6.1** Conectar a eventos realtime (Fase 3): `notify` al recibir notificaciones.
- [ ] **AV-6.2** Reacciones a acciones (tarea creada → `happy`, error → `sad`, LLM pensando → `thinking`).
- [ ] **AV-6.3** Refinos: más emociones, guiño, (a futuro) lipsync por audio.

### AV-7 — Profundidad 3D y presencia en pantalla  *(próxima iteración — 2026-07-10)*

> **Visión:** mejorar el dibujo y llevar el avatar a una sensación **3D**, donde **la pantalla
> es su espacio** — no un muñeco pegado en una esquina, sino un personaje que **habita** la
> ventana, se mueve por ella y reacciona a ella.

- [ ] **AV-7.1** Mejorar el arte del personaje (líneas más limpias, volumen/sombreado).
- [x] **AV-7.2** **Pseudo-3D** sobre el rig actual (elegido): profundidad por capa (`translateZ`
  en `depths.ts`), inclinación 3D que sigue el cursor por toda la ventana (`useCursorTilt`, ±12°
  con spring), parallax entre capas (perspective + preserve-3d en `Rig3D.tsx`) y **sombra de
  contacto** (`Shadow.tsx`). Prop `interactive` (default true). Respeta reduced-motion.
  *(3D real con Three.js/R3F queda como opción futura si se busca más profundidad.)*
- [~] **AV-7.3** "La pantalla es su espacio": ya **sigue el cursor por toda la ventana** (semilla).
  Falta que el avatar se **desplace** por el viewport y reaccione a **scroll** y **tamaño de ventana**.
- [ ] **AV-7.4** Micro-interacciones espaciales: seguir el cursor, "asomarse", moverse hacia una
  notificación/tarea, ocupar el centro cuando "habla".

---

## 7. Decisiones del avatar (pros/cons)

- **AD-01 Rig por capas (PNG/SVG) vs una imagen** · *Pro:* permite animar piezas (parpadeo,
  hablar, mirar) conservando el arte exacto del usuario. *Con:* requiere exportar por capas.
- **AD-02 Framer Motion** · *Pro:* springs y variantes declarativas, transiciones suaves.
  *Con:* dep extra en el bundle (aceptable; es el foco del producto).
- **AD-03 Máquina de estados** · *Pro:* comportamiento predecible y expresivo, fácil de extender.
  *Con:* algo más de estructura inicial (se paga una vez).
- **AD-04 Avatar presentacional (props)** · *Pro:* desacoplado, testeable, reutilizable; el
  realtime lo conecta el front. *Con:* la "inteligencia" vive fuera del componente (correcto).

---

## 8. Cómo entregar el arte (recordatorio para el usuario)

1. Exporta las capas desde Photoshop según §2.1 (PNG transparente, mismo lienzo, sin recortar).
2. Suéltalas en `design/avatar/` **arrastrándolas al explorador del IDE** (esa carpeta está
   gitignoreada y no viaja por git; el IDE apunta a este entorno).
3. Avisa: reemplazo el blob por tu personaje y conserva todas las animaciones.

---

## 9. Log de cambios
- 2026-07-09 — Creación del plan del avatar (AV-0). Demo de referencia y spec de capas listos.
- 2026-07-10 — Arte real recibido (robot con audífonos). Rig completo: `avatar-model` +
  `avatar-ui` (parts, behaviors, machine, animation) + integración en `apps/client` con panel
  de pruebas. AV-0…AV-5 ✅. Pendiente AV-6 (reactividad a eventos, tras Fase 3).
- 2026-07-10 — Anotada la próxima iteración **AV-7**: mejorar el dibujo, profundidad 3D
  (pseudo-3D → posible Three.js/R3F) y "la pantalla es su espacio" (moverse por el viewport,
  reaccionar a cursor/scroll/ventana).
