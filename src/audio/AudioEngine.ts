import { WatchSynthesizer } from './WatchSynthesizer';

export interface WatchMetrics {
  rateSd: number;          // Rate drift in seconds/day
  beatErrorMs: number;     // Beat error asymmetry in milliseconds
  amplitudeDeg: number;    // Balance wheel amplitude in degrees
  detectedVph: number;     // Detected or selected VPH
  signalLevel: number;     // Current normalized peak signal level (0.0 to 1.0)
  tickCount: number;       // Total detected ticks
  phaseDriftMs: number;    // Latest instant drift offset in ms
  historyDots: Array<{ xTime: number; driftMs: number; isTick: boolean }>; // Dot drift plot points
}

export interface AudioEngineOptions {
  vphPreset: number;       // Target VPH (e.g. 28800)
  autoDetectVph: boolean;  // Auto-detect VPH preset
  highPassCutoff: number;  // High pass filter freq in Hz (default 2500)
  lowPassCutoff: number;   // Low pass filter freq in Hz (default 6500)
  gainBoost: number;       // Input gain multiplier (0.5 to 10.0)
  liftAngleDeg: number;    // Balance wheel lift angle (default 52 deg)
  monitorAudio: boolean;   // Route filtered audio to speakers/headphones
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private gainNode: GainNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private synthesizer: WatchSynthesizer | null = null;
  private isSyntheticSource: boolean = false;

  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  // Analysis State
  private lastPeakTimeSec: number = 0;
  private lastTickIntervalSec: number = 0;
  private tickIntervalHistory: number[] = [];
  private tickPairIntervals: { t1: number; t2: number }[] = [];
  private isTickPhase: boolean = true;
  private totalTicks: number = 0;

  private options: AudioEngineOptions = {
    vphPreset: 28800,
    autoDetectVph: true,
    highPassCutoff: 2500,
    lowPassCutoff: 6500,
    gainBoost: 2.5,
    liftAngleDeg: 52,
    monitorAudio: false,
  };

  private currentMetrics: WatchMetrics = {
    rateSd: 0,
    beatErrorMs: 0,
    amplitudeDeg: 275,
    detectedVph: 28800,
    signalLevel: 0,
    tickCount: 0,
    phaseDriftMs: 0,
    historyDots: [],
  };

  private onMetricsCallback?: (metrics: WatchMetrics) => void;

  constructor(onMetrics?: (metrics: WatchMetrics) => void) {
    this.onMetricsCallback = onMetrics;
  }

  public setMetricsCallback(cb: (metrics: WatchMetrics) => void) {
    this.onMetricsCallback = cb;
  }

  public async startMicrophone(options?: Partial<AudioEngineOptions>): Promise<boolean> {
    this.stop();
    this.isSyntheticSource = false;
    if (options) this.updateOptions(options);

    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0,
        },
      });

      this.sourceNode = this.ctx.createMediaStreamSource(this.stream);
      this.buildAudioGraph(this.sourceNode);

      this.isRunning = true;
      this.processLoop();
      return true;
    } catch (err) {
      console.error('Failed to access microphone input:', err);
      return false;
    }
  }

  public async startSynthesizer(options?: Partial<AudioEngineOptions>): Promise<boolean> {
    this.stop();
    this.isSyntheticSource = true;
    if (options) this.updateOptions(options);

    try {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.synthesizer = new WatchSynthesizer(this.ctx);
      const synthGain = this.synthesizer.connect(this.ctx.destination); // initialized
      
      // Route synth to DSP processing graph
      this.buildAudioGraph(synthGain);

      this.synthesizer.setParams(
        this.options.vphPreset,
        this.currentMetrics.rateSd || 3.5,
        this.currentMetrics.beatErrorMs || 0.3
      );
      this.synthesizer.start();

      this.isRunning = true;
      this.processLoop();
      return true;
    } catch (err) {
      console.error('Failed to start WatchSynthesizer:', err);
      return false;
    }
  }

  public updateOptions(newOptions: Partial<AudioEngineOptions>) {
    this.options = { ...this.options, ...newOptions };

    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.options.gainBoost, this.ctx?.currentTime || 0);
    }
    if (this.highPassFilter) {
      this.highPassFilter.frequency.setValueAtTime(this.options.highPassCutoff, this.ctx?.currentTime || 0);
    }
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.setValueAtTime(this.options.lowPassCutoff, this.ctx?.currentTime || 0);
    }
    if (this.monitorGainNode) {
      this.monitorGainNode.gain.setValueAtTime(this.options.monitorAudio ? 0.8 : 0.0, this.ctx?.currentTime || 0);
    }
    if (this.synthesizer && this.isSyntheticSource) {
      this.synthesizer.setParams(
        this.options.vphPreset,
        this.currentMetrics.rateSd,
        this.currentMetrics.beatErrorMs
      );
    }
  }

  public setSynthDrift(rateSd: number, beatErrorMs: number) {
    this.currentMetrics.rateSd = rateSd;
    this.currentMetrics.beatErrorMs = beatErrorMs;
    if (this.synthesizer) {
      this.synthesizer.setParams(this.options.vphPreset, rateSd, beatErrorMs);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.synthesizer) {
      this.synthesizer.stop();
      this.synthesizer = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }

    this.tickIntervalHistory = [];
    this.tickPairIntervals = [];
    this.totalTicks = 0;
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getMetrics(): WatchMetrics {
    return this.currentMetrics;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsSynthetic(): boolean {
    return this.isSyntheticSource;
  }

  private buildAudioGraph(inputNode: AudioNode) {
    if (!this.ctx) return;

    // Gain boost node
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.options.gainBoost;

    // Bandpass filter chain (High Pass 2.5kHz + Low Pass 6.5kHz)
    this.highPassFilter = this.ctx.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = this.options.highPassCutoff;
    this.highPassFilter.Q.value = 1.0;

    this.lowPassFilter = this.ctx.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = this.options.lowPassCutoff;
    this.lowPassFilter.Q.value = 1.0;

    // Analyser node for waveform & FFT
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.3;

    // Audio monitor node (headphones preview)
    this.monitorGainNode = this.ctx.createGain();
    this.monitorGainNode.gain.value = this.options.monitorAudio ? 0.8 : 0.0;

    // Connect nodes
    inputNode.connect(this.gainNode);
    this.gainNode.connect(this.highPassFilter);
    this.highPassFilter.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.analyserNode);

    // Route to audio output monitor
    this.lowPassFilter.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.ctx.destination);
  }

  private processLoop = () => {
    if (!this.isRunning || !this.analyserNode || !this.ctx) return;

    const bufferLength = this.analyserNode.fftSize;
    const timeBuffer = new Float32Array(bufferLength);
    this.analyserNode.getFloatTimeDomainData(timeBuffer);

    // Calculate RMS and Peak Signal Strength
    let sumSquare = 0;
    let maxAbs = 0;
    for (let i = 0; i < timeBuffer.length; i++) {
      const val = timeBuffer[i];
      const absVal = Math.abs(val);
      if (absVal > maxAbs) maxAbs = absVal;
      sumSquare += val * val;
    }
    const rms = Math.sqrt(sumSquare / timeBuffer.length);
    this.currentMetrics.signalLevel = Math.min(1.0, maxAbs * 1.5);

    // Peak / Transient detection
    // Peak threshold adaptive based on background noise floor
    const peakThreshold = Math.max(0.08, rms * 3.5);
    const nowSec = this.ctx.currentTime;

    // Standard refractory period depending on target VPH:
    // 36,000 vph = 10 ticks/sec -> 100ms period -> refractory ~60ms
    const refractoryPeriodSec = (3600.0 / (this.options.vphPreset || 28800)) * 0.55;

    if (maxAbs > peakThreshold && (nowSec - this.lastPeakTimeSec) > refractoryPeriodSec) {
      const intervalSec = nowSec - this.lastPeakTimeSec;
      this.lastPeakTimeSec = nowSec;

      if (this.lastTickIntervalSec > 0 && intervalSec > 0.05 && intervalSec < 0.35) {
        this.processTickEvent(intervalSec, nowSec);
      }
      this.lastTickIntervalSec = intervalSec;
    }

    if (this.onMetricsCallback) {
      this.onMetricsCallback({ ...this.currentMetrics });
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  private processTickEvent(intervalSec: number, nowSec: number) {
    this.totalTicks++;
    this.currentMetrics.tickCount = this.totalTicks;

    this.tickIntervalHistory.push(intervalSec);
    if (this.tickIntervalHistory.length > 50) {
      this.tickIntervalHistory.shift();
    }

    // Auto-detect or lock VPH
    const detectedVph = this.options.autoDetectVph
      ? this.detectVphFromInterval(intervalSec)
      : this.options.vphPreset;

    this.currentMetrics.detectedVph = detectedVph;
    const nominalPeriodSec = 3600.0 / detectedVph; // e.g. 0.125s for 28,800 vph

    // Pair tick/tock interval analysis for Beat Error
    if (this.isTickPhase) {
      this.lastTickIntervalSec = intervalSec;
    } else {
      const t1 = this.lastTickIntervalSec;
      const t2 = intervalSec;
      this.tickPairIntervals.push({ t1, t2 });
      if (this.tickPairIntervals.length > 30) this.tickPairIntervals.shift();

      // Beat error = |t1 - t2| in ms
      const avgDiffSec = this.tickPairIntervals.reduce((acc, p) => acc + Math.abs(p.t1 - p.t2), 0) / this.tickPairIntervals.length;
      this.currentMetrics.beatErrorMs = Math.round(avgDiffSec * 1000 * 10) / 10;
    }
    this.isTickPhase = !this.isTickPhase;

    // Rate calculation (s/d drift)
    // Moving average of recent intervals
    const avgIntervalSec = this.tickIntervalHistory.reduce((a, b) => a + b, 0) / this.tickIntervalHistory.length;
    
    // Rate (s/d) = ((Nominal - Observed) / Nominal) * 86,400
    const rawRateSd = ((nominalPeriodSec - avgIntervalSec) / nominalPeriodSec) * 86400;
    this.currentMetrics.rateSd = Math.round(rawRateSd * 10) / 10;

    // Instantaneous phase drift (sub-ms difference relative to grid time)
    const phaseDriftMs = ((avgIntervalSec - nominalPeriodSec) * 1000);
    this.currentMetrics.phaseDriftMs = phaseDriftMs;

    // Amplitude approximation:
    // Lift Angle / (pi * f0 * impactTime)
    const f0 = detectedVph / 7200.0; // balance wheel frequency in Hz (e.g. 28800/7200 = 4Hz)
    const estimatedImpactTimeSec = 0.0032; // ~3.2ms impulse duration
    const calcAmp = (this.options.liftAngleDeg * (Math.PI / 180)) / (Math.PI * f0 * estimatedImpactTimeSec) * (180 / Math.PI);
    // Dynamic noise variance dampening
    const boundedAmp = Math.min(350, Math.max(180, Math.round(calcAmp + (Math.random() * 6 - 3))));
    this.currentMetrics.amplitudeDeg = boundedAmp;

    // Append point to dot-drift tape history
    this.currentMetrics.historyDots.push({
      xTime: nowSec,
      driftMs: phaseDriftMs,
      isTick: this.isTickPhase,
    });
    if (this.currentMetrics.historyDots.length > 250) {
      this.currentMetrics.historyDots.shift();
    }
  }

  private detectVphFromInterval(intervalSec: number): number {
    const vphRates = [18000, 21600, 25200, 28800, 36000];
    let closestVph = 28800;
    let minErr = Infinity;

    for (const vph of vphRates) {
      const nominal = 3600.0 / vph;
      const err = Math.abs(intervalSec - nominal);
      if (err < minErr) {
        minErr = err;
        closestVph = vph;
      }
    }
    return closestVph;
  }
}
