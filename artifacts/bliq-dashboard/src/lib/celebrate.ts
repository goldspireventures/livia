/**
 * Celebrate — small, opinionated booking-confirmed flourish.
 *
 * Two ingredients:
 *   1. A soft three-note champagne chime via Web Audio (no asset needed).
 *   2. A `data-celebrate` attribute hook so consumers can attach the
 *      shimmer overlay (CSS lives alongside in index.css).
 *
 * Always respects the user's reduced-motion preference and silently no-ops
 * if the AudioContext can't be created (some browsers, SSR, etc.).
 *
 * Feature-flagged via localStorage key `livia.celebrate` — set to "off"
 * to disable globally during a sensitive demo.
 */

// Narrow extension of Window for the prefixed Safari AudioContext constructor.
// Avoids `any` while still tolerating the legacy global on older browsers.
interface AudioCapableWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

function reducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function celebrateDisabled(): boolean {
  try {
    return window.localStorage.getItem("livia.celebrate") === "off";
  } catch {
    return false;
  }
}

/**
 * Play a soft champagne chime. Silent if reduced-motion is set, the user
 * has disabled it, or the browser blocks audio.
 */
export function playCelebrationChime(): void {
  if (typeof window === "undefined") return;
  if (reducedMotion() || celebrateDisabled()) return;

  try {
    const w = window as AudioCapableWindow;
    const Ctor: typeof AudioContext | undefined =
      w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;
    const ctx: AudioContext = new Ctor();

    // Three rising notes, ~110ms apart, with quick decay — a glass-tap.
    const notes = [
      { freq: 880, t: 0.0, dur: 0.45 },   // A5
      { freq: 1175, t: 0.11, dur: 0.45 }, // D6
      { freq: 1568, t: 0.22, dur: 0.55 }, // G6
    ];

    for (const { freq, t, dur } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + dur + 0.05);
    }

    // Close after the chime finishes so we don't leak audio contexts.
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Audio is a nice-to-have; failure is fine.
  }
}

export function celebrationEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return !reducedMotion() && !celebrateDisabled();
}
