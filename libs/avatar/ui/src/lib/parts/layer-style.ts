import type { CSSProperties } from 'react';

/**
 * Estilo compartido por toda capa del rig: absoluta, ocupa el lienzo
 * completo del contenedor cuadrado (1024x1024 alineado en todas las piezas).
 */
export const layerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  userSelect: 'none',
};
