'use client';

import { createContext, useContext } from 'react';
import type { MutableRefObject } from 'react';
import type { Object3D } from 'three';

/** Huesos de las manos (izq./der.) del modelo, para proyectarles sombra. */
export interface HandBones {
  left: Object3D | null;
  right: Object3D | null;
}

/**
 * Comparte los huesos de las manos (`Hueso`/`Hueso.001`) desde `RobotModel`
 * (que los encuentra en la escena) hasta el nivel de `RoamGroup` (donde vive
 * la sombra, fuera del `Float`), como **ref** para leerlos cada frame sin
 * re-render. `null` fuera de un `RoamGroup` (modo "caja") → sin sombras de mano.
 */
export const HandBonesContext = createContext<MutableRefObject<HandBones> | null>(null);

/** Lee el ref de huesos de mano (o `null` si no hay `RoamGroup` arriba). */
export function useHandBones(): MutableRefObject<HandBones> | null {
  return useContext(HandBonesContext);
}
