/**
 * Pure Web Audio API Sound Synthesizer
 * 100% offline, zero network requests, lightweight memory footprint.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playMeow(pitchShift: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);

      // Meow pitch curve (Starts mid, rises slightly, drops softly)
      const baseFreq = 480 * pitchShift;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, t + 0.45);

      // Gain envelope
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.52);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playBoing() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(580, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    } catch {}
  }

  public playPaperRustle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Filtered noise buffer
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.22);
    } catch {}
  }

  public playPurr() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, t);

      lfo.frequency.setValueAtTime(24, t); // rapid purr flutter
      lfoGain.gain.setValueAtTime(25, t);

      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(t);
      osc.start(t);
      lfo.stop(t + 0.62);
      osc.stop(t + 0.62);
    } catch {}
  }

  public playSneeze() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Inhale soft chirp
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.08);
      oscGain.gain.setValueAtTime(0.05, t);
      oscGain.gain.linearRampToValueAtTime(0.12, t + 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);

      // Sneeze burst (filtered noise "tchoo!")
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.35;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, t + 0.09);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t + 0.09);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t + 0.09);
      noise.stop(t + 0.29);
    } catch {}
  }

  public playAdoptChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Uplifting pentatonic notes (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.09);

        gain.gain.setValueAtTime(0.001, t + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t + idx * 0.09);
        osc.stop(t + idx * 0.09 + 0.48);
      });
    } catch {}
  }
}

export const sound = new SoundSystem();
