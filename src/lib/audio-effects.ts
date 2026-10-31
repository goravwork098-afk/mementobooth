/**
 * Web Audio API synthesizer for Photobooth sound effects.
 * Synthesizes zero-latency countdown beeps and DSLR mechanical shutter clicks
 * without requiring any external audio files or network requests.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      /* ignore resume failure */
    });
  }
  return audioCtx;
}

export function _resetAudioContextForTesting(): void {
  audioCtx = null;
}

/**
 * Plays a clean sine-wave countdown tick.
 * @param isFinal - If true, emits a higher pitch for the final mark.
 */
export function playCountdownBeep(isFinal = false): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isFinal ? 1200 : 800, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    /* AudioContext blocked or not supported */
  }
}

/**
 * Synthesizes a realistic dual-click mechanical camera shutter sound.
 * Click 1 (Curtain open): Short high-frequency burst.
 * Click 2 (Curtain close): Slightly deeper resonant burst ~80ms later.
 */
export function playShutterSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playClick = (timeOffset: number, freq: number, duration: number) => {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate burst noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to shape the mechanical snap
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
      filter.Q.setValueAtTime(3.0, ctx.currentTime + timeOffset);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + timeOffset + duration
      );

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime + timeOffset);
    };

    // First shutter blade release
    playClick(0.0, 3200, 0.05);
    // Second shutter blade completion
    playClick(0.075, 2400, 0.06);
  } catch {
    /* AudioContext blocked or not supported */
  }
}
