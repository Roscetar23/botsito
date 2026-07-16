'use client';

import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ViewBoundary } from '../view-boundary';
import type { RobotTarget } from './use-robot-choreography';
import styles from './calendar.module.css';

interface CalendarRobotProps {
  target: RobotTarget;
  /** Nonce de disparo único: cada valor nuevo hace UNA vez el gesto de toque. */
  pressTrigger?: number;
}

/**
 * Cámara del robot: **teleobjetivo**. `viewport.height = 2·cameraZ·tan(fov/2)`,
 * y el robot en roam mide `ROAM_TARGET_HEIGHT = 2` unidades de mundo, así que
 * su tamaño aparente es `2 / (2·cameraZ·tan(fov/2))` del alto del canvas.
 *
 * De ahí que `fov` y `cameraZ` vayan **en pareja**: bajar el `fov` y subir
 * `cameraZ` en proporción **conserva el encuadre y el tamaño**, pero aplana la
 * perspectiva. `fov=15°`/`cameraZ=64` da `2·64·tan7.5° ≈ 16.85`, prácticamente
 * el mismo encuadre que el `fov=42°`/`cameraZ=22` anterior (`≈ 16.89`) → el
 * robot sigue ocupando ~11.8% del alto (~111px en una vista de ~940px).
 *
 * **Por qué el teleobjetivo**: el reposo está muy fuera del eje de la cámara, y
 * ahí `faceCamera` (billboard) deja un cizallamiento proyectivo residual que el
 * usuario veía como "en diagonal". Ese artefacto escala con `tan(fov/2)` — y
 * **no depende de `cameraZ`** (el ángulo fuera de eje es `atan(norm·tan(fov/2))`,
 * donde la posición en mundo y la distancia de cámara se cancelan). Al pasar de
 * `fov` 42° a 15°, cae ~2.8×: de ~5.5° a ~1.9°, ya imperceptible.
 *
 * Tamaño calibrado a ojo con el usuario (valores realmente vistos, todos con el
 * `fov=42` de entonces): `cameraZ` 9 (default de la lib) ~29% (demasiado
 * grande), 45 ~5.8% (demasiado pequeño), 28 ~9.3% (corto), 22 ~11.8%. Para
 * retocar el tamaño ahora, mueve `CAMERA_Z` y deja el `fov` quieto.
 *
 * No afecta al mapeo de `target`: la amplitud en modo `target` es `viewport/2`,
 * que escala igual, así que ±1 sigue siendo el borde del canvas.
 *
 * OJO al retocar cualquiera de los dos: R3F crea la cámara del `<Canvas>`
 * **solo al montar**, así que exigen **recarga dura** para verse — con
 * hot-reload se conserva la cámara anterior y parece que el cambio no hace nada.
 */
const CAMERA_FOV = 15;
const CAMERA_Z = 64;

/**
 * Robot 3D decorativo sobre el calendario: flota en reposo arriba, viaja a
 * la celda elegida y la "toca" (coreografía orquestada en
 * `useRobotChoreography`, fuera de esta capa). Capa `absolute` con
 * `pointer-events: none` para no robar clics a las celdas de día; aislada en
 * su propio `ViewBoundary` con fallback silencioso: un fallo del WebGL aquí
 * nunca debe tumbar el calendario ni notarse. Por encima del modal
 * (`z-index` en `calendar.module.css`) para que el robot quede visible junto
 * al día mientras el modal está abierto.
 */
export function CalendarRobot({ target, pressTrigger }: CalendarRobotProps) {
  return (
    <div className={styles.robotLayer} aria-hidden="true">
      <ViewBoundary name="El robot del calendario" fallback={null}>
        <Avatar3DLazy
          fullscreen
          roam
          walk={false}
          // El reposo está en la esquina, ~25° fuera del eje de la cámara, así
          // que sin esto se le vería el costado en vez de la cara (es
          // perspectiva, no rotación: el ángulo sale de `atan(norm·tan(fov/2))`
          // y por eso NO se arregla tocando `cameraZ`). Con `faceCamera` encara
          // siempre a cámara y el ladeo del vuelo se compone encima, así que al
          // desplazarse se sigue viendo igual de vivo.
          faceCamera
          fov={CAMERA_FOV}
          cameraZ={CAMERA_Z}
          target={target}
          pressTrigger={pressTrigger}
          state="idle"
          playClip={false}
        />
      </ViewBoundary>
    </div>
  );
}
