/**
 * WatchSynthesizer: Generates realistic mechanical watch acoustic tick-tock audio signals
 * using Web Audio API synthesis for offline testing, calibration, and demonstrations.
 */
export class WatchSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private intervalId: number | null = null;

  private targetVph: number = 28800; // default 28,800 vph (4 Hz / 8 ticks per sec)
  private driftSecondsPerDay: number = 5.0; // +5.0 s/d fast
  private beatErrorMs: number = 0.4; // 0.4 ms beat error
  private outputNode: GainNode | null = null;

  constructor(audioContext?: AudioContext) {
    if (audioContext) {
      this.ctx = audioContext;
    }
  }

  public setAudioContext(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public setParams(vph: number, driftSd: number, beatErrorMs: number) {
    this.targetVph = vph;
    this.driftSecondsPerDay = driftSd;
    this.beatErrorMs = beatErrorMs;
  }

  public connect(destination: AudioNode): GainNode {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    this.outputNode = this.ctx.createGain();
    this.outputNode.gain.value = 0.8;
    this.outputNode.connect(destination);
    return this.outputNode;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextTick(true);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId !== null) {
      window.clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private scheduleNextTick(isTick: boolean) {
    if (!this.isRunning || !this.ctx) return;

    // Calculate nominal tick period in seconds:
    // vph = ticks per hour -> ticks per sec = vph / 3600 -> period = 3600 / vph
    const nominalPeriodSec = 3600.0 / this.targetVph; // e.g. 3600/28800 = 0.125s (125ms)

    // Drift adjustment:
    // 1 day = 86,400 seconds.
    // If drift is +D seconds per day, observed speed ratio is (86400 + D) / 86400.
    // So observed period T_obs = T_nominal * (86400 / (86400 + D))
    const driftFactor = 86400.0 / (86400.0 + this.driftSecondsPerDay);
    let actualPeriodSec = nominalPeriodSec * driftFactor;

    // Beat error asymmetry:
    // Shift tick duration +err/2 and tock duration -err/2
    const beatErrSec = (this.beatErrorMs / 1000.0) / 2.0;
    if (isTick) {
      actualPeriodSec += beatErrSec;
    } else {
      actualPeriodSec -= beatErrSec;
    }

    // Play synthetic acoustic tick sound
    this.playTickImpulse(isTick);

    // Schedule next beat
    const nextDelayMs = Math.max(10, actualPeriodSec * 1000.0);
    this.intervalId = window.setTimeout(() => {
      this.scheduleNextTick(!isTick);
    }, nextDelayMs);
  }

  private playTickImpulse(isTick: boolean) {
    if (!this.ctx || !this.outputNode) return;

    const now = this.ctx.currentTime;

    // A watch tick consists of 3 sharp metallic impacts over ~6-10 ms:
    // 1. Pallet jewel unlocking impact (low energy)
    // 2. Impulse pin striking pallet fork (high energy, main peak)
    // 3. Drop impact (pallet jewel catching escape wheel tooth)
    
    const baseFreq = isTick ? 3800 : 4200; // slight spectral difference tick vs tock

    // Impact 1: Unlock (~0ms)
    this.createImpactBurst(now, baseFreq * 0.9, 0.003, 0.2);

    // Impact 2: Impulse (~2.5ms later)
    this.createImpactBurst(now + 0.0025, baseFreq, 0.005, 0.9);

    // Impact 3: Drop impact (~6ms later)
    this.createImpactBurst(now + 0.006, baseFreq * 1.1, 0.004, 0.6);
  }

  private createImpactBurst(startTime: number, centerFreq: number, duration: number, amplitude: number) {
    if (!this.ctx || !this.outputNode) return;

    // Create transient bandpassed noise burst simulating ruby jewel strike on steel
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Exponentially decaying white noise burst
      const decay = Math.exp(-i / (bufferSize * 0.25));
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to sharp resonant metallic click frequency
    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.value = centerFreq;
    filterNode.Q.value = 8.0;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(amplitude * 0.7, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.outputNode);

    noiseNode.start(startTime);
    noiseNode.stop(startTime + duration + 0.001);
  }
}
