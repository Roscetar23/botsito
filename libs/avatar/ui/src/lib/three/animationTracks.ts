import { AnimationClip } from 'three';

/**
 * Huesos raíz del armature `Esqueleto` (hijos directos del armature) en
 * `botcito.glb`. El clip `Esqueleto_acción` anima su `.position` y, al
 * hacer loop, esa traslación salta de vuelta al inicio → el cuerpo entero
 * se "teletransporta". La posición del personaje ya la maneja el
 * roam/perseguir-mouse (o el centro, en modo caja), así que se descarta.
 */
export const ROOT_BONES = ['Hueso', 'Hueso.001', 'Hueso cuerpo'] as const;

/**
 * Clona un `AnimationClip` y elimina las pistas `"<hueso>.position"` de
 * los huesos raíz (`ROOT_BONES`). Conserva todas las `.quaternion` y
 * `.scale`, y también las `.position` de huesos **hijos** (esas mueven
 * partes del cuerpo localmente, no desplazan el personaje entero). No
 * muta el clip original — devuelve uno nuevo.
 */
export function stripRootTranslation(clip: AnimationClip): AnimationClip {
  const rootPositionTracks = new Set(ROOT_BONES.map((bone) => `${bone}.position`));
  const cloned = clip.clone();
  cloned.tracks = cloned.tracks.filter((track) => !rootPositionTracks.has(track.name));
  return cloned;
}
