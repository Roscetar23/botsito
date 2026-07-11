'use client';

import { Center, useGLTF } from '@react-three/drei';
import { useModelAnimation } from './useModelAnimation.js';
import { useWaveGesture, WAVE_PERIOD } from './useWaveGesture.js';

/** Ruta por defecto del GLB, precargada a nivel de módulo. */
const DEFAULT_ASSET_URL = '/avatar/botcito.glb';

export interface RobotModelProps {
  url: string;
  /** Clip a reproducir; por defecto el primero disponible (`Esqueleto_acción`). */
  clip?: string;
  /** `false` (reduced-motion) deja la animación fija en el primer frame. */
  playing?: boolean;
  /** Gesto de saludo en la mano derecha (`Hueso.001`) encima de la animación baked. */
  gestures?: boolean;
  /** Gesto de saludo en la mano izquierda (`Hueso`), escalonado media vuelta respecto a la derecha. */
  gesturesLeft?: boolean;
}

/**
 * Carga el GLB del robot: 19 mallas con materiales/colores propios, con
 * rig + animación en bucle (`useModelAnimation`, drei `useAnimations`) y
 * gestos de saludo opcionales por mano (`useWaveGesture`) que mueven
 * huesos por código encima de esa animación. La "vida" del personaje
 * viene de la animación propia, los gestos, y de `Float`/la rotación por
 * cursor o de vuelo en `Avatar3D`/`RoamGroup` (conviven: nada de esto
 * toca la posición/rotación del grupo que envuelve al modelo).
 *
 * El bounding box original NO está centrado en el origen
 * (centro ≈ (0.89, 0.96, 0.17), tamaño ≈ (5.5, 5.54, 2.11)), así que se
 * envuelve en `<Center>` de drei para que rote/levite sobre su propio eje
 * en vez de describir una órbita.
 *
 * Orden de hooks importante: ambas llamadas a `useWaveGesture` van
 * después de `useModelAnimation`, para que su ajuste se aplique después
 * del `AnimationMixer` en cada frame (ver comentario en ese hook). La
 * mano izquierda usa `phaseOffset = WAVE_PERIOD / 2` para alternar con
 * la derecha en vez de saludar exactamente al mismo tiempo.
 */
export function RobotModel({
  url,
  clip,
  playing = true,
  gestures = true,
  gesturesLeft = true,
}: RobotModelProps) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useModelAnimation({ animations, clip, playing });
  useWaveGesture(groupRef, 'Hueso.001', gestures, 0);
  useWaveGesture(groupRef, 'Hueso', gesturesLeft, WAVE_PERIOD / 2);

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

useGLTF.preload(DEFAULT_ASSET_URL);
