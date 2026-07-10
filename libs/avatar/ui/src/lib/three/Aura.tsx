'use client';

import { AdditiveBlending } from 'three';

export interface AuraProps {
  color?: string;
}

const DEFAULT_COLOR = '#6C5CE7';

/**
 * Halo aditivo sutil que acompaña al bot en modo roam: una esfera
 * ligeramente detrás en Z, blending aditivo y opacidad baja. Da
 * "presencia" sin tapar el modelo ni animarse por su cuenta — viaja
 * gratis con el grupo que ya mueve el roam (posición y escala).
 */
export function Aura({ color = DEFAULT_COLOR }: AuraProps) {
  return (
    <mesh position={[0, 0, -1.4]} renderOrder={-1}>
      <sphereGeometry args={[1.6, 24, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.16}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
