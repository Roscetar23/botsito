'use client';

import { useEffect, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { LoopRepeat } from 'three';
import type { AnimationClip, Group } from 'three';

export interface UseModelAnimationOptions {
  animations: AnimationClip[];
  /** Nombre de clip a reproducir; por defecto el primero disponible (por índice). */
  clip?: string;
  /** `false` (p. ej. `prefers-reduced-motion`) deja la pose fija en el primer frame. */
  playing?: boolean;
}

/**
 * Reproduce en bucle la animación del rig del GLB (`useAnimations` de
 * drei se encarga de avanzar el `AnimationMixer` cada frame). Usa el
 * primer clip **por índice** (`animations[0]`, así no hace falta escribir
 * su nombre con acentos en el código, p. ej. `Esqueleto_acción`) salvo
 * que se pida uno por `clip` y exista. Con `playing=false` la deja
 * "congelada" en el primer frame en vez de animar.
 *
 * Devuelve el `ref` que hay que colgar del `<group>` que envuelve al
 * modelo — `useAnimations` liga las pistas de la animación buscando por
 * nombre dentro de ese subárbol.
 */
export function useModelAnimation({ animations, clip, playing = true }: UseModelAnimationOptions) {
  const groupRef = useRef<Group>(null);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (animations.length === 0) return;

    const requested = clip ? actions[clip] : undefined;
    const clipName = requested ? clip : animations[0]?.name;
    const action = clipName ? actions[clipName] : undefined;
    if (!action) return;

    action.reset().setLoop(LoopRepeat, Infinity);

    if (playing) {
      action.fadeIn(0.3).play();
    } else {
      action.play();
      action.paused = true;
    }

    return () => {
      action.fadeOut(0.3);
    };
  }, [actions, animations, clip, playing]);

  return groupRef;
}
