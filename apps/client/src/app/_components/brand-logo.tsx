'use client';

import { useTheme } from './theme';

/**
 * Logotipo de marca (imagen), sensible al tema: usa la variante de **modo
 * oscuro** (texto blanco, `Logotipo Final`) o la de **modo claro** (texto
 * oscuro, `Group 3`) según `data-theme`. El `<img>` con alto fijo y ancho
 * automático respeta la relación de aspecto (los dos archivos difieren).
 */
export function BrandLogo({ height = 46 }: { height?: number }) {
  const { theme } = useTheme();
  const src = theme === 'light' ? '/brand/logo-light.png' : '/brand/logo-dark.png';
  return <img src={src} alt="BotCito" height={height} style={{ height, width: 'auto' }} />;
}
