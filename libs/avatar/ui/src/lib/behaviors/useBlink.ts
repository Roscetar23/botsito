'use client';

import { useEffect, useRef, useState } from 'react';
import { BLINK_CLOSED_MS, BLINK_MAX_MS, BLINK_MIN_MS } from '../animation/timings.js';

function randomDelayMs(): number {
  return BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
}

/**
 * Parpadeo con timing aleatorio (cada ~2.5-5s, cerrado ~110ms).
 * Devuelve `true` mientras los ojos deben mostrarse cerrados.
 */
export function useBlink(enabled = true): boolean {
  const [closed, setClosed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!enabled) {
      setClosed(false);
      return;
    }

    let cancelled = false;

    function scheduleNextBlink(): void {
      const openTimer = setTimeout(() => {
        if (cancelled) return;
        setClosed(true);
        const closeTimer = setTimeout(() => {
          if (cancelled) return;
          setClosed(false);
          scheduleNextBlink();
        }, BLINK_CLOSED_MS);
        timers.current.push(closeTimer);
      }, randomDelayMs());
      timers.current.push(openTimer);
    }

    scheduleNextBlink();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [enabled]);

  return closed;
}
