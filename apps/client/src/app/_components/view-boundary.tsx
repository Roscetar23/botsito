'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './view-boundary.module.css';

interface ViewBoundaryProps {
  /** Nombre de la vista aislada; se usa en el fallback y en el log de error. */
  name?: string;
  children: ReactNode;
}

interface ViewBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary mínimo: aísla un módulo de vista (p. ej. el visualizador
 * 2D/3D del avatar) para que un fallo ahí no tumbe el resto de la Home
 * (barra lateral, topbar). Fallback discreto con botón de reintento que
 * resetea el estado y vuelve a montar a los hijos.
 */
export class ViewBoundary extends Component<ViewBoundaryProps, ViewBoundaryState> {
  override state: ViewBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ViewBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[ViewBoundary] ${this.props.name ?? 'vista'} falló:`, error, errorInfo);
  }

  private handleRetry = (): void => this.setState({ hasError: false });

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className={styles.fallback}>
        <p className={styles.muted}>
          {this.props.name
            ? `${this.props.name} no está disponible por ahora.`
            : 'Esta sección no está disponible por ahora.'}
        </p>
        <button type="button" className={styles.retry} onClick={this.handleRetry}>
          Reintentar
        </button>
      </div>
    );
  }
}
