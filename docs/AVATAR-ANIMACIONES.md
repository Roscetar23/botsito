# Avatar 3D — Sistema de Animaciones

> Referencia del avatar 3D (`botcito.glb`) y sus dos sistemas de animación:
> el **clip de Blender** (baked) y los **gestos procedurales por código**.
> Complementa a [`AVATAR.md`](./AVATAR.md) (fases AV-8). Estado: **en calibración**.

---

## 1. El modelo

- Archivo: `apps/client/public/avatar/botcito.glb` (fuente en `myDesign/bot3D/botcitoCorrectoAnimaciones.glb`).
- Robot line-art con audífonos + **2 manos**, cabeza que **levita** (sin piernas).
- **Rig:** armature `Esqueleto` con 8 huesos. Mallas **emparentadas a huesos** (bone-parenting,
  `skin=None`) → mover el hueso mueve su malla hija.
- Materiales/colores incluidos (cuerpo gris, audífonos morados, ojos negros, manos azules).

### 1.1 Mapa de huesos (identificados por posición)

| Hueso (nombre fuente) | Nombre en three (saneado) | Qué es |
|---|---|---|
| `Hueso` | `Hueso` | mano en x ≈ **−3.36** |
| `Hueso.001` | `Hueso001` | mano en x ≈ **+3.27** |
| `Hueso cuerpo` | `Hueso_cuerpo` | cuerpo (raíz) |
| `Hueso cuerpo.001..003` | `Hueso_cuerpo001..003` | partes bajas de la cara/cuerpo |
| `Hueso cuerpo.004` / `.005` | `Hueso_cuerpo004/005` | arriba y simétricos → **ojos/cara** |

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

Se controlan por separado desde el panel de pruebas (modo 3D) con dos toggles:

| Toggle en la UI | Prop de `Avatar3D` | Qué anima |
|---|---|---|
| **"Animación Blender (tuya)"** | `playClip` (default true) | El clip baked `Esqueleto_acción` (manos + cara). |
| **"Gesto código (mío)"** | `gestures` (default true) | Gestos procedurales por hueso (hoy: un saludo). |

### 2.1 Clip de Blender (`Esqueleto_acción`)
- Se reproduce en bucle (`useModelAnimation.ts` + drei `useAnimations`).
- **Requisito de export (para no teletransportar):** en Blender **no muevas de sitio los huesos
  raíz** (`Hueso`, `Hueso.001`, `Hueso cuerpo`); solo rótalos. Si el clip lleva traslación en la
  raíz, al reiniciar el bucle el cuerpo salta. La versión actual ya viene corregida (solo manos+cara).

### 2.2 Gestos procedurales (`useProceduralGestures.ts`)
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
4. **Aíslalo** con los toggles del panel 3D (`playClip`/`gestures`/`gesturesLeft`) para ver solo
   lo que estás calibrando.

> Con esto **se puede construir cualquier gesto con ambas manos** (y con las partes de la cara,
> `Hueso_cuerpo004/005`). No hay hueso de cabeza separado.

---

## 4. Próximos pasos

- [x] **Saludo calibrado** (levanta la mano + vaivén) en la mano derecha.
- [x] **Segunda mano** (`Hueso`) con su botón (saludos alternados).
- [ ] **Más gestos** con la misma receta: asentir, celebrar con las dos manos, señalar, "pensar".
- [ ] **Mapear gestos/estado → `AvatarState`** (idle/speaking/happy/notify…): reutilizar la prop
      `clip?` de `Avatar3D` y/o disparar gestos según el estado. Conecta con **AV-6** (reactividad a eventos).
- [ ] (Opcional) Más Actions en Blender si se prefieren clips baked a procedural.

---

## 5. Archivos clave

- `libs/avatar/ui/src/lib/three/Avatar3D.tsx` — componente 3D (props: `size`, `fullscreen`, `roam`,
  `interactive`, `clip?`, `gestures` (mano der.), `gesturesLeft` (mano izq.), `playClip`).
- `libs/avatar/ui/src/lib/three/RobotModel.tsx` — carga GLB + `useModelAnimation` + `useWaveGesture` (×2 manos).
- `libs/avatar/ui/src/lib/three/useModelAnimation.ts` — reproduce el clip baked.
- `libs/avatar/ui/src/lib/three/useWaveGesture.ts` — **gesto de saludo reutilizable** por hueso
  (perillas calibradas aquí; se instancia por mano).
- `libs/avatar/ui/src/lib/three/RoamGroup.tsx` — perseguir el mouse + orientación de vuelo + sombra.
- `libs/avatar/ui/src/lib/three/ShadowBlob.tsx` — sombra de contacto.
- `apps/client/src/app/_components/three-controls.tsx` — los toggles (clip / gesto der. / gesto izq.).
- Agente para tocar esto: **`avatar`** (`.claude/agents/avatar.md`).

---

## 6. Log
- 2026-07-10 — Sistema documentado. Clip baked corregido (sin teletransporte) + primer gesto
  procedural (saludo) funcionando; pendiente calibrar. Toggles de aislamiento en la UI.
- 2026-07-10 — **Saludo calibrado** (levanta la mano/dedos arriba + vaivén más largo). Gesto
  refactorizado a `useWaveGesture` reutilizable e instanciado en **ambas manos** (alternadas) con
  sus toggles. Documentada la **receta** para crear cualquier gesto.
