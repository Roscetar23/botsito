'use client';

export interface ShadowBlobProps {
  color?: string;
}

const DEFAULT_COLOR = '#000000';

/**
 * Sombra de contacto suave bajo el bot en modo roam: una elipse aplanada
 * y semitransparente, apoyada en el suelo (rotada plana) y desplazada
 * hacia abajo en Y. Dos capas concéntricas (borde ancho y tenue + núcleo
 * más chico y denso) simulan un borde difuso sin necesitar una textura.
 * Da sensación de peso, no de brillo — reemplaza al `Trail`/`Aura`
 * anteriores. Viaja gratis con el grupo del roam (hereda su posición y
 * escala reducida).
 */
export function ShadowBlob({ color = DEFAULT_COLOR }: ShadowBlobProps) {
  return (
    <group position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh scale={[1.5, 0.85, 1]} renderOrder={-1}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]} scale={[1, 0.6, 1]} renderOrder={-1}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}
