# Avatar 3D — Sistema de Animaciones

> Referencia del avatar 3D (`botcito.glb`) y sus dos sistemas de animación:
> el **clip de Blender** (baked) y los **gestos procedurales por código**.
> Complementa a [`AVATAR.md`](./AVATAR.md) (fases AV-8). Estado: **saludo (ambas manos) + parpadeo
> (ambos ojos) calibrados y confirmados ✅**.

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

## 2. Dos sistemas de animación (independientes)

Se controlan por separado desde el panel de pruebas (modo 3D) con **cinco toggles**:

| Toggle en la UI | Prop de `Avatar3D` | Qué anima |
|---|---|---|
| **"Animación Blender (tuya)"** | `playClip` (default true) | El clip baked `Esqueleto_acción` (manos + cara). |
| **"Saludo mano der."** | `gestures` (default true) | Saludo procedural en la mano derecha (`Hueso.001`). |
| **"Saludo mano izq."** | `gesturesLeft` (default true) | Saludo procedural en la mano izquierda (`Hueso`), alternado. |
| **"Parpadeo ojo izq."** | `blinkLeft` (default true) | Parpadeo procedural del ojo izquierdo (`Hueso cuerpo.003`). |
| **"Parpadeo ojo der."** | `blinkRight` (default true) | Parpadeo procedural del ojo derecho (`Hueso cuerpo.001`), sincronizado. |

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

## 4. Próximos pasos

- [x] **Saludo calibrado** (levanta la mano + vaivén) en la mano derecha.
- [x] **Segunda mano** (`Hueso`) con su botón (saludos alternados) — **confirmado por el usuario** (las mismas
      perillas sirven para ambas manos; la izquierda NO necesitó espejo).
- [x] **Parpadeo de ambos ojos** (`useBlinkGesture`, escala en Y) con sus toggles — **confirmado por el
      usuario**. Primero se apuntó por error a la ceja (`.005`); corregido al ojo real (`.003`/`.001`).
- [ ] **Más gestos** con la misma receta: cejas (sorpresa/enojo), boca (hablar/sonreír), asentir,
      celebrar con las dos manos, señalar, "pensar".
- [ ] **Mapear gestos/estado → `AvatarState`** (idle/speaking/happy/notify…): reutilizar la prop
      `clip?` de `Avatar3D` y/o disparar gestos según el estado. Conecta con **AV-6** (reactividad a eventos).
- [ ] (Opcional) Más Actions en Blender si se prefieren clips baked a procedural.

---

## 5. Archivos clave

- `libs/avatar/ui/src/lib/three/Avatar3D.tsx` — componente 3D (props: `size`, `fullscreen`, `roam`,
  `interactive`, `clip?`, `gestures` (mano der.), `gesturesLeft` (mano izq.), `blinkLeft`/`blinkRight`
  (ojos), `playClip`).
- `libs/avatar/ui/src/lib/three/RobotModel.tsx` — carga GLB + `useModelAnimation` + `useWaveGesture`
  (×2 manos) + `useBlinkGesture` (×2 ojos).
- `libs/avatar/ui/src/lib/three/useModelAnimation.ts` — reproduce el clip baked.
- `libs/avatar/ui/src/lib/three/useWaveGesture.ts` — **saludo reutilizable** por hueso (rotación;
  perillas calibradas aquí; se instancia por mano).
- `libs/avatar/ui/src/lib/three/useBlinkGesture.ts` — **parpadeo reutilizable** por hueso (escala en
  Y; perillas calibradas aquí; se instancia por ojo).
- `libs/avatar/ui/src/lib/three/RoamGroup.tsx` — perseguir el mouse + orientación de vuelo + sombra.
- `libs/avatar/ui/src/lib/three/ShadowBlob.tsx` — sombra de contacto.
- `apps/client/src/app/_components/three-controls.tsx` — los toggles (clip / saludo der.·izq. / parpadeo izq.·der.).
- Agente para tocar esto: **`avatar`** (`.claude/agents/avatar.md`).

---

## 6. Log
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
