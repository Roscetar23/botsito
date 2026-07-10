'use client';

import { Center, useGLTF } from '@react-three/drei';

/** Ruta por defecto del GLB, precargada a nivel de módulo. */
const DEFAULT_ASSET_URL = '/avatar/botcito.glb';

export interface RobotModelProps {
  url: string;
}

/**
 * Carga el GLB del robot: 19 mallas con materiales/colores propios, sin
 * rig ni animaciones todavía (versión estática, la "vida" la dan `Float`
 * y la rotación por cursor en `Avatar3D`).
 *
 * El bounding box original NO está centrado en el origen
 * (centro ≈ (0.89, 0.96, 0.17), tamaño ≈ (5.5, 5.54, 2.11)), así que se
 * envuelve en `<Center>` de drei para que rote/levite sobre su propio eje
 * en vez de describir una órbita.
 */
export function RobotModel({ url }: RobotModelProps) {
  const { scene } = useGLTF(url);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

useGLTF.preload(DEFAULT_ASSET_URL);
