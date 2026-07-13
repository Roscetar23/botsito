'use client';

import { Avatar3DLazy } from './avatar-3d-lazy';
import { BrandLogo } from './brand-logo';
import styles from './access-panel.module.css';

/**
 * Panel izquierdo de la pantalla de acceso: marca (logo + letras), tarjeta
 * "entorno de acceso" con el **modelo 3D real** (feliz, la mirada sigue el
 * cursor) y el pie "acceso seguro". Puramente presentacional.
 */
export function AccessPanel() {
  return (
    <aside className={styles.panel}>
      <div className={styles.brand}>
        <BrandLogo height={62} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <p className={styles.cardKicker}>Entorno de acceso</p>
            <h2 className={styles.cardTitle}>Tu asistente casi inteligente.</h2>
          </div>
          <span className={styles.cardBadge} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 3 7v10l9 5 9-5V7z" />
              <path d="M3 7l9 5 9-5M12 12v10" />
            </svg>
          </span>
        </div>

        <div className={styles.modelFrame}>
          <Avatar3DLazy state="happy" playClip={false} interactive size={320} cameraZ={12.5} />
          <span className={styles.modelTag}>MODELO 3D</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.cardFoot}>
          <p className={styles.cardCaption}>Botcito, tu asistente en 3D, siempre a un lado.</p>
          <span className={styles.liveBadge}>EN VIVO</span>
        </div>
      </div>

      <div className={styles.secure}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        Acceso seguro · Botcito Systems
      </div>
    </aside>
  );
}
