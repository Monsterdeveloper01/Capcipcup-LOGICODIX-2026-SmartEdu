/**
 * CupLabs Laboratory Sound Effects (SFX) Engine
 * High-fidelity, procedural Web Audio API synthesis for authentic laboratory acoustics:
 * 1. Liquid Pouring (gemericik aliran cairan & gelembung mikro fluida dinamis)
 * 2. Effervescence Hiss (suara mendesis pelepasan gas CO2 / buih mikro aktif)
 * 3. Borosilicate Glass Clink (denting tabung reaksi kaca & bejana pyrex)
 * 
 * Features:
 * - Zero external assets (no missing files, no bandwidth latency, instant 0ms playback)
 * - Auto-initialization on first user interaction (browser autoplay policy compliant)
 * - Global mute toggle with localStorage persistence
 */

class LabSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  // Active pouring state
  private isPouringActive: boolean = false;
  private pouringGain: GainNode | null = null;
  private pouringNoiseSource: AudioBufferSourceNode | null = null;
  private pouringIntervalId: any = null;

  // Active effervescence hiss state
  private activeHissGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("capcipcup_lab_sfx_muted");
      this.isMuted = saved === "true";
    }
  }

  /**
   * Lazy-initialize AudioContext upon first user gesture.
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initNoiseBuffer();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  /**
   * Pre-generate a 3-second white/pink noise buffer for fluid & effervescence synthesis.
   */
  private initNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise filter algorithm (Paul Kellet's method)
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.noiseBuffer = buffer;
  }

  /**
   * Check if sound is currently muted.
   */
  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Toggle sound mute state.
   */
  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Explicitly set mute state.
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("capcipcup_lab_sfx_muted", String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
    }
    if (muted && this.isPouringActive) {
      this.stopPouring();
    }
  }

  // ===========================================================================
  // 1. DENTING HALUS TABUNG KACA REAKSI (BOROSILICATE GLASS CLINK / TAP)
  // ===========================================================================
  /**
   * Memainkan denting halus khas tabung reaksi kaca borosilikat saat disentuh,
   * digenggam dengan tangan, atau diletakkan di atas meja praktik.
   *
   * @param intensity "soft" (sentuhan halus/hover), "medium" (diambil/ditaruh meja), "hard" (benturan)
   */
  public playGlassClink(intensity: "soft" | "medium" | "hard" = "medium") {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const volMultiplier = intensity === "soft" ? 0.45 : intensity === "hard" ? 1.0 : 0.75;
    const duration = intensity === "soft" ? 0.22 : 0.38;

    // Pitch variation: slight +/- 3% random shift per tap for natural acoustic realism
    const pitchJitter = 1 + (Math.random() * 0.06 - 0.03);
    const fundamentalFreq = 2650 * pitchJitter; // Resonansi kaca pyrex 2.65 kHz
    const overtone1 = 5480 * pitchJitter;       // Harmoni kedua 5.48 kHz
    const overtone2 = 7920 * pitchJitter;       // Harmoni kilau kristal 7.92 kHz

    // Glass output sub-bus with subtle high-pass to avoid bass boom
    const glassFilter = ctx.createBiquadFilter();
    glassFilter.type = "highpass";
    glassFilter.frequency.setValueAtTime(1400, now);
    glassFilter.connect(this.masterGain);

    // Strike click impulse (transient tap sentuhan fisik)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(4200 * pitchJitter, now);
    clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.015);
    clickGain.gain.setValueAtTime(0.28 * volMultiplier, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    clickOsc.connect(clickGain);
    clickGain.connect(glassFilter);
    clickOsc.start(now);
    clickOsc.stop(now + 0.02);

    // Modal Mode 1: Resonansi Utama Kaca Borosilikat (panjang dengung ~0.35s)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(fundamentalFreq, now);
    gain1.gain.setValueAtTime(0.32 * volMultiplier, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.connect(gain1);
    gain1.connect(glassFilter);
    osc1.start(now);
    osc1.stop(now + duration + 0.05);

    // Modal Mode 2: Harmoni Lonceng Kaca Tinggi (dengung ~0.18s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(overtone1, now);
    gain2.gain.setValueAtTime(0.18 * volMultiplier, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + (duration * 0.6));
    osc2.connect(gain2);
    gain2.connect(glassFilter);
    osc2.start(now);
    osc2.stop(now + duration + 0.05);

    // Modal Mode 3: Kilau Denting Crystalline Ringing (sangat halus ~0.09s)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(overtone2, now);
    gain3.gain.setValueAtTime(0.09 * volMultiplier, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + (duration * 0.35));
    osc3.connect(gain3);
    gain3.connect(glassFilter);
    osc3.start(now);
    osc3.stop(now + duration + 0.05);
  }

  // ===========================================================================
  // 2. SUARA GEMERICIK CAIRAN SAAT DITUANGKAN (LIQUID POURING & GURGLING)
  // ===========================================================================
  /**
   * Mulai memainkan suara gemericik cairan saat bejana dimiringkan / dituangkan.
   * Mensintesis aliran fluida kontinu yang halus dipadukan dengan gelembung mikro acak.
   */
  public startPouring() {
    if (this.isMuted || this.isPouringActive) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    this.isPouringActive = true;
    const now = ctx.currentTime;

    // Master stream gain node
    const streamGain = ctx.createGain();
    streamGain.gain.setValueAtTime(0.001, now);
    streamGain.gain.linearRampToValueAtTime(0.42, now + 0.12);
    streamGain.connect(this.masterGain);
    this.pouringGain = streamGain;

    // Resonant bandpass filter simulating turbulent liquid stream cavity
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(950, now);
    bandpass.Q.setValueAtTime(3.2, now);

    // Lowpass filter to keep water stream gentle & organic
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1750, now);

    // Continuous looping noise source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(streamGain);
    noiseSource.start(now);
    this.pouringNoiseSource = noiseSource;

    // LFO to create realistic stream volume & frequency swaying
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4.5, now); // 4.5 Hz liquid wobble
    lfoGain.gain.setValueAtTime(180, now);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start(now);

    // Micro-bubble droplet scheduler: random subtle "bloop" sweeps
    this.pouringIntervalId = setInterval(() => {
      if (!this.isPouringActive || !this.ctx || this.isMuted) return;
      this.spawnMicroBubbleDroplet(streamGain);
    }, 75 + Math.random() * 50);
  }

  /**
   * Mensintesis letupan gelembung mikro (droplet splash/bloop) dalam aliran tuang.
   */
  private spawnMicroBubbleDroplet(targetNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const startFreq = 480 + Math.random() * 320;
    const endFreq = startFreq + (250 + Math.random() * 350);
    const bubbleDuration = 0.035 + Math.random() * 0.03;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + bubbleDuration);

    gain.gain.setValueAtTime(0.08 + Math.random() * 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + bubbleDuration);

    osc.connect(gain);
    gain.connect(targetNode);

    osc.start(now);
    osc.stop(now + bubbleDuration + 0.01);
  }

  /**
   * Menghentikan suara penuangan cairan secara halus tanpa bunyi letupan (fade-out).
   */
  public stopPouring() {
    if (!this.isPouringActive) return;
    this.isPouringActive = false;

    if (this.pouringIntervalId) {
      clearInterval(this.pouringIntervalId);
      this.pouringIntervalId = null;
    }

    if (this.pouringGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.pouringGain.gain.cancelScheduledValues(now);
      this.pouringGain.gain.setValueAtTime(this.pouringGain.gain.value, now);
      this.pouringGain.gain.linearRampToValueAtTime(0.001, now + 0.15);

      const srcToStop = this.pouringNoiseSource;
      setTimeout(() => {
        try {
          srcToStop?.stop();
          srcToStop?.disconnect();
        } catch {}
      }, 180);
    }

    this.pouringGain = null;
    this.pouringNoiseSource = null;
  }

  // ===========================================================================
  // 3. SUARA MENDESIS GELEMBUNG GAS CO2 / BUIH EFFERVESCENCE (EFFERVESCENCE HISS)
  // ===========================================================================
  /**
   * Memainkan suara mendesis khas buih gas (effervescence hiss) saat terbentuk gelembung
   * gas CO2, H2, atau reaksi asam-karbonat & redoks berbusa.
   *
   * @param durationSec Durasi mendesis aktif (default 3.8 detik)
   * @param intensity Intensitas gelembung (default 0.75)
   */
  public playEffervescenceHiss(durationSec: number = 3.8, intensity: number = 0.75) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;

    const now = ctx.currentTime;

    // Hiss main envelope
    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.001, now);
    // Rapid attack as reaction initiates
    hissGain.gain.linearRampToValueAtTime(0.48 * intensity, now + 0.22);
    // Sustained vigorous fizz
    hissGain.gain.setValueAtTime(0.45 * intensity, now + (durationSec * 0.45));
    // Gentle exponential decay as reaction calms down
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
    hissGain.connect(this.masterGain);
    this.activeHissGain = hissGain;

    // Dual-stage bandpass filter: High-frequency effervescent sizzle (3 kHz - 6.5 kHz)
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(2400, now);

    const peaking = ctx.createBiquadFilter();
    peaking.type = "peaking";
    peaking.frequency.setValueAtTime(4600, now);
    peaking.Q.setValueAtTime(2.8, now);
    peaking.gain.setValueAtTime(8, now);

    // Noise source
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(highpass);
    highpass.connect(peaking);
    peaking.connect(hissGain);

    noiseSource.start(now);
    noiseSource.stop(now + durationSec + 0.1);

    // Rapid micro-burst pops (bursting tiny bubbles on liquid surface)
    const popInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.currentTime >= now + durationSec) {
        clearInterval(popInterval);
        return;
      }
      this.spawnMicroPopClick(hissGain);
    }, 45);

    setTimeout(() => {
      clearInterval(popInterval);
    }, durationSec * 1000);
  }

  /**
   * Letupan mikro klik frekuensi tinggi dari gelembung CO2 yang meletus di permukaan.
   */
  private spawnMicroPopClick(targetNode: GainNode) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    const popFreq = 3200 + Math.random() * 2600;
    osc.frequency.setValueAtTime(popFreq, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.012);

    gain.gain.setValueAtTime(0.05 + Math.random() * 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);

    osc.connect(gain);
    gain.connect(targetNode);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  // ===========================================================================
  // 4. SUARA HARMONIS KEBERHASILAN REAKSI (REACTION SUCCESS CHIME)
  // ===========================================================================
  /**
   * Nada harmonis halus penanda reaksi kimia berhasil terbentuk di meja praktik.
   */
  public playReactionSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Akor C Mayor (C5 - E5 - G5 - C6)

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.06;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.14, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteStart);
      osc.stop(noteStart + 0.6);
    });
  }
}

// Export Singleton Instance
export const labSound = new LabSoundEngine();
export default labSound;

