/**
 * Web Audio API procedural synthesizer for Lyria-style futuristic beats
 * Generates dynamic futuristic Mexican cyber beats with audio synthesis.
 */

class MexiSynthEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private timerId: number | null = null;
  private currentStep: number = 0;
  private bpm: number = 126;
  private presetName: string = 'Cyber Corrido Synth';
  private masterGain: GainNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(180, newBpm));
  }

  public setPreset(name: string) {
    this.presetName = name;
  }

  public play() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    const stepInterval = (60 / this.bpm / 4) * 1000; // 16th notes
    this.timerId = window.setInterval(() => {
      this.tick();
    }, stepInterval);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private tick() {
    if (!this.ctx || !this.masterGain) return;
    const time = this.ctx.currentTime;
    const step = this.currentStep % 16;

    // Kick Drum (Four on the floor or trap bounce)
    if (step === 0 || step === 8 || (this.presetName.includes('Trap') && (step === 4 || step === 10))) {
      this.playKick(time);
    }

    // Snare / Clap
    if (step === 4 || step === 12) {
      this.playSnare(time);
    }

    // Hi-Hats
    if (step % 2 === 0 || (this.presetName.includes('Trap') && step % 1 === 0)) {
      this.playHiHat(time, step % 4 === 2 ? 0.3 : 0.15);
    }

    // Bassline (Cyber 808 Synth)
    if (step % 4 === 0 || step === 6 || step === 14) {
      const notes = this.presetName.includes('Mariachi')
        ? [110, 130.81, 146.83, 164.81] // A minor / Mexican scales
        : [55, 65.41, 73.42, 82.41]; // Deep Sub
      const note = notes[Math.floor(step / 4) % notes.length];
      this.playBass(time, note);
    }

    // Lead Melody Synth (Futuristic Arp)
    if (step % 2 === 1) {
      const scale = [220, 261.63, 293.66, 329.63, 392.00, 440, 523.25];
      const freq = scale[(step * 3) % scale.length];
      this.playLead(time, freq);
    }

    this.currentStep++;
  }

  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.35);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.16);
  }

  private playHiHat(time: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, time);
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private playBass(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.3);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.36);
  }

  private playLead(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.21);
  }
}

export const mexiSynth = new MexiSynthEngine();
