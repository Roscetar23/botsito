'use client';

export interface ShadowBlobProps {
  color?: string;
}

const DEFAULT_COLOR = '#000000';

/**
 * Altura (Y, unidades del mundo, sin escalar) del "suelo" bajo el bot.
 * El modelo mide ≈5.54 de alto y `RobotModel` lo centra en su bbox
 * (`<Center>`), así que su borde inferior local queda en
 * ≈ -5.54/2 = -2.77. `ShadowBlob` es hermano del modelo dentro del mismo
 * grupo (que en roam se escala con `ROAM_SCALE`, y en modo caja no), así
 * que usar esta coordenada sin escalar la deja pegada a los "pies" del
 * bot en ambos modos.
 */
const SHADOW_Y = -2.7;

/**
 * Sombra de contacto suave bajo el bot en modo roam: una elipse aplanada
 * y semitransparente, apoyada en el suelo (rotada plana) justo debajo
 * del modelo. Dos capas concéntricas (borde ancho y tenue + núcleo más
 * chico y denso) simulan un borde difuso sin necesitar una textura. Da
 * sensación de peso, no de brillo — reemplaza al `Trail`/`Aura`
 * anteriores. Viaja gratis con el grupo del roam (hereda su posición y
 * escala reducida).
 */
export function ShadowBlob({ color = DEFAULT_COLOR }: ShadowBlobProps) {
  return (
    <group position={[0, SHADOW_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
