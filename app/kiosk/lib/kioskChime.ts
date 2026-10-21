/**
 * @fileoverview Web Audio API acoustic chime synthesizer for kiosk inactivity notifications.
 *
 * Synthesizes a gentle, two-tone hospital acoustic chime directly in the browser using
 * the standard Web Audio API without requiring external audio media assets or network connectivity.
 *
 * Architectural & Operational Rules:
 * - High-Quality Documentation: Full symbol and module level JSDocs (Rule 1).
 * - Zero Emojis Standard: Replaced with Boxicons and clean text (Rule 6).
 * - Cross-Platform Resilience: Safely catches suspended AudioContext states and browser restrictions.
 *
 * @module app/kiosk/lib/kioskChime
 */

/**
 * Plays a gentle, harmonic two-tone acoustic warning chime over the device speakers.
 *
 * @remarks
 * Uses Web Audio API sine wave synthesis with exponential gain decay:
 * - Note 1: D5 (587.33 Hz) at t = 0.0s, decays over 0.6s
 * - Note 2: A5 (880.00 Hz) at t = 0.18s, decays over 0.8s
 *
 * Automatically resumes suspended AudioContext instances resulting from browser autoplay
 * restrictions, and safely closes the audio context after playback completes. Catches all
 * exceptions to guarantee that audio subsystem failures never impact clinical kiosk operations.
 *
 * @returns void
 */
export function playInactivityChime(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Browser audio policy might keep context suspended until resumed
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {
        // Silently catch autoplay restriction
      });
    }

    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz) - Warm fundamental chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.24, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: A5 (880.00 Hz) - Bright harmonic chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.16);
    gain2.gain.setValueAtTime(0.001, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.28, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.85);

    // Clean up audio context resources after decay finishes
    setTimeout(() => {
      ctx.close().catch(() => {
        // Context might already be closed
      });
    }, 1100);
  } catch (error) {
    // Audio alerts are advisory; log warning without breaking user interaction
    console.warn(
      "[KIOSK AUDIO] Inactivity warning chime could not be synthesized:",
      error
    );
  }
}
