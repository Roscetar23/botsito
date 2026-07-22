'use client';

import { Avatar3DLazy } from '../avatar-3d-lazy';
import { ViewBoundary } from '../view-boundary';
import type { PressHand, RobotTarget } from './use-robot-choreography';
import { useReminderNotifyState } from './use-reminder-notify';
import styles from './calendar.module.css';

interface CalendarRobotProps {
  target: RobotTarget;
  /** Nonce de disparo único: cada valor nuevo hace UNA vez el gesto de toque. */
  pressTrigger?: number;
  /** Lado de la pantalla con el que toca (lado del día elegido). */
  pressHand?: PressHand;
  /** Velocidad del ease del roam; `undefined` = normal. Lenta solo al volver al reposo. */
  easeSpeed?: number;
}

/**
 * Cámara del robot: **teleobjetivo**. `viewport.height = 2·cameraZ·tan(fov/2)`,
 * y el robot en roam mide `ROAM_TARGET_HEIGHT = 2` unidades de mundo, así que
 * su tamaño aparente es `2 / (2·cameraZ·tan(fov/2))` del alto del canvas.
 *
 * De ahí que `fov` y `cameraZ` vayan **en pareja**: bajar el `fov` y subir
 * `cameraZ` en proporción **conserva el encuadre y el tamaño**, pero aplana la
 * perspectiva. Así se llegó aquí: `fov=15°`/`cameraZ=64` daba `2·64·tan7.5° ≈
 * 16.85`, prácticamente el mismo encuadre que el `fov=42°`/`cameraZ=22` de
 * antes (`≈ 16.89`) — misma escala, sin el ladeo.
 *
 * **Por qué el teleobjetivo**: el reposo está muy fuera del eje de la cámara, y
 * ahí `faceCamera` (billboard) deja un cizallamiento proyectivo residual que el
 * usuario veía como "en diagonal". Ese artefacto escala con `tan(fov/2)` — y
 * **no depende de `cameraZ`** (el ángulo fuera de eje es `atan(norm·tan(fov/2))`,
 * donde la posición en mundo y la distancia de cámara se cancelan). Al pasar de
 * `fov` 42° a 15°, cae ~2.8×: de ~5.5° a ~1.9°, ya imperceptible.
 *
 * Tamaño calibrado a ojo con el usuario (valores realmente vistos). Con el
 * `fov=42` de entonces: `cameraZ` 9 (default de la lib) ~29% (demasiado
 * grande), 45 ~5.8% (demasiado pequeño), 28 ~9.3% (corto). Ya con `fov=15`:
 * 64 ~11.9% (aún corto), **52 ~14.6%**.
 *
 * Para retocar el tamaño, mueve **solo `CAMERA_Z`** y deja el `fov` quieto: el
 * ladeo depende del `fov` y de la posición, no de la distancia, así que
 * agrandar por aquí no lo trae de vuelta.
 *
 * Techo práctico: el reposo está en `y=-0.92`, o sea a ~4% del borde superior
 * del canvas, y `.robotLayer` recorta (`overflow:hidden`). Cuanto más grande,
 * antes le corta la coronilla — si pasa, baja un poco el `y` de `REST_TARGET`.
 *
 * No afecta al mapeo de `target`: la amplitud en modo `target` es `viewport/2`,
 * que escala igual, así que ±1 sigue siendo el borde del canvas.
 *
 * OJO al retocar cualquiera de los dos: R3F crea la cámara del `<Canvas>`
 * **solo al montar**, así que exigen **recarga dura** para verse — con
 * hot-reload se conserva la cámara anterior y parece que el cambio no hace nada.
 */
const CAMERA_FOV = 15;
const CAMERA_Z = 52;

/**
 * Robot 3D decorativo sobre el calendario: flota en reposo arriba, viaja a
 * la celda elegida y la "toca" (coreografía orquestada en
 * `useRobotChoreography`, fuera de esta capa). Capa `absolute` con
 * `pointer-events: none` para no robar clics a las celdas de día; aislada en
 * su propio `ViewBoundary` con fallback silencioso: un fallo del WebGL aquí
 * nunca debe tumbar el calendario ni notarse. Por encima del modal
 * (`z-index` en `calendar.module.css`) para que el robot quede visible junto
 * al día mientras el modal está abierto. Además reacciona en tiempo real:
 * `useReminderNotifyState` pasa a `state="notify"` ~3s cuando llega un
 * `'reminder'` por el socket (`RealtimeProvider`) y vuelve a `"idle"`; no
 * interfiere con `target`/`pressTrigger` (la coreografía de viaje/toque).
 */
export function CalendarRobot({ target, pressTrigger, pressHand, easeSpeed }: CalendarRobotProps) {
  const notifyState = useReminderNotifyState();

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
          pressHand={pressHand}
          roamEaseSpeed={easeSpeed}
          state={notifyState}
          playClip={false}
        />
      </ViewBoundary>
    </div>
  );
}
