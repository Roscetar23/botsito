'use client';

import styles from './home.module.css';

/**
 * Placeholder del área principal: ocupa el lugar del futuro visualizador
 * 2D/3D del avatar (se conecta en el siguiente paso). Puramente
 * presentacional, sin toggle 2D/3D todavía.
 */
export function VisualizerPlaceholder() {
  return (
    <div className={styles.placeholderCard}>
      <p className={styles.placeholderKicker}>Visualizador</p>
      <h2 className={styles.placeholderTitle}>Aquí vivirá tu asistente.</h2>
      <p className={styles.placeholderText}>La vista 2D/3D se conecta en el siguiente paso.</p>
    </div>
  );
}
