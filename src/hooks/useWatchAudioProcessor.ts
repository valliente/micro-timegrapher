import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine, WatchMetrics, AudioEngineOptions } from '../audio/AudioEngine';

export interface UseWatchAudioProcessorReturn {
  audioEngine: AudioEngine | null;
  isRunning: boolean;
  isSynthetic: boolean;
  metrics: WatchMetrics;
  options: AudioEngineOptions;
  startMicrophone: () => Promise<boolean>;
  startSynthesizer: () => Promise<boolean>;
  stop: () => void;
  updateOptions: (newOptions: Partial<AudioEngineOptions>) => void;
  setSynthDrift: (rateSd: number, beatErrorMs: number) => void;
  analyserNode: AnalyserNode | null;
}

export function useWatchAudioProcessor(initialOptions?: Partial<AudioEngineOptions>): UseWatchAudioProcessorReturn {
  const engineRef = useRef<AudioEngine | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSynthetic, setIsSynthetic] = useState<boolean>(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const [options, setOptions] = useState<AudioEngineOptions>({
    vphPreset: 28800,
    autoDetectVph: true,
    highPassCutoff: 2500,
    lowPassCutoff: 6500,
    gainBoost: 2.5,
    liftAngleDeg: 52,
    monitorAudio: false,
    ...initialOptions,
  });

  const [metrics, setMetrics] = useState<WatchMetrics>({
    rateSd: 0,
    beatErrorMs: 0,
    amplitudeDeg: 275,
    detectedVph: 28800,
    signalLevel: 0,
    tickCount: 0,
    phaseDriftMs: 0,
    historyDots: [],
  });

  // Initialize engine reference
  useEffect(() => {
    const engine = new AudioEngine((newMetrics) => {
      setMetrics(newMetrics);
    });
    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, []);

  const startMicrophone = useCallback(async (): Promise<boolean> => {
    if (!engineRef.current) return false;
    const ok = await engineRef.current.startMicrophone(options);
    if (ok) {
      setIsRunning(true);
      setIsSynthetic(false);
      setAnalyserNode(engineRef.current.getAnalyserNode());
    }
    return ok;
  }, [options]);

  const startSynthesizer = useCallback(async (): Promise<boolean> => {
    if (!engineRef.current) return false;
    const ok = await engineRef.current.startSynthesizer(options);
    if (ok) {
      setIsRunning(true);
      setIsSynthetic(true);
      setAnalyserNode(engineRef.current.getAnalyserNode());
    }
    return ok;
  }, [options]);

  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsRunning(false);
      setAnalyserNode(null);
    }
  }, []);

  const updateOptions = useCallback((newOptions: Partial<AudioEngineOptions>) => {
    setOptions((prev) => {
      const merged = { ...prev, ...newOptions };
      if (engineRef.current) {
        engineRef.current.updateOptions(merged);
      }
      return merged;
    });
  }, []);

  const setSynthDrift = useCallback((rateSd: number, beatErrorMs: number) => {
    if (engineRef.current) {
      engineRef.current.setSynthDrift(rateSd, beatErrorMs);
    }
  }, []);

  return {
    audioEngine: engineRef.current,
    isRunning,
    isSynthetic,
    metrics,
    options,
    startMicrophone,
    startSynthesizer,
    stop,
    updateOptions,
    setSynthDrift,
    analyserNode,
  };
}
