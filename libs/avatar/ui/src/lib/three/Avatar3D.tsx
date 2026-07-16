'use client';

import { Suspense, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import type { Group } from 'three';
import type { AvatarState } from '@asistente/avatar-model';
import { RobotModel } from './RobotModel.js';
import { usePointerRotation } from './usePointerRotation.js';
import { RoamGroup } from './RoamGroup.js';
import { gesturesForState } from './stateGestures.js';
import type { RobotGestureFlags } from './stateGestures.js';

export interface Avatar3DProps {
  size?: number;
  assetUrl?: string;
  /**
   * Distancia de la cámara (eje Z). Mayor = más lejos = el modelo se ve más
   * pequeño con **más margen** (útil en modo caja para que no se corten las
   * manos). Default 9.
   */
  cameraZ?: number;
  /**
   * Emoción/estado a expresar. Si se pasa, los gestos se derivan de él
   * (`gesturesForState`) y **anulan** las banderas individuales de gestos —
   * el muñeco se expresa solo. Sin `state`, mandan las banderas manuales
   * (útil para calibrar). No afecta a `playClip` (clip baked).
   */
  state?: AvatarState;
  /** Rotación 3D que sigue al cursor por toda la ventana. Activada por defecto. */
  interactive?: boolean;
  /** El `<div>` raíz ocupa 100% del contenedor en vez del cuadro `size`. */
  fullscreen?: boolean;
  /** Deambula (solo posición) por todo el viewport visible del canvas. */
  roam?: boolean;
  /**
   * Destino fijo para el modo `roam`, normalizado igual que el cursor
   * (x: -1 izq. → +1 der., y: -1 arriba → +1 abajo, relativo al rect del
   * canvas). Con `target` definido, `RoamGroup` viaja hacia ese punto en
   * vez de perseguir el cursor (p.ej. "ve a esta celda del calendario");
   * `null`/`undefined` (default) mantiene el comportamiento de siempre.
   * `roam` sigue siendo la puerta del modo (escala + sombra + movimiento);
   * `target` solo cambia el destino, no la mecánica.
   */
  target?: { x: number; y: number } | null;
  /**
   * Con `true`, el robot hace de "billboard": encara la cámara SIEMPRE en
   * modo `roam`, incluso en reposo lejos del centro del viewport (donde,
   * por perspectiva, se le ve de perfil aunque su rotación sea ~identidad —
   * ver el JSDoc de `RoamGroup` para el análisis geométrico completo). El
   * ladeo al desplazarse (`useFlightOrientation`) NO se pierde: se sigue
   * aplicando encima, como giro local relativo a "ya de cara a ti". Solo
   * afecta a la ROTACIÓN del grupo; la posición sigue igual (ease,
   * `speedRef`, sombras, escala de roam). Nota: el `<Float>` interno sigue
   * con su leve `rotationIntensity` propio (vida ambiental) encima de
   * esto — se le sigue viendo la cara, pero no es una rotación
   * perfectamente estática; avisar si eso llegara a molestar. Default
   * `false` (comportamiento de siempre — la Home/roam libre no lo pasan y
   * queda intacta).
   */
  faceCamera?: boolean;
  /**
   * Clip del GLB a reproducir (por nombre exacto). Sin especificar, se
   * reproduce el primero disponible (`Esqueleto_acción`). Preparado para
   * un futuro mapeo `AvatarState → clip`; hoy nadie lo pasa.
   */
  clip?: string;
  /**
   * Gesto de saludo procedural en la mano derecha (`Hueso.001`), encima
   * de la animación baked. Activado por defecto; se apaga solo con
   * `prefers-reduced-motion`.
   */
  gestures?: boolean;
  /**
   * Gesto de saludo procedural en la mano izquierda (`Hueso`), escalonado
   * media vuelta respecto al de la derecha para que alternen. Activado
   * por defecto; se apaga solo con `prefers-reduced-motion`.
   */
  gesturesLeft?: boolean;
  /**
   * Parpadeo procedural del ojo izquierdo (`Hueso cuerpo.003`), encima de
   * la animación baked. Activado por defecto; se apaga solo con
   * `prefers-reduced-motion`.
   */
  blinkLeft?: boolean;
  /**
   * Parpadeo procedural del ojo derecho (`Hueso cuerpo.001`), sincronizado
   * con el izquierdo. Activado por defecto; se apaga solo con
   * `prefers-reduced-motion`.
   */
  blinkRight?: boolean;
  /**
   * Ceja izquierda (`Hueso cuerpo.005`): se levanta (sorpresa). Activado
   * por defecto; se apaga solo con `prefers-reduced-motion`.
   */
  eyebrowLeft?: boolean;
  /**
   * Ceja derecha (`Hueso cuerpo.004`): se levanta, sincronizada con la
   * izquierda. Activado por defecto; se apaga solo con `prefers-reduced-motion`.
   */
  eyebrowRight?: boolean;
  /**
   * Inclinación de ambas cejas hacia afuera (adentro→afuera). Activado por
   * defecto; se apaga solo con `prefers-reduced-motion`.
   */
  eyebrowTilt?: boolean;
  /**
   * Inclinación contraria (afuera→adentro) → gesto de **enojo**. Activado
   * por defecto; se apaga solo con `prefers-reduced-motion`.
   */
  eyebrowAngry?: boolean;
  /**
   * Boca hablando (`Hueso cuerpo.002`): abre/cierra en ráfagas. Activado
   * por defecto; se apaga solo con `prefers-reduced-motion`.
   */
  mouth?: boolean;
  /**
   * Balanceo de las manos al desplazarse (columpio adelante/atrás según la
   * velocidad de roam). Independiente de la emoción; solo actúa en modo
   * `roam` (necesita la velocidad de `RoamGroup`). Activado por defecto; se
   * apaga con `prefers-reduced-motion`.
   */
  walk?: boolean;
  /**
   * Reproduce el clip baked del GLB (la animación hecha en Blender).
   * Activado por defecto. Separado de `gestures` para poder distinguir
   * en pruebas qué mueve la animación de Blender vs los gestos por código.
   */
  playClip?: boolean;
  /**
   * Nonce edge-triggered del gesto de "toque" (mano izquierda): cada vez que
   * cambia a un valor NUEVO se dispara UNA vez un impulso corto de la mano,
   * pensado para que el front lo accione cuando el robot llega a su
   * `target` en modo `roam` (p.ej. una celda del calendario) — el avatar no
   * sabe que ha llegado, solo reacciona al nonce. `undefined` (default) =
   * nunca. Se apaga con `prefers-reduced-motion`. Ver `usePressGesture`.
   */
  pressTrigger?: number;
}

/** Velocidad del lerp de la rotación hacia el cursor (más alto = más ágil). */
const LERP_SPEED = 6;

interface CursorFollowGroupProps {
  enabled: boolean;
  children: ReactNode;
}

/** Grupo que interpola (lerp) su rotación hacia el objetivo del cursor cada frame. */
function CursorFollowGroup({ enabled, children }: CursorFollowGroupProps) {
  const groupRef = useRef<Group>(null);
  const target = usePointerRotation(enabled);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = Math.min(1, LERP_SPEED * delta);
    group.rotation.x += (target.current.x - group.rotation.x) * t;
    group.rotation.y += (target.current.y - group.rotation.y) * t;
  });

  return <group ref={groupRef}>{children}</group>;
}

/**
 * Renderer 3D del robot con React Three Fiber: el mismo personaje que
 * `Avatar` (2D) pero como GLB real, con su propio rig animado
 * (`Esqueleto_acción` en bucle, ver `RobotModel`/`useModelAnimation`; el
 * clip ya viene corregido desde Blender — solo mueve manos y cara, el
 * cuerpo queda quieto) más `Float` (levitación) y giro hacia el cursor o
 * hacia su desplazamiento en roam — todo convive, la animación del rig
 * solo mueve huesos, no la posición/rotación del grupo que la envuelve
 * (esa la manda el cursor-follow o el roam).
 * No sustituye a `Avatar`; requiere WebGL, por lo que el front debe
 * montarlo con `next/dynamic(..., { ssr: false })`.
 *
 * Cámara a `position: [0, 0, 9]` + `fov: 42` deja el robot (≈5.5 de alto,
 * centrado por `RobotModel`) encuadrado con margen holgado en el modo
 * "caja" (`fullscreen`/`roam` en `false`, el comportamiento de siempre).
 *
 * Con `fullscreen`/`roam`, el canvas cubre toda la pantalla y el modelo
 * (escalado pequeño por `RoamGroup`) deambula por el viewport en vez de
 * quedar fijo en el centro — pensado como presencia ambiental, no como
 * un widget encajonado. En roam, la orientación la manda el movimiento
 * (`RoamGroup`/`useFlightOrientation`), así que el cursor-follow se
 * desactiva; en modo "caja" sigue igual que antes. Con `faceCamera`, el
 * billboard hacia cámara se compone ENCIMA de esa orientación por vuelo
 * (ver `RoamGroup`), no la sustituye.
 */
export function Avatar3D({
  size = 340,
  assetUrl = '/avatar/botcito.glb',
  cameraZ = 9,
  state,
  interactive = true,
  fullscreen = false,
  roam = false,
  target,
  faceCamera = false,
  clip,
  gestures = true,
  gesturesLeft = true,
  blinkLeft = true,
  blinkRight = true,
  eyebrowLeft = true,
  eyebrowRight = true,
  eyebrowTilt = true,
  eyebrowAngry = true,
  mouth = true,
  walk = true,
  playClip = true,
  pressTrigger,
}: Avatar3DProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const roamEnabled = roam && !reducedMotion;
  const rotationEnabled = interactive && !reducedMotion && !roamEnabled;
  const containerStyle = fullscreen ? { width: '100%', height: '100%' } : { width: size, height: size };

  // Con `state` los gestos los manda la emoción; sin él, las banderas
  // manuales (calibración). `prefers-reduced-motion` apaga todo gesto.
  const flags: RobotGestureFlags = state
    ? gesturesForState(state)
    : { gestures, gesturesLeft, blinkLeft, blinkRight, eyebrowLeft, eyebrowRight, eyebrowTilt, eyebrowAngry, mouth };
  const g = (on: boolean) => on && !reducedMotion;
  // El balanceo al caminar va en TODOS los estados MENOS los que ya usan las
  // manos (`happy` y `notify` saludan → chocarían). Sin `state` (modo
  // manual/calibración) también se permite.
  const walkActive =
    walk && !reducedMotion && state !== 'happy' && state !== 'notify';

  return (
    <div style={containerStyle}>
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 42 }}
        // `pointerEvents: 'none'` es OBLIGATORIO, no cosmético: R3F le mete
        // `pointerEvents: 'auto'` inline al div del `<Canvas>` ("or else the
        // canvas will block events from reaching the event source", su propio
        // comentario en el fuente), y un inline gana al `pointer-events: none`
        // que el contenedor del cliente (p.ej. la capa del avatar flotando
        // sobre el Calendario) intente heredarle por CSS. Sin este override,
        // el canvas se come TODOS los clics de lo que hay debajo. Es seguro
        // (y debe ser el default): nada en este árbol usa eventos de puntero
        // del canvas — `usePointerRotation`/`usePointerViewportTarget`
        // escuchan en `window`, no hay `onClick`/`onPointerOver` en ningún
        // mesh ni `OrbitControls`. El `style` de R3F hace spread DESPUÉS de su
        // `pointerEvents` interno, así que esta prop lo sobrescribe limpio.
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <RoamGroup enabled={roamEnabled} target={target} faceCamera={faceCamera}>
            <CursorFollowGroup enabled={rotationEnabled}>
              <Float speed={reducedMotion ? 0 : 2} rotationIntensity={0.3} floatIntensity={0.6}>
                <RobotModel
                  url={assetUrl}
                  clip={clip}
                  playing={playClip && !reducedMotion}
                  gestures={g(flags.gestures)}
                  gesturesLeft={g(flags.gesturesLeft)}
                  blinkLeft={g(flags.blinkLeft)}
                  blinkRight={g(flags.blinkRight)}
                  eyebrowLeft={g(flags.eyebrowLeft)}
                  eyebrowRight={g(flags.eyebrowRight)}
                  eyebrowTilt={g(flags.eyebrowTilt)}
                  eyebrowAngry={g(flags.eyebrowAngry)}
                  mouth={g(flags.mouth)}
                  walk={walkActive}
                  pressTrigger={reducedMotion ? undefined : pressTrigger}
                />
              </Float>
            </CursorFollowGroup>
          </RoamGroup>
        </Suspense>
      </Canvas>
    </div>
  );
}
