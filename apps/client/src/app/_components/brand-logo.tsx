'use client';

import { useTheme } from './theme';

interface BrandLogoProps {
  height?: number;
  /** 'full' (logo con texto, por defecto) o 'icon' (solo el ícono, p. ej. la barra lateral colapsada). */
  variant?: 'full' | 'icon';
}

const SOURCES = {
  full: { dark: '/brand/logo-dark.png', light: '/brand/logo-light.png' },
  icon: { dark: '/brand/icon-dark.png', light: '/brand/icon-light.png' },
} as const;

/**
 * Logotipo de marca (imagen), sensible al tema: usa la variante de **modo
 * oscuro** (texto blanco, `Logotipo Final`) o la de **modo claro** (texto
 * oscuro, `Group 3`) según `data-theme`. El `<img>` con alto fijo y ancho
 * automático respeta la relación de aspecto (los dos archivos difieren).
 * `variant="icon"` usa solo el ícono, sin texto.
 */
export function BrandLogo({ height = 46, variant = 'full' }: BrandLogoProps) {
  const { theme } = useTheme();
  const src = SOURCES[variant][theme];
  return <img src={src} alt="BotCito" height={height} style={{ height, width: 'auto' }} />;
}
