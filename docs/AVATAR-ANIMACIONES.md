# Avatar 3D — Sistema de Animaciones

> Referencia del avatar 3D (`botcito.glb`) y sus dos sistemas de animación:
> el **clip de Blender** (baked) y los **gestos procedurales por código**.
> Complementa a [`AVATAR.md`](./AVATAR.md) (fases AV-8).
>
> **Estado: personaje TERMINADO ✅** (con posibles mejoras a futuro — ver §7). Vocabulario completo
> de gestos (manos, ojos, cejas, boca), **emociones** que los combinan solas (`AvatarState`),
> **caminado** con balanceo de manos según la velocidad y **sombras** de cuerpo y manos. Todo
> calibrado y confirmado por el usuario, modular (hooks reutilizables, archivos <150 líneas) y en
> verde (lint/typecheck/test/build).

---

## 1. El modelo

- Archivo: `apps/client/public/avatar/botcito.glb` (fuente en `myDesign/bot3D/botcitoCorrectoAnimaciones.glb`).
- Robot line-art con audífonos + **2 manos**, cabeza que **levita** (sin piernas).
- **Rig:** armature `Esqueleto` con 8 huesos. Mallas **emparentadas a huesos** (bone-parenting,
  `skin=None`) → mover el hueso mueve su malla hija.
- Materiales/colores incluidos (cuerpo gris, audífonos morados, ojos negros, manos azules).

### 1.1 Mapa de huesos (identificados midiendo la geometría en espacio mundial)

Convención de lados: **x positiva = derecha**, **x negativa = izquierda** (igual que las manos).
Los rasgos de la cara son 5 planos; se identificaron por su posición mundial y su forma
(ancho×alto), no adivinando — `.004/.005` **resultaron ser las cejas, no los ojos**.

| Hueso (nombre fuente) | Nombre en three | Qué es | Mundo (x, y) · forma |
|---|---|---|---|
| `Hueso` | `Hueso` | **mano izq.** | x ≈ −3.36 |
| `Hueso.001` | `Hueso001` | **mano der.** | x ≈ +3.27 |
| `Hueso cuerpo` | `Hueso_cuerpo` | cuerpo (raíz) | (0,0,0) |
| `Hueso cuerpo.005` | `Hueso_cuerpo005` | **ceja izq.** | (−0.82, +0.90) · ancha |
| `Hueso cuerpo.004` | `Hueso_cuerpo004` | **ceja der.** | (+0.72, +0.88) · ancha |
| `Hueso cuerpo.003` | `Hueso_cuerpo003` | **ojo izq.** | (−0.54, −0.41) · alto vertical (0.44×1.20) |
| `Hueso cuerpo.001` | `Hueso_cuerpo001` | **ojo der.** | (+0.38, −0.36) · alto vertical (0.44×1.20) |
| `Hueso cuerpo.002` | `Hueso_cuerpo002` | **boca** (rasgo suelto) | (+1.35, −0.63) · pequeño |

> Truco de identificación (sin navegador): parsear el GLB y componer la cadena de nodos para
> sacar la **posición y el bounding box en mundo** de cada malla (script ad-hoc en Python). Los
> **ojos** son el par simétrico del medio con forma **vertical alta**; las **cejas** el par de arriba.

### 1.2 ⚠️ GOTCHA: three renombra los huesos
`GLTFLoader.createUniqueName → PropertyBinding.sanitizeNodeName` aplica:
```
name.replace(/\s/g, '_').replace(/[[\].:/]/g, '')
```
Es decir: **espacios → `_`**, y **se eliminan** `. : / [ ]`. Por eso `Hueso.001` dentro de
three es **`Hueso001`**, y `Hueso cuerpo` es `Hueso_cuerpo`. **Siempre usar el nombre saneado**
en `getObjectByName` (o sanear en código). Esto causó el bug "no se mueve nada" (fix en `e0bfc3d`).

---

## 2. Cómo se controla (panel de pruebas, modo 3D)

El panel tiene dos **modos de control** (switch en la UI):

- **Emociones** (por defecto; el 3D **abre en `idle`/Reposo**): eliges un `AvatarState` y el muñeco
  **se expresa solo** combinando los gestos — ver §4. Es la forma "de verdad".
- **Manual (calibrar)**: toggles por gesto, **todos arrancan en OFF**, para aislar y calibrar cada
  uno. Cada toggle mapea a una prop de `Avatar3D`:

| Toggle en la UI | Prop de `Avatar3D` | Qué anima |
|---|---|---|
| **"Animación Blender (tuya)"** | `playClip` | El clip baked `Esqueleto_acción` (manos + cara). |
| **"Saludo mano der." / "izq."** | `gestures` / `gesturesLeft` | Saludo en la mano der. (`Hueso.001`) / izq. (`Hueso`), alternado. |
| **"Parpadeo ojo izq." / "der."** | `blinkLeft` / `blinkRight` | Parpadeo del ojo izq. (`Hueso cuerpo.003`) / der. (`Hueso cuerpo.001`), a la vez. |
| **"Ceja izq." / "der."** | `eyebrowLeft` / `eyebrowRight` | Levantar la ceja izq. (`Hueso cuerpo.005`) / der. (`Hueso cuerpo.004`) → sorpresa. |
| **"Inclinar cejas"** | `eyebrowTilt` | Inclina ambas cejas adentro→afuera. |
| **"Fruncir (enojo)"** | `eyebrowAngry` | Inclina ambas cejas afuera→adentro → enojo. |
| **"Boca (hablar)"** | `mouth` | Abre/cierra la boca en ráfagas (`Hueso cuerpo.002`). |

Además, dos comportamientos **no son toggles** sino automáticos: el **caminado** (`walk`, balanceo
de manos según la velocidad de roam — §5) y las **sombras** de cuerpo y manos (§6).

### 2.1 Clip de Blender (`Esqueleto_acción`)
- Se reproduce en bucle (`useModelAnimation.ts` + drei `useAnimations`).
- **Requisito de export (para no teletransportar):** en Blender **no muevas de sitio los huesos
  raíz** (`Hueso`, `Hueso.001`, `Hueso cuerpo`); solo rótalos. Si el clip lleva traslación en la
  raíz, al reiniciar el bucle el cuerpo salta. La versión actual ya viene corregida (solo manos+cara).

### 2.2 Saludo con la mano (`useWaveGesture.ts`)
- Hook reutilizable **`useWaveGesture(groupRef, boneName, enabled, phaseOffset=0)`**: mueve un
  hueso por código, **encima** del clip (corre en un `useFrame` **después** del mixer; por eso se
  llama después de `useModelAnimation` en `RobotModel.tsx` — no reordenar).
- **Técnica del saludo (calibrada y funcionando):**
  1. **Saneo del nombre** del hueso (three lo renombra al cargar — ver §1.2).
  2. **Captura la pose base** una vez (quaternion **y** position del hueso).
  3. Dentro de la ventana activa del gesto:
     - **Rotación:** `bone.quaternion = base.quat · offset`, donde `offset` = giro en `WAVE_AXIS`
       de `envelope · (WAVE_LIFT_ANGLE + WAVE_AMPLITUDE·sin(t·WAVE_SPEED))`. El `WAVE_LIFT_ANGLE`
       (≈π) **levanta la mano (dedos arriba)** y el resto es el vaivén del saludo.
     - **Traslación:** sube la mano completa: `bone.position[WAVE_RAISE_AXIS] += envelope · WAVE_RAISE_AMOUNT`.
     - **Envolvente** `sin((phase/DURATION)·π)` (0→1→0): la mano sube, saluda y baja suave.
  4. Fuera de la ventana no toca el hueso (el clip manda el resto del tiempo).
- **Dos manos:** el hook se instancia dos veces en `RobotModel` — derecha (`Hueso.001`, phase 0) e
  izquierda (`Hueso`, phase `WAVE_PERIOD/2`, para que **alternen**), con toggles `gestures`/`gesturesLeft`.

#### Perillas calibradas (defaults de módulo en `useWaveGesture.ts`)

| Constante | Qué controla | Valor |
|---|---|---|
| `WAVE_AXIS` | Eje local de rotación del saludo | `'z'` |
| `WAVE_LIFT_ANGLE` | Giro base que **levanta la mano** (dedos arriba) | `Math.PI` |
| `WAVE_AMPLITUDE` | Amplitud del vaivén (rad) | `0.5` |
| `WAVE_SPEED` | Rapidez de la oscilación | `8` |
| `WAVE_PERIOD` | Cada cuántos segundos se repite | `7` |
| `WAVE_DURATION` | Duración del saludo (s, `< WAVE_PERIOD`) | `3.4` |
| `WAVE_RAISE_AXIS` | Eje por el que sube la mano completa | `'y'` |
| `WAVE_RAISE_AMOUNT` | Cuánto sube (unidades locales) | `1` |

> El hueso ya NO es una constante: se pasa por parámetro (`boneName`) → cualquier hueso puede gesticular.

### 2.3 Parpadeo de los ojos (`useBlinkGesture.ts`)
Misma filosofía que el saludo, pero **por escala** en vez de rotación (el ojo es un plano
emparentado a un hueso; aplastar el hueso en vertical cierra el párpado).
- Hook reutilizable **`useBlinkGesture(groupRef, boneName, enabled, phaseOffset=0)`**.
- **Técnica (calibrada y confirmada):**
  1. **Saneo del nombre** del hueso (§1.2) y **captura la escala base** una vez.
  2. En la ventana activa: `escala[BLINK_AXIS] = base · (1 − BLINK_CLOSE · envelope)`, con la misma
     **envolvente** `sin((phase/DURATION)·π)` (0→1→0): el ojo se cierra y se vuelve a abrir.
  3. Fuera de la ventana no toca el hueso (el clip manda el resto del tiempo).
- **Por qué `BLINK_AXIS='y'` funciona:** el hueso del ojo (`Hueso cuerpo.003`) está casi alineado
  al mundo, así que escalar su Y ≈ escalar la vertical del mundo; y como el pivote del hueso queda
  cerca de la parte baja del ojo, **se cierra como un párpado que baja**. (Se verificó midiendo el
  bounding box en mundo — ver §1.1; el ojo mide 0.44 ancho × **1.20 alto**.)
- **Dos ojos:** el hook se instancia dos veces en `RobotModel` — izq. (`Hueso cuerpo.003`) y der.
  (`Hueso cuerpo.001`), **ambos con `phaseOffset=0`** para que parpadeen **a la vez** (natural).
  Toggles `blinkLeft`/`blinkRight`.

#### Perillas calibradas (defaults de módulo en `useBlinkGesture.ts`)

| Constante | Qué controla | Valor |
|---|---|---|
| `BLINK_AXIS` | Eje local por el que se aplasta el ojo (vertical) | `'y'` |
| `BLINK_CLOSE` | Cuánto cierra (0..1; 0.9 = casi todo) | `0.9` |
| `BLINK_DURATION` | Duración de un parpadeo (s, rápido) | `0.18` |
| `BLINK_PERIOD` | Cada cuántos segundos parpadea | `4` |

> Para **desincronizar** los ojos (un guiño/tic), basta con un `phaseOffset` distinto en un ojo.

### 2.4 Cejas (`useEyebrowGesture.ts`) — levantar + inclinar/fruncir
Hook con **dos efectos independientes** por instancia (`{ raise, tilt, tiltAngle, ... }`), uno por
ceja (`Hueso cuerpo.005` izq., `.004` der.):
- **Levantar** (`raise`): sube la ceja por **posición**. Como el hueso padre (`Hueso cuerpo`) es
  identidad, `bone.position.y` equivale a subir en el mundo. → sorpresa.
- **Inclinar/fruncir** (`tilt`): gira la ceja por **rotación**, con `tiltAngle` de **signo opuesto por
  ceja** (están dibujadas en espejo). Se ofrecen las dos direcciones: adentro→afuera (`eyebrowTilt`)
  y afuera→adentro = enojo (`eyebrowAngry`); es el mismo giro con signo invertido, y en `RobotModel`
  se combinan en un solo ángulo (si se activan ambas, se cancelan).
- ⚠️ **La inclinación se aplica con `premultiply`** (giro en el frame del **padre/mundo**), NO en el
  eje local: la ceja izquierda tiene su hueso más inclinado fuera del plano y, en local, se
  **escorzaba/"contraía"** al girar. En el frame del mundo ambas rotan igual dentro del plano.

### 2.5 Boca hablando (`useMouthGesture.ts`)
Por **escala** (la boca es un rectángulo plano de 4 vértices; una sonrisa *curvada* real no es
posible con un plano + un hueso — haría falta una shape key en Blender).
- **Hablar:** abre/cierra en ráfagas escalando el hueso en `MOUTH_OPEN_AXIS='x'` (medido: escalar
  X ⇒ alto en mundo ×2.9 sin tocar el ancho). Envolvente de ráfaga × oscilación de flaps; restaura
  la escala base fuera de la ventana.
- Calibrado suave: `MOUTH_OPEN_AMOUNT=0.7` (el pivote está descentrado; abrir mucho subía la boca) y
  `MOUTH_SPEED=7`.

---

## 3. Receta: cómo crear un gesto nuevo (con cualquier hueso/mano)

El saludo ya está **calibrado y funcionando** en ambas manos. Para un gesto nuevo, la técnica es
la misma; esto es lo que aprendimos:

1. **Identifica el hueso** en el mapa (§1.1) y recuerda el **saneo de nombre** (§1.2): pasa el
   nombre fuente (ej. `'Hueso.001'`) y sanea en código.
2. **Reutiliza `useWaveGesture`** para saludos con otra mano/tiempo (ya se hace con las dos manos),
   o **clona la técnica** en un hook nuevo para otro movimiento (asentir, celebrar, señalar):
   - Captura la **pose base** (quaternion + position) una vez.
   - En la ventana activa: `bone.quaternion = base · offset` y/o `bone.position = base + delta`,
     todo escalado por una **envolvente** 0→1→0 para que entre y salga suave.
   - Corre en `useFrame` **después** de `useModelAnimation` (tras el mixer).
3. **Calibra con el usuario** (no hay navegador aquí): él lo ve en su Mac y describe; se ajustan
   los ejes/ángulos/amplitudes (que están como constantes al inicio del hook). Reglas rápidas:
   - Mano/parte equivocada → cambia el `boneName`.
   - Gira/mueve raro → prueba otro eje (`'x'/'y'/'z'`) o **invierte el signo**.
   - Poco/mucho → sube/baja amplitud o `RAISE_AMOUNT`.
4. **Aíslalo** con los toggles del panel 3D (`playClip`/`gestures`/`gesturesLeft`/`blinkLeft`/
   `blinkRight`) para ver solo lo que estás calibrando.

> Con esto **se puede construir cualquier gesto** con las manos (`Hueso`/`Hueso.001`), los ojos
> (`Hueso cuerpo.003`/`.001`), las cejas (`Hueso cuerpo.005`/`.004`) o la boca (`Hueso cuerpo.002`).
> No hay hueso de cabeza separado. Para rasgos-plano (ojos/cejas/boca) suele funcionar mejor la
> **escala** (como el parpadeo, §2.3); para las manos, la **rotación** (como el saludo, §2.2).

---

## 4. Emociones → gestos (`stateGestures.ts`)

El muñeco **se expresa solo** al recibir un `AvatarState`. `gesturesForState(state)` es la fuente
de verdad: devuelve qué banderas de gesto enciende cada emoción. `Avatar3D` acepta `state?`; si se
pasa, deriva los gestos y **anula** los toggles manuales.

| Estado | Gestos que combina |
|---|---|
| `idle` (Reposo) | Parpadeo (+ caminado si se mueve) |
| `listening` (Escuchando) | Parpadeo + cejas arriba |
| `speaking` (Hablando) | Parpadeo + boca |
| `thinking` (Pensando) | Parpadeo + cejas inclinadas |
| `happy` (Feliz) | Parpadeo + cejas arriba + **saludo con ambas manos** |
| `sad` (Triste) | Parpadeo + cejas fruncidas/caídas |
| `notify` (Notificación) | Parpadeo + cejas arriba + saludo + boca |

> El vocabulario de gestos es limitado, así que algunas emociones se **aproximan** (p. ej. `sad`
> reutiliza el fruncido; `thinking` usa la inclinación). Pendiente: conectar `state` a **eventos
> reales** (asistente hablando → `speaking`, notificación → `notify`).

## 5. Caminado — balanceo de manos (`useWalkSwing.ts` + `roamSpeedContext.ts`)

Cuando el muñeco deambula (roam) y se mueve, las manos **columpian adelante/atrás** (eje `z`),
**alternadas** (fase π, como los brazos al andar) y con **amplitud proporcional a la velocidad**:

- `RoamGroup` mide su velocidad de desplazamiento, la normaliza 0..1 y la comparte por **contexto**
  (un ref, sin re-render). `useWalkSwing` la lee y columpia cada mano.
- **Quieto → manos quietas** (deja el saludo/reposo). Usa `smoothstep` para volver a la base sin
  residuo al frenar. Corre **después** del saludo para tener prioridad en las manos en movimiento.
- Va en **todos los estados MENOS `happy` y `notify`** (esos ya saludan con las manos). Se apaga en
  modo "caja" (sin roam no hay velocidad) y con `prefers-reduced-motion`. Calmado: `WALK_SPEED=5`.

## 6. Sombras (`ShadowBlob.tsx` + `HandShadows.tsx`)

Solo en modo roam (dan sensación de peso, no de brillo):
- **`ShadowBlob`**: elipse de contacto bajo el cuerpo (dos capas concéntricas), pegada al suelo.
- **`HandShadows`**: una elipse tenue bajo **cada mano** que la **sigue** (útil al caminar): proyecta
  la posición mundial de cada hueso de mano al suelo cada frame. Los huesos llegan desde `RobotModel`
  hasta `RoamGroup` (donde vive la sombra, fuera del `Float`) por contexto (`handBonesContext`).

---

## 7. Posibles mejoras a futuro

El personaje está **terminado y funcional**. Ideas si algún día se retoma:

- [ ] **Conectar `state` a eventos reales** (asistente hablando → `speaking`, notificación → `notify`,
      escuchando micro → `listening`). Es el gran paso pendiente (AV-6 en [`AVATAR.md`](./AVATAR.md)).
- [ ] **Emociones más ricas**: `sad`/`thinking` hoy se aproximan con el vocabulario existente;
      podrían tener gestos propios (p. ej. mirar hacia un lado, "cabeza" ladeada).
- [ ] **Sonrisa real**: hoy no se hace (rectángulo plano). Requiere una **shape key** de sonrisa (o
      malla de boca curva) en Blender; luego se anima igual que el resto.
- [ ] **Más gestos** con la misma receta: asentir/negar (cara), señalar, celebrar, "pensar".
- [ ] **Transiciones** suaves entre emociones (hoy el cambio de banderas es inmediato).
- [ ] (Opcional) Micro-bob del cuerpo al caminar; modular boca/cejas por la velocidad.

---

## 8. Archivos clave

Gestos por hueso (reutilizables; perillas calibradas al inicio de cada archivo):
- `useWaveGesture.ts` — **saludo** (rotación; ×2 manos).
- `useBlinkGesture.ts` — **parpadeo** (escala; ×2 ojos).
- `useEyebrowGesture.ts` — **cejas** levantar/inclinar/fruncir (posición + rotación; ×2 cejas).
- `useMouthGesture.ts` — **boca hablando** (escala).
- `useWalkSwing.ts` — **balanceo al caminar** (posición, según velocidad).

Orquestación y escena:
- `Avatar3D.tsx` — componente público (props: `state?`, `size`, `fullscreen`, `roam`, `interactive`,
  `clip?`, banderas de gesto manuales, `walk`, `playClip`).
- `RobotModel.tsx` — carga GLB + `useModelAnimation` + instancia todos los gestos; publica los huesos
  de mano por contexto para las sombras.
- `stateGestures.ts` — mapeo **emoción → gestos** (`gesturesForState`).
- `RoamGroup.tsx` — deambular/perseguir el mouse + orientación de vuelo + velocidad (contexto) + sombras.
- `roamSpeedContext.ts` / `handBonesContext.ts` — refs compartidos (velocidad / huesos de mano).
- `ShadowBlob.tsx` / `HandShadows.tsx` — sombras de cuerpo / de manos.
- `useModelAnimation.ts` — reproduce el clip baked.
- `apps/client/src/app/_components/three-controls.tsx` + `avatar-playground.tsx` — panel (Emociones/Manual).
- Agente para tocar esto: **`avatar`** (`.claude/agents/avatar.md`).

---

## 9. Log
- 2026-07-10 — Sistema documentado. Clip baked corregido (sin teletransporte) + primer gesto
  procedural (saludo) funcionando; pendiente calibrar. Toggles de aislamiento en la UI.
- 2026-07-10 — **Saludo calibrado** (levanta la mano/dedos arriba + vaivén más largo). Gesto
  refactorizado a `useWaveGesture` reutilizable e instanciado en **ambas manos** (alternadas) con
  sus toggles. Documentada la **receta** para crear cualquier gesto.
- 2026-07-11 — **Saludo en ambas manos confirmado por el usuario** ("quedó perfecto"). La mano
  izquierda funciona con las mismas perillas (sin espejo). Sistema de gestos procedurales **estable**.
- 2026-07-11 — **Parpadeo de ambos ojos** (`useBlinkGesture`, escala en Y). Se corrigió el mapa de
  la cara midiendo el bounding box en mundo: `.004/.005` son **cejas**, los ojos son `.003` (izq.) y
  `.001` (der.). Hook reutilizable instanciado por ojo (parpadean a la vez), con sus toggles.
  Confirmado por el usuario ("quedó perfecto").
- 2026-07-12 — **Cejas** (`useEyebrowGesture`): levantar + inclinar/fruncir (dos direcciones), con fix
  de escorzado de la ceja izq. (giro en frame del mundo, `premultiply`). **Boca hablando**
  (`useMouthGesture`, escala en X). Confirmados por el usuario.
- 2026-07-12 — **Emociones** (`stateGestures.ts` + `Avatar3D` prop `state`): cada `AvatarState` combina
  gestos; el 3D abre en `idle`, modo manual todo en OFF. **Caminado** (`useWalkSwing` +
  `roamSpeedContext`): balanceo de manos según velocidad, en todos los estados menos `happy`/`notify`.
  **Sombras de mano** (`HandShadows` + `handBonesContext`) que siguen a cada mano.
- 2026-07-12 — **Personaje TERMINADO** ✅. Cierre de la tarea; mejoras a futuro en §7.
