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
- Mueve huesos por código, **encima** del clip (corre en un `useFrame` **después** del mixer;
  por eso se llama después de `useModelAnimation` en `RobotModel.tsx` — no reordenar).
- Técnica: captura el `quaternion` base del hueso una vez y, dentro de la ventana activa del gesto,
  hace `bone.quaternion.copy(base).multiply(offset)` (no acumula; se ve con el clip ON u OFF).

#### Perillas calibrables (al inicio de `useProceduralGestures.ts`)

| Constante | Qué controla | Valor actual |
|---|---|---|
| `WAVE_BONE` | Hueso que hace el gesto (nombre fuente, se sanea en código) | `'Hueso.001'` |
| `WAVE_AXIS` | Eje local de rotación (`'x' \| 'y' \| 'z'`) | `'z'` |
| `WAVE_AMPLITUDE` | Amplitud del vaivén (radianes) | `0.5` |
| `WAVE_SPEED` | Rapidez de la oscilación | `8` |
| `WAVE_PERIOD` | Cada cuántos segundos se repite | `5` |
| `WAVE_DURATION` | Duración del gesto (s, `< WAVE_PERIOD`) | `2` |

---

## 3. Estado y cómo iterar (calibración)

**Estado:** el saludo **ya se mueve** (fix del nombre). **Falta calibrar** eje/amplitud para que
parezca un saludo natural — pendiente de varias iteraciones con el usuario.

**Cómo calibrar (loop):**
1. En modo 3D, apaga "Animación Blender" y deja solo "Gesto código" para ver el saludo aislado.
2. El usuario describe: ¿mano correcta? ¿eje bien (vaivén de lado) o gira raro? ¿amplitud?
3. Ajustar las perillas de §2.2:
   - Mano equivocada → `WAVE_BONE = 'Hueso'`.
   - Gira raro → probar `WAVE_AXIS` `'x'` o `'y'`.
   - Poco/mucho → subir/bajar `WAVE_AMPLITUDE`.
4. Repetir hasta que quede natural.

---

## 4. Próximos pasos

- [ ] **Calibrar el saludo** (`wave`) — eje/amplitud/velocidad.
- [ ] **Más gestos** con la misma técnica: asentir, celebrar con las dos manos (`Hueso` + `Hueso001`),
      señalar, "pensar". (Recordar: no hay hueso de cabeza separado; la cara son `Hueso_cuerpo004/005`.)
- [ ] **Mapear gestos/estado → `AvatarState`** (idle/speaking/happy/notify…): reutilizar la prop
      `clip?` de `Avatar3D` y/o disparar gestos según el estado. Conecta con **AV-6** (reactividad a eventos).
- [ ] (Opcional) Más Actions en Blender si se prefieren clips baked a procedural.

---

## 5. Archivos clave

- `libs/avatar/ui/src/lib/three/Avatar3D.tsx` — componente 3D (props: `size`, `fullscreen`, `roam`,
  `interactive`, `clip?`, `gestures`, `playClip`).
- `libs/avatar/ui/src/lib/three/RobotModel.tsx` — carga GLB + `useModelAnimation` + `useProceduralGestures`.
- `libs/avatar/ui/src/lib/three/useModelAnimation.ts` — reproduce el clip baked.
- `libs/avatar/ui/src/lib/three/useProceduralGestures.ts` — gestos por hueso (perillas aquí).
- `libs/avatar/ui/src/lib/three/RoamGroup.tsx` — perseguir el mouse + orientación de vuelo + sombra.
- `libs/avatar/ui/src/lib/three/ShadowBlob.tsx` — sombra de contacto.
- `apps/client/src/app/_components/three-controls.tsx` — los dos toggles (clip vs gesto).
- Agente para tocar esto: **`avatar`** (`.claude/agents/avatar.md`).

---

## 6. Log
- 2026-07-10 — Sistema documentado. Clip baked corregido (sin teletransporte) + primer gesto
  procedural (saludo) funcionando; pendiente calibrar. Toggles de aislamiento en la UI.
