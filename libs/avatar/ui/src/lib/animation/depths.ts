/**
 * Profundidad (`translateZ`, px) por capa del rig, coherente con el
 * z-order visual (`body → headphones → brows → eyes → mouth → hands`).
 * Da volumen pseudo-3D sin motor 3D: cada capa "flota" a distinta
 * distancia de la cámara dentro del contenedor con `perspective`.
 */
export const LAYER_DEPTH = {
  body: 0,
  headphones: -8,
  brows: 14,
  eyes: 14,
  mouth: 18,
  hands: 48,
} as const;

export type LayerName = keyof typeof LAYER_DEPTH;
