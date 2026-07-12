/**
 * Logotipo de marca (imagen). Usa la variante de **modo oscuro** (texto
 * blanco), que es el tema principal; la variante clara vive en
 * `public/brand/logo-light.png` para cuando se active el tema claro.
 */
export function BrandLogo({ height = 30 }: { height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-dark.png" alt="BotCito" height={height} style={{ height, width: 'auto' }} />
  );
}
