'use client';

import { Suspense, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import type { Group } from 'three';
import { RobotModel } from './RobotModel.js';
import { usePointerRotation } from './usePointerRotation.js';
import { RoamGroup } from './RoamGroup.js';

export interface Avatar3DProps {
  size?: number;
  assetUrl?: string;
  /** Rotación 3D que sigue al cursor por toda la ventana. Activada por defecto. */
  interactive?: boolean;
  /** El `<div>` raíz ocupa 100% del contenedor en vez del cuadro `size`. */
  fullscreen?: boolean;
  /** Deambula (solo posición) por todo el viewport visible del canvas. */
  roam?: boolean;
  /**
   * Clip del GLB a reproducir (por nombre exacto). Sin especificar, se
   * reproduce el primero disponible (`Esqueleto_acción`). Preparado para
   * un futuro mapeo `AvatarState → clip`; hoy nadie lo pasa.
   */
  clip?: string;
  /**
   * Gestos procedurales (huesos movidos por código, p. ej. un saludo)
   * encima de la animación baked. Activados por defecto; se apagan solos
   * con `prefers-reduced-motion`.
   */
  gestures?: boolean;
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
 * desactiva; en modo "caja" sigue igual que antes.
 */
export function Avatar3D({
  size = 340,
  assetUrl = '/avatar/botcito.glb',
  interactive = true,
  fullscreen = false,
  roam = false,
  clip,
  gestures = true,
}: Avatar3DProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const roamEnabled = roam && !reducedMotion;
  const rotationEnabled = interactive && !reducedMotion && !roamEnabled;
  const containerStyle = fullscreen ? { width: '100%', height: '100%' } : { width: size, height: size };

  return (
    <div style={containerStyle}>
      <Canvas camera={{ position: [0, 0, 9], fov: 42 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} />
        <Suspense fallback={null}>
          <RoamGroup enabled={roamEnabled}>
            <CursorFollowGroup enabled={rotationEnabled}>
              <Float speed={reducedMotion ? 0 : 2} rotationIntensity={0.3} floatIntensity={0.6}>
                <RobotModel
                  url={assetUrl}
                  clip={clip}
                  playing={!reducedMotion}
                  gestures={gestures && !reducedMotion}
                />
              </Float>
            </CursorFollowGroup>
          </RoamGroup>
        </Suspense>
      </Canvas>
    </div>
  );
}
