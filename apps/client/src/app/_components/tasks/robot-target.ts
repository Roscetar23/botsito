/** Coordenadas normalizadas al rect del tablero (x: -1 izq → 1 der; y: -1
 * arriba → 1 abajo). Igual convención que en `calendar/use-robot-choreography.ts`. */
export interface RobotTarget {
  x: number;
  y: number;
}

/** Lado de la PANTALLA (del espectador) con el que se toca. */
export type PressHand = 'left' | 'right';

/** Reposo: arriba del todo, a la derecha. Mismo valor que en el calendario,
 * para que el robot aparezca en el mismo sitio al cambiar de vista. */
export const REST_TARGET: RobotTarget = { x: 0.6, y: -0.92 };

/** Normaliza el centro de `cardRect` al rect del tablero (`boardRect`). Si no
 * hay tablero medido (aún no montado o `display:none`), cae al reposo. */
export function targetFromRect(cardRect: DOMRect, boardRect: DOMRect | null): RobotTarget {
  if (!boardRect || boardRect.width === 0 || boardRect.height === 0) return REST_TARGET;
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;
  return {
    x: ((cardCenterX - boardRect.left) / boardRect.width) * 2 - 1,
    y: ((cardCenterY - boardRect.top) / boardRect.height) * 2 - 1,
  };
}
