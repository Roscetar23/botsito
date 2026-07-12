'use client';

import { useEffect } from 'react';
import { Center, useGLTF } from '@react-three/drei';
import { useModelAnimation } from './useModelAnimation.js';
import { useWaveGesture, WAVE_PERIOD } from './useWaveGesture.js';
import { useBlinkGesture } from './useBlinkGesture.js';
import { useEyebrowGesture } from './useEyebrowGesture.js';
import { useMouthGesture } from './useMouthGesture.js';
import { useWalkSwing } from './useWalkSwing.js';
import { useRoamSpeed } from './roamSpeedContext.js';
import { useHandBones } from './handBonesContext.js';

/** Ruta por defecto del GLB, precargada a nivel de módulo. */
const DEFAULT_ASSET_URL = '/avatar/botcito.glb';

/** Inclinación del fruncido (rad) en el pico del gesto de cejas. Se aplica
 *  con signo OPUESTO en cada ceja (espejo) para que inclinen hacia adentro.
 *  Calibrable: subir = frunce más; invertir el signo si frunce hacia afuera. */
const EYEBROW_FROWN_TILT = 0.6;

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
  /** Parpadeo del ojo izquierdo (`Hueso cuerpo.003`; `.005` era la ceja). */
  blinkLeft?: boolean;
  /** Parpadeo del ojo derecho (`Hueso cuerpo.001`; par simétrico del izquierdo). */
  blinkRight?: boolean;
  /** Ceja izquierda (`Hueso cuerpo.005`): se levanta (sorpresa). */
  eyebrowLeft?: boolean;
  /** Ceja derecha (`Hueso cuerpo.004`): se levanta, sincronizada con la izquierda. */
  eyebrowRight?: boolean;
  /** Inclinación de AMBAS cejas hacia afuera (adentro→afuera). */
  eyebrowTilt?: boolean;
  /** Inclinación contraria (afuera→adentro) → gesto de **enojo**. */
  eyebrowAngry?: boolean;
  /** Boca hablando (`Hueso cuerpo.002`): abre/cierra en ráfagas. */
  mouth?: boolean;
  /** Balanceo de manos al desplazarse (columpio adelante/atrás, según velocidad). */
  walk?: boolean;
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
  blinkLeft = true,
  blinkRight = true,
  eyebrowLeft = true,
  eyebrowRight = true,
  eyebrowTilt = true,
  eyebrowAngry = true,
  mouth = true,
  walk = true,
}: RobotModelProps) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useModelAnimation({ animations, clip, playing });
  const roamSpeed = useRoamSpeed();
  const handBones = useHandBones();

  // Publica los huesos de mano (nombres saneados por three) para que
  // `HandShadows` (en `RoamGroup`) les proyecte sombra. Solo hay ref en roam.
  useEffect(() => {
    const root = groupRef.current;
    if (!root || !handBones) return;
    handBones.current = {
      left: root.getObjectByName('Hueso') ?? null,
      right: root.getObjectByName('Hueso001') ?? null,
    };
  }, [scene, groupRef, handBones]);
  useWaveGesture(groupRef, 'Hueso.001', gestures, 0);
  useWaveGesture(groupRef, 'Hueso', gesturesLeft, WAVE_PERIOD / 2);
  useBlinkGesture(groupRef, 'Hueso cuerpo.003', blinkLeft, 0);
  useBlinkGesture(groupRef, 'Hueso cuerpo.001', blinkRight, 0);
  // Inclinación de cejas en DOS direcciones opuestas, cada una con su toggle:
  // `eyebrowTilt` (adentro→afuera) y `eyebrowAngry` (afuera→adentro = enojo),
  // que es el mismo giro con signo invertido. Se combinan en un solo ángulo
  // (si se activan ambas, se cancelan → sin conflicto). El signo base es
  // OPUESTO por ceja porque están dibujadas en espejo.
  const browTilt =
    (eyebrowTilt ? EYEBROW_FROWN_TILT : 0) + (eyebrowAngry ? -EYEBROW_FROWN_TILT : 0);
  // Cada ceja: el LEVANTAR (sorpresa) es por ceja con su toggle; la inclinación
  // es compartida (ceja der. con signo invertido respecto a la izq.).
  useEyebrowGesture(groupRef, 'Hueso cuerpo.005', {
    raise: eyebrowLeft,
    tilt: eyebrowTilt || eyebrowAngry,
    tiltAngle: browTilt,
  });
  useEyebrowGesture(groupRef, 'Hueso cuerpo.004', {
    raise: eyebrowRight,
    tilt: eyebrowTilt || eyebrowAngry,
    tiltAngle: -browTilt,
  });
  useMouthGesture(groupRef, 'Hueso cuerpo.002', mouth, 0);
  // Balanceo al caminar: después del saludo para tener prioridad en las manos
  // mientras se mueve; alternado (fase π) como los brazos al andar.
  useWalkSwing(groupRef, 'Hueso.001', roamSpeed, walk, 0);
  useWalkSwing(groupRef, 'Hueso', roamSpeed, walk, Math.PI);

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

useGLTF.preload(DEFAULT_ASSET_URL);
