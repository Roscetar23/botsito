import { AnimationClip } from 'three';

/**
 * Huesos raíz del armature `Esqueleto` (hijos directos del armature) en
 * `botcito.glb`: `Hueso`/`Hueso.001` son las manos, `Hueso cuerpo` es el
 * cuerpo. El clip `Esqueleto_acción` anima su `.position`/`.scale` (y la
 * `.quaternion` del cuerpo) y, al hacer loop, esos valores saltan de
 * vuelta al inicio → el personaje se "teletransporta" o el cuerpo entero
 * se encoge/rota y "desaparece". La posición del personaje ya la maneja
 * el roam/perseguir-mouse (o el centro, en modo caja), así que ese
 * movimiento se descarta; solo se conserva el giro de las manos.
 */
export const ROOT_BONES = ['Hueso', 'Hueso.001', 'Hueso cuerpo'] as const;

/** El hueso raíz que representa el cuerpo (no debe rotar en bloque). */
const BODY_BONE = 'Hueso cuerpo';

function buildRemovedTrackNames(): Set<string> {
  const removed = new Set<string>();
  for (const bone of ROOT_BONES) {
    removed.add(`${bone}.position`);
    removed.add(`${bone}.scale`);
  }
  removed.add(`${BODY_BONE}.quaternion`);
  return removed;
}

/**
 * Clona un `AnimationClip` y elimina el movimiento no deseado del cuerpo:
 * `.position` y `.scale` de los 3 huesos raíz, más `.quaternion` de
 * `Hueso cuerpo` (así el cuerpo tampoco rota/se desplaza en bloque).
 * Conserva la `.quaternion` de `Hueso`/`Hueso.001` (es el giro de las
 * manos, el movimiento que sí se quiere) y **todo** lo de los huesos
 * hijos (mueven partes del cuerpo localmente). No muta el clip original.
 */
export function stripRootMotion(clip: AnimationClip): AnimationClip {
  const removedTracks = buildRemovedTrackNames();
  const cloned = clip.clone();
  cloned.tracks = cloned.tracks.filter((track) => !removedTracks.has(track.name));
  return cloned;
}
