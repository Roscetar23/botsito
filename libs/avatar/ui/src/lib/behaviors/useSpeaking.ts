'use client';

import { useEffect, useState } from 'react';
import type { MouthVariant } from '@asistente/avatar-model';
import { SPEAKING_MOUTH_INTERVAL_MS } from '../animation/timings.js';

/**
 * Mientras `active` (estado `speaking`), alterna la boca talking/neutral
 * cada ~130ms para simular habla. Si no está activo, devuelve `fallback`
 * (la boca resuelta por la expresión del estado actual).
 */
export function useSpeaking(active: boolean, fallback: MouthVariant): MouthVariant {
  const [talking, setTalking] = useState(true);

  useEffect(() => {
    if (!active) return;
    setTalking(true);
    const id = setInterval(() => {
      setTalking((prev) => !prev);
    }, SPEAKING_MOUTH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return fallback;
  return talking ? 'talking' : 'neutral';
}
