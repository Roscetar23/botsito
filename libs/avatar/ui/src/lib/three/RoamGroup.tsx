'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Euler, Quaternion } from 'three';
import type { Group } from 'three';
import { useFlightOrientation } from './useFlightOrientation.js';
import { usePointerViewportTarget } from './usePointerViewportTarget.js';
import { ShadowBlob } from './ShadowBlob.js';
import { RoamSpeedContext } from './roamSpeedContext.js';
import { HandBonesContext } from './handBonesContext.js';
import type { HandBones } from './handBonesContext.js';
import { HandShadows } from './HandShadows.js';

export interface RoamGroupProps {
  enabled: boolean;
  children: ReactNode;
  /**
   * Objetivo fijo, normalizado igual que el cursor (x: -1 izq. → +1 der.,
   * y: -1 arriba → +1 abajo, relativo al rect del canvas). Si viene
   * definido (no `null`/`undefined`), el ease persigue este punto en vez
   * del cursor — pensado para "ve aquí" (p.ej. una celda de calendario).
   * Sin `target`, comportamiento idéntico al de siempre (persigue el
   * cursor). No cambia nada más: mismo ease, misma `speedRef`/gestos de
   * caminar, misma orientación por vuelo — al llegar, la velocidad cae
   * sola a ~0 y el robot queda flotando quieto.
   */
  target?: { x: number; y: number } | null;
  /**
   * Con `true`, el grupo hace de "billboard": encara la cámara SIEMPRE,
   * incluso en reposo lejos del eje (ver el JSDoc de `RoamGroup` para el
   * porqué geométrico completo). El ladeo por vuelo
   * (`useFlightOrientation`) NO se pierde: se sigue aplicando encima, como
   * rotación local relativa a "de cara a ti". Default `false`
   * (comportamiento de siempre — Home/roam libre no lo pasan).
   */
  faceCamera?: boolean;
  /**
   * Velocidad del ease de posición hacia `target`/cursor (constante de
   * tiempo τ ≈ 1 / `roamEaseSpeed`, en segundos): mayor valor converge más
   * rápido, menor valor va con más lag. `undefined` (default) usa
   * `POSITION_EASE_SPEED` — comportamiento idéntico al de siempre. Pensado
   * para que el llamador ralentice, por ejemplo, el regreso al reposo del
   * calendario sin afectar al resto de desplazamientos (que siguen usando
   * el default). NO afecta al snap del primer frame activo (ver el JSDoc de
   * `RoamGroup`): ese siempre es instantáneo, sin ease de por medio.
   */
  roamEaseSpeed?: number;
}

/** Altura objetivo del modelo mientras deambula (unidades del mundo). */
const ROAM_TARGET_HEIGHT = 2;
/** Altura real del GLB (ver bounding box documentado en `RobotModel`). */
const MODEL_HEIGHT = 5.54;
const ROAM_SCALE = ROAM_TARGET_HEIGHT / MODEL_HEIGHT;

/**
 * Margen respecto al borde del viewport para que no se salga de pantalla.
 * Solo se aplica en roam **libre** (persiguiendo el cursor): el cursor puede
 * llegar exactamente a ±1 en el borde del canvas, y sin margen el modelo
 * (con su propio ancho visual) asomaría fuera. En modo `target` NO se
 * aplica — ver el JSDoc de `RoamGroup`.
 */
const EDGE_MARGIN = ROAM_TARGET_HEIGHT * 0.6;

/** Velocidad del ease hacia el cursor (bajo = va con lag, no pegado). */
const POSITION_EASE_SPEED = 1.8;

/** Velocidad de mundo (u/seg) que se considera "a tope" al normalizar 0..1. */
const SPEED_REFERENCE = 5;
/** Suavizado de la señal de velocidad (independiente del framerate). */
const SPEED_SMOOTH = 8;

const eulerScratch = new Euler();
const offsetScratch = new Quaternion();

/**
 * Deambula por todo el viewport visible del `<Canvas>` (pensado para un
 * canvas a pantalla completa): escala el modelo pequeño y persigue con un
 * lerp suave (con lag, no queda pegado) la posición del cursor **o**, si
 * el llamador pasa `target`, un punto fijo arbitrario (misma convención
 * normalizada -1..1 que el cursor) — pensado para "ve a esta celda del
 * calendario". El mapeo normalizado→mundo usa dos amplitudes distintas según
 * el modo (ver `EDGE_MARGIN` más abajo): en roam libre (persiguiendo el
 * cursor) se resta un margen para que el modelo no asome por el borde del
 * canvas cuando el cursor llega a ±1; en modo `target` se usa la amplitud
 * **completa** (sin margen), porque el llamador ya calculó `target`
 * normalizando el centro de un punto concreto (p.ej. una celda del
 * calendario) contra el rect del canvas, y espera aterrizar EXACTAMENTE ahí
 * — restar un margen comprimiría el mapeo y el robot se quedaría corto
 * (aterrizando hacia el centro, no sobre el punto pedido). El clamp del
 * normalizado a ±1 (cursor o `target`) sigue garantizando que el ease nunca
 * se pasa de los bordes; lo que cambia entre modos es **a qué distancia del
 * borde equivale ese ±1**. Encima, orienta el personaje según su
 * **desplazamiento** (`useFlightOrientation`, no según el cursor — eso
 * lo desactiva el llamador en modo roam) y añade una sombra de contacto
 * (`ShadowBlob`) que lo acompaña. La levitación (`Float`) va *dentro* de
 * este grupo, así que se suma a todo lo anterior.
 *
 * El PRIMER frame activo hace SNAP directo al target (posición fijada, sin
 * ease, `speedRef` a 0) en vez de arrancar en `(0,0,0)` y viajar hasta él —
 * así, si el llamador ya pasa un `target` fijo desde el montaje (p.ej. el
 * reposo del calendario), el robot aparece YA ahí, sin animación de entrada.
 * A partir de ese frame, ease normal — el viaje al cambiar `target` después
 * (p.ej. al clicar un día) no se toca. Con roam libre (sin `target`, p.ej.
 * la Home) esto es un no-op: el target inicial es el cursor, que arranca en
 * el centro `{x:0,y:0}` — igual que la posición inicial del grupo — así que
 * el snap centro→centro no mueve nada.
 *
 * Con `enabled=false` (incluye `prefers-reduced-motion`, decidido por el
 * llamador) el grupo queda centrado, sin rotación, a escala normal y sin
 * sombra — el comportamiento "en caja" de siempre.
 *
 * **`faceCamera` (billboard + vuelo encima):** en reposo lejos del centro
 * (p.ej. `target` en una esquina del viewport) el robot queda fuera del eje
 * de la cámara; como el ángulo fuera de eje es `atan(norm · tan(fov/2))`
 * (NO depende de `cameraZ`: la posición en mundo escala con el viewport, que
 * a su vez escala con `cameraZ`, y se cancela al dividir), con `fov=42°` y
 * un `target` típico de esquina el desvío ronda ~25° combinados — se le ve
 * de perfil, no de frente, aunque la ROTACIÓN del grupo sea ~identidad (el
 * vuelo ya decae solo en reposo). No es un problema de rotación: es
 * perspectiva. `faceCamera` corrige esto con un billboard real: cada frame,
 * `group.lookAt(camera.position)` orienta el grupo hacia la cámara desde su
 * posición actual (confirmado con el propio rig: con rotación identidad y
 * la cámara en el eje +Z se ve la cara — el mismo caso que el login,
 * `enabled=false` más abajo — así que el eje frontal del modelo es +Z local,
 * justo el que `Object3D.lookAt` en un `Group` [no cámara] orienta hacia el
 * target; confirmado también leyendo `Matrix4.lookAt`/`Object3D.lookAt` en
 * el fuente de three: para no-cámaras compone la matriz con `eye=target,
 * target=posición propia`, lo que deja el +Z local apuntando AL target —
 * justo lo que ya sabíamos por el login). Encima de ese billboard se
 * multiplica (post-multiply, rotación LOCAL relativa a "ya mirando a ti") el
 * mismo `pitch/yaw/roll` de `useFlightOrientation` que se usa sin
 * `faceCamera`, así que el ladeo al desplazarse se sigue leyendo igual, solo
 * que ahora compuesto sobre una base que siempre encara cámara en vez de
 * sobre los ejes de mundo. Sin `faceCamera`, comportamiento idéntico al de
 * siempre (rotación = solo el vuelo, sin billboard).
 */
export function RoamGroup({
  enabled,
  children,
  target,
  faceCamera = false,
  roamEaseSpeed,
}: RoamGroupProps) {
  const groupRef = useRef<Group>(null);
  const { viewport, camera } = useThree();
  const flight = useFlightOrientation();
  // Con `target` no hace falta escuchar el cursor: se desactiva el listener
  // (ver `usePointerViewportTarget`), su valor simplemente no se usa abajo.
  const pointer = usePointerViewportTarget(enabled && !target);
  /** Velocidad normalizada 0..1, compartida por contexto a los gestos hijos. */
  const speedRef = useRef(0);
  /** Huesos de mano (los puebla `RobotModel`), para las sombras de mano. */
  const handBonesRef = useRef<HandBones>({ left: null, right: null });
  /**
   * `false` hasta el primer frame activo tras (re)activarse: ese frame hace
   * SNAP directo al target en vez de ease (evita el "viaje de entrada"
   * centro→reposo). Se resetea en la rama `!enabled` para que una
   * reactivación futura vuelva a hacer snap.
   */
  const initializedRef = useRef(false);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (!enabled) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(1);
      speedRef.current = 0;
      initializedRef.current = false;
      return;
    }

    group.scale.setScalar(ROAM_SCALE);

    // Amplitud completa (sin `EDGE_MARGIN`) en modo `target`: el llamador
    // pide un punto concreto y espera aterrizar ahí, no cerca del centro
    // (ver comentario de `EDGE_MARGIN` y el JSDoc de esta función). Con
    // roam libre, resta el margen de siempre.
    const amplitudeX = target
      ? viewport.width / 2
      : Math.max(0, viewport.width / 2 - EDGE_MARGIN);
    const amplitudeY = target
      ? viewport.height / 2
      : Math.max(0, viewport.height / 2 - EDGE_MARGIN);
    // `target` (si viene) manda sobre el cursor; misma convención normalizada.
    const normX = target ? target.x : pointer.current.x;
    const normY = target ? target.y : pointer.current.y;
    const targetX = normX * amplitudeX;
    const targetY = -normY * amplitudeY;

    if (!initializedRef.current) {
      // Primer frame activo: SNAP directo, sin ease y sin pico de velocidad
      // (si no, el salto centro→target se leería como un golpe de "caminar").
      // El vuelo se deja para la llamada de más abajo: al ser la primera
      // llamada real a `flight.update` (su `previous` interno empieza en
      // `null`), esta solo guarda la posición y sale sin generar giro — no
      // hay orientación espuria por el salto (ver `useFlightOrientation`).
      initializedRef.current = true;
      group.position.set(targetX, targetY, 0);
      speedRef.current = 0;
    } else {
      // Posición previa (antes del ease) para medir el desplazamiento del frame.
      const prevX = group.position.x;
      const prevY = group.position.y;

      const easeSpeed = roamEaseSpeed ?? POSITION_EASE_SPEED;
      const t = Math.min(1, easeSpeed * delta);
      group.position.x += (targetX - group.position.x) * t;
      group.position.y += (targetY - group.position.y) * t;

      // Velocidad de mundo → normalizada 0..1 → suavizada (para los gestos hijos).
      const moved = Math.hypot(group.position.x - prevX, group.position.y - prevY);
      const instNorm = delta > 0 ? Math.min(1, moved / delta / SPEED_REFERENCE) : 0;
      const s = Math.min(1, SPEED_SMOOTH * delta);
      speedRef.current += (instNorm - speedRef.current) * s;
    }

    // El vuelo se calcula SIEMPRE (barato, y evita orientación obsoleta si
    // `faceCamera` se alternara en caliente): lo que cambia es cómo se aplica.
    flight.update(group.position.x, group.position.y, delta);
    const { pitch, yaw, roll } = flight.orientation.current;

    if (faceCamera) {
      // Billboard: +Z local del grupo apunta a la cámara desde la posición
      // YA actualizada de este frame (ver JSDoc de la función).
      group.lookAt(camera.position);
      // Vuelo como rotación LOCAL encima del billboard (post-multiply): el
      // ladeo se sigue leyendo igual, relativo a "ya de cara a ti".
      eulerScratch.set(pitch, yaw, roll);
      offsetScratch.setFromEuler(eulerScratch);
      group.quaternion.multiply(offsetScratch);
    } else {
      group.rotation.set(pitch, yaw, roll);
    }
  });

  return (
    <RoamSpeedContext.Provider value={speedRef}>
      <HandBonesContext.Provider value={handBonesRef}>
        <group ref={groupRef}>
          {children}
          {enabled ? <ShadowBlob /> : null}
          {enabled ? <HandShadows bonesRef={handBonesRef} /> : null}
        </group>
      </HandBonesContext.Provider>
    </RoamSpeedContext.Provider>
  );
}
