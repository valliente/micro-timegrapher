import React from 'react';
import { Mic, Radio, Square, Activity, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { AudioEngineOptions } from '../audio/AudioEngine';

interface HeaderProps {
  isRunning: boolean;
  isSynthetic: boolean;
  options: AudioEngineOptions;
  onStartMic: () => void;
  onStartSynth: () => void;
  onStop: () => void;
  onToggleMonitor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  isSynthetic,
  options,
  onStartMic,
  onStartSynth,
  onStop,
  onToggleMonitor,
}) => {
  return (
    <header className="w-full bg-[#0e121b] border-b border-crt-border px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-lg select-none">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-crt-panel border border-crt-cyan/30 text-crt-cyan shadow-cyan-glow animate-pulse">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-crt-cyan via-amber-400 to-crt-magenta font-mono">
            MICRO-TIMEGRAPHER
          </h1>
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <span>ACOUSTIC WATCH ANALYZER v1.0</span>
            <span className="text-crt-border">|</span>
            <span className="text-crt-cyan/80">DSP OSCILLOSCOPE</span>
          </p>
        </div>
      </div>

      {/* Input Source & Controls */}
      <div className="flex items-center gap-3">
        {/* Headphone Audio Monitor Toggle */}
        <button
          onClick={onToggleMonitor}
          title={options.monitorAudio ? "Mute audio monitor" : "Listen to filtered watch ticks"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            options.monitorAudio
              ? "bg-crt-cyan/20 border-crt-cyan text-crt-cyan shadow-cyan-glow"
              : "bg-crt-panel border-gray-700 text-gray-400 hover:text-gray-200"
          }`}
        >
          {options.monitorAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>MONITOR</span>
        </button>

        {/* Start Mic Button */}
        <button
          onClick={onStartMic}
          disabled={isRunning && !isSynthetic}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold tracking-wider border transition-all ${
            isRunning && !isSynthetic
              ? "bg-crt-green/20 border-crt-green text-crt-green shadow-green-glow animate-pulse"
              : "bg-crt-card border-crt-cyan/50 text-crt-cyan hover:bg-crt-cyan hover:text-black shadow-cyan-glow"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>MIC INPUT</span>
        </button>

        {/* Demo Synth Button */}
        <button
          onClick={onStartSynth}
          disabled={isRunning && isSynthetic}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold tracking-wider border transition-all ${
            isRunning && isSynthetic
              ? "bg-crt-amber/20 border-crt-amber text-crt-amber shadow-amber-glow animate-pulse"
              : "bg-crt-card border-crt-amber/50 text-crt-amber hover:bg-crt-amber hover:text-black shadow-amber-glow"
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>DEMO SYNTH</span>
        </button>

        {/* Stop Button */}
        {isRunning && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-red-950/60 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-md"
          >
            <Square className="w-4 h-4" />
            <span>STOP</span>
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 text-xs bg-crt-panel px-3 py-1.5 rounded-md border border-crt-border">
        <span className="text-gray-400">STATUS:</span>
        {!isRunning ? (
          <span className="text-gray-500 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-600"></span> IDLE
          </span>
        ) : isSynthetic ? (
          <span className="text-crt-amber font-bold flex items-center gap-1.5 glow-amber">
            <span className="w-2 h-2 rounded-full bg-crt-amber animate-ping"></span> SYNTH DEMO
          </span>
        ) : (
          <span className="text-crt-green font-bold flex items-center gap-1.5 text-shadow">
            <span className="w-2 h-2 rounded-full bg-crt-green animate-ping"></span> LIVE MIC
          </span>
        )}
      </div>
    </header>
  );
};
