'use client';

import { Center, useGLTF } from '@react-three/drei';
import { useModelAnimation } from './useModelAnimation.js';

/** Ruta por defecto del GLB, precargada a nivel de módulo. */
const DEFAULT_ASSET_URL = '/avatar/botcito.glb';

export interface RobotModelProps {
  url: string;
  /** Clip a reproducir; por defecto el primero disponible (`Esqueleto_acción`). */
  clip?: string;
  /** `false` (reduced-motion) deja la animación fija en el primer frame. */
  playing?: boolean;
}

/**
 * Carga el GLB del robot: 19 mallas con materiales/colores propios, con
 * rig + animación en bucle (`useModelAnimation`, drei `useAnimations`).
 * La "vida" del personaje ahora viene tanto de su animación propia como
 * de `Float`/la rotación por cursor o de vuelo en `Avatar3D`/`RoamGroup`
 * (conviven: la animación del rig no toca la posición/rotación del grupo).
 *
 * El bounding box original NO está centrado en el origen
 * (centro ≈ (0.89, 0.96, 0.17), tamaño ≈ (5.5, 5.54, 2.11)), así que se
 * envuelve en `<Center>` de drei para que rote/levite sobre su propio eje
 * en vez de describir una órbita.
 */
export function RobotModel({ url, clip, playing = true }: RobotModelProps) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useModelAnimation({ animations, clip, playing });

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

useGLTF.preload(DEFAULT_ASSET_URL);
