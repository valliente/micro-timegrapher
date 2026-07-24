import React, { useState } from 'react';
import { Header } from './components/Header';
import { DisplayHUD } from './components/DisplayHUD';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { ControlPanel } from './components/ControlPanel';
import { useWatchAudioProcessor } from './hooks/useWatchAudioProcessor';
import { Watch, Info, HelpCircle, Activity } from 'lucide-react';

export function App() {
  const {
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
  } = useWatchAudioProcessor();

  const [synthDriftSd, setLocalSynthDriftSd] = useState<number>(4.5);
  const [synthBeatErrorMs, setLocalSynthBeatErrorMs] = useState<number>(0.3);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const handleSetSynthDrift = (rateSd: number, beatErrMs: number) => {
    setLocalSynthDriftSd(rateSd);
    setLocalSynthBeatErrorMs(beatErrMs);
    setSynthDrift(rateSd, beatErrMs);
  };

  const handleToggleMonitor = () => {
    updateOptions({ monitorAudio: !options.monitorAudio });
  };

  return (
    <div className="w-full min-h-screen bg-[#07090e] text-gray-100 font-mono flex flex-col justify-between overflow-x-hidden">
      {/* Top Header */}
      <Header
        isRunning={isRunning}
        isSynthetic={isSynthetic}
        options={options}
        onStartMic={startMicrophone}
        onStartSynth={() => {
          handleSetSynthDrift(synthDriftSd, synthBeatErrorMs);
          startSynthesizer();
        }}
        onStop={stop}
        onToggleMonitor={handleToggleMonitor}
      />

      {/* Real-Time Digital HUD Readout */}
      <DisplayHUD metrics={metrics} isRunning={isRunning} />

      {/* Main Canvas Visualizer Display */}
      <div className="relative flex-1 flex flex-col">
        <VisualizerCanvas
          analyserNode={analyserNode}
          metrics={metrics}
          isRunning={isRunning}
        />

        {/* Start Overlay / IDLE Prompt */}
        {!isRunning && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20 text-center">
            <div className="p-4 rounded-full bg-crt-panel border border-crt-cyan/40 text-crt-cyan mb-4 shadow-cyan-glow animate-pulse">
              <Watch className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-black text-white tracking-widest mb-2 font-mono glow-cyan">
              ACOUSTIC WATCH ANALYZER READY
            </h2>

            <p className="text-sm text-gray-300 max-w-lg mb-6 leading-relaxed">
              Place your mechanical watch close to your microphone (or contact acoustic pickup) and click <strong className="text-crt-cyan">MIC INPUT</strong>, or launch the <strong className="text-crt-amber">DEMO SYNTH</strong> to test the oscilloscope DSP algorithms immediately.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={startMicrophone}
                className="px-6 py-3 rounded-lg bg-crt-cyan text-black font-extrabold text-sm tracking-wider hover:bg-cyan-300 transition-all shadow-cyan-glow"
              >
                START MIC LISTEN
              </button>

              <button
                onClick={() => {
                  handleSetSynthDrift(synthDriftSd, synthBeatErrorMs);
                  startSynthesizer();
                }}
                className="px-6 py-3 rounded-lg bg-crt-amber text-black font-extrabold text-sm tracking-wider hover:bg-amber-300 transition-all shadow-amber-glow"
              >
                RUN DEMO SYNTH
              </button>

              <button
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-crt-card border border-crt-border text-gray-300 hover:text-white transition-all text-xs font-bold"
              >
                <HelpCircle className="w-4 h-4 text-crt-cyan" />
                HOW IT WORKS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Retro Control Panel */}
      <ControlPanel
        options={options}
        isSynthetic={isSynthetic}
        isRunning={isRunning}
        onUpdateOptions={updateOptions}
        onSetSynthDrift={handleSetSynthDrift}
        synthDriftSd={synthDriftSd}
        synthBeatErrorMs={synthBeatErrorMs}
      />

      {/* Footer info bar */}
      <footer className="w-full bg-[#05070a] border-t border-crt-border/40 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-gray-500 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>MICRO-TIMEGRAPHER // CRT ACOUSTIC DSP</span>
          <span>•</span>
          <span className="text-crt-cyan">SUPPORTED VPH: 18k - 36k</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowGuideModal(true)}
            className="hover:text-crt-cyan transition-colors"
          >
            DOCUMENTATION & SPECS
          </button>
          <span>•</span>
          <span>GOOGLE ANTIGRAVITY ENGINE</span>
        </div>
      </footer>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-crt-panel border border-crt-cyan/50 rounded-xl max-w-xl w-full p-6 shadow-cyan-glow relative">
            <h3 className="text-lg font-bold text-crt-cyan mb-3 flex items-center gap-2 border-b border-crt-border pb-2">
              <Info className="w-5 h-5 text-crt-cyan" /> MICRO-TIMEGRAPHER GUIDE
            </h3>

            <div className="space-y-3 text-xs text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>
                <strong>What is a Timegrapher?</strong> A mechanical watch timegrapher is an acoustic diagnostic instrument that measures the exact frequency, rate drift (s/day), beat error (ms), and balance wheel amplitude of mechanical watch escapements.
              </p>
              <p>
                <strong>1. Audio Isolation Bandpass:</strong> Watch escapement sounds reside between 2.5 kHz and 6.5 kHz (the sharp acoustic click of ruby pallet jewels striking escape wheel teeth). The built-in bandpass filter suppresses room noise and low-frequency hum.
              </p>
              <p>
                <strong>2. Rate Drift (s/day):</strong> Measures how many seconds fast or slow your mechanical watch will run over a 24-hour period.
              </p>
              <p>
                <strong>3. Beat Error (ms):</strong> Measures the millisecond asymmetry between the "tick" (clockwise swing) and "tock" (counter-clockwise swing). Ideal beat error is 0.0 ms – 0.4 ms.
              </p>
              <p>
                <strong>4. Dot Drift Tape View:</strong> Simulates traditional paper-tape timegraphers. Two parallel lines of dots are plotted. A flat line indicates 0 s/d drift; an upward slope indicates a fast watch; a downward slope indicates a slow watch.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded bg-crt-cyan text-black font-extrabold text-xs hover:bg-cyan-300 transition-all shadow-cyan-glow"
              >
                CLOSE GUIDE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
