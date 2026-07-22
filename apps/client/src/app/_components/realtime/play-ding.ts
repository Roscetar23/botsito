/**
 * "Ding" corto sintetizado con Web Audio (sin archivo de audio). Se dispara al
 * llegar un recordatorio, junto al toast. Es **silencioso y nunca lanza** si el
 * navegador no permite audio (p. ej. sin interacción previa del usuario): el
 * sonido es decorativo, jamás debe afectar al aviso visual.
 */
export function playDing(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 880; // A5 — "ding" claro y corto

    // Ataque rápido + decaimiento exponencial = campanilla breve.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => {
      ctx.close().catch(() => undefined);
    };
  } catch {
    // Audio no disponible: silencioso.
  }
}
