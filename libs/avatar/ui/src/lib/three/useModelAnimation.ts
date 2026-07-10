'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useAnimations } from '@react-three/drei';
import { LoopRepeat } from 'three';
import type { AnimationClip, Group } from 'three';
import { stripRootMotion } from './animationTracks.js';

export interface UseModelAnimationOptions {
  animations: AnimationClip[];
  /** Nombre de clip a reproducir; por defecto el primero disponible (por índice). */
  clip?: string;
  /** `false` (p. ej. `prefers-reduced-motion`) deja la pose fija en el primer frame. */
  playing?: boolean;
}

/**
 * Reproduce en bucle la animación del rig del GLB (`useAnimations` de
 * drei se encarga de avanzar el `AnimationMixer` cada frame). Antes de
 * ligar los clips, cada uno pasa por `stripRootMotion` para quitar el
 * movimiento no deseado del cuerpo (posición/escala de los huesos raíz y
 * la rotación del hueso del cuerpo) — si no, al reiniciar el loop esos
 * valores saltan y el personaje se "teletransporta" o el cuerpo se
 * encoge/rota y "desaparece"; la posición del personaje ya la maneja el
 * roam/perseguir-mouse (o el centro, en modo caja), no el clip. Solo se
 * conserva el giro de las manos.
 *
 * Usa el primer clip procesado **por índice** (`animations[0]`, así no
 * hace falta escribir su nombre con acentos en el código, p. ej.
 * `Esqueleto_acción`) salvo que se pida uno por `clip` y exista. Con
 * `playing=false` la deja "congelada" en el primer frame en vez de
 * animar.
 *
 * Devuelve el `ref` que hay que colgar del `<group>` que envuelve al
 * modelo — `useAnimations` liga las pistas de la animación buscando por
 * nombre dentro de ese subárbol.
 */
export function useModelAnimation({ animations, clip, playing = true }: UseModelAnimationOptions) {
  const groupRef = useRef<Group>(null);
  const processedAnimations = useMemo(() => animations.map(stripRootMotion), [animations]);
  const { actions } = useAnimations(processedAnimations, groupRef);

  useEffect(() => {
    if (processedAnimations.length === 0) return;

    const requested = clip ? actions[clip] : undefined;
    const clipName = requested ? clip : processedAnimations[0]?.name;
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
  }, [actions, processedAnimations, clip, playing]);

  return groupRef;
}
