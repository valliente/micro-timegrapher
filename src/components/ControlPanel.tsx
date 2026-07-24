import React from 'react';
import { Sliders, Filter, Gauge, Disc, Compass, RefreshCw, Volume2, Shield } from 'lucide-react';
import { AudioEngineOptions } from '../audio/AudioEngine';

interface ControlPanelProps {
  options: AudioEngineOptions;
  isSynthetic: boolean;
  isRunning: boolean;
  onUpdateOptions: (newOptions: Partial<AudioEngineOptions>) => void;
  onSetSynthDrift: (rateSd: number, beatErrorMs: number) => void;
  synthDriftSd: number;
  synthBeatErrorMs: number;
}

const VPH_PRESETS = [18000, 21600, 25200, 28800, 36000];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  options,
  isSynthetic,
  isRunning,
  onUpdateOptions,
  onSetSynthDrift,
  synthDriftSd,
  synthBeatErrorMs,
}) => {
  return (
    <div className="w-full bg-[#0a0d14] border-t border-crt-border px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
      {/* SECTION 1: FREQUENCY & VPH TARGET PRESETS */}
      <div className="bg-crt-panel border border-crt-border/70 rounded-lg p-4 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between border-b border-crt-border/50 pb-2 mb-3">
          <span className="flex items-center gap-2 text-xs font-bold text-crt-cyan tracking-wider">
            <Gauge className="w-4 h-4 text-crt-cyan" /> TARGET VPH PRESETS
          </span>
          <button
            onClick={() => onUpdateOptions({ autoDetectVph: !options.autoDetectVph })}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
              options.autoDetectVph
                ? "bg-crt-green/20 border-crt-green text-crt-green shadow-green-glow"
                : "bg-gray-800 border-gray-700 text-gray-400"
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>AUTO-DETECT: {options.autoDetectVph ? "ON" : "OFF"}</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {VPH_PRESETS.map((vph) => {
            const isSelected = options.vphPreset === vph;
            return (
              <button
                key={vph}
                onClick={() => onUpdateOptions({ vphPreset: vph, autoDetectVph: false })}
                className={`py-2 px-1 rounded flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? "bg-crt-cyan/20 border-crt-cyan text-crt-cyan shadow-cyan-glow font-extrabold"
                    : "bg-crt-card border-crt-border/40 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                <span className="text-xs font-mono">{vph / 1000}k</span>
                <span className="text-[9px] text-gray-500 font-semibold">{(vph / 3600).toFixed(1)}Hz</span>
              </button>
            );
          })}
        </div>

        {/* Lift Angle Setting */}
        <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-crt-border/50">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-crt-amber" /> LIFT ANGLE:
          </span>
          <select
            value={options.liftAngleDeg}
            onChange={(e) => onUpdateOptions({ liftAngleDeg: Number(e.target.value) })}
            className="bg-crt-card text-crt-amber text-xs font-bold font-mono px-2 py-1 rounded border border-crt-border focus:outline-none"
          >
            {[48, 50, 52, 53, 54, 56, 58].map((angle) => (
              <option key={angle} value={angle}>
                {angle}° (STANDARD)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 2: DSP AUDIO FILTERS & GAIN BOOST */}
      <div className="bg-crt-panel border border-crt-border/70 rounded-lg p-4 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between border-b border-crt-border/50 pb-2 mb-3">
          <span className="flex items-center gap-2 text-xs font-bold text-crt-amber tracking-wider">
            <Filter className="w-4 h-4 text-crt-amber" /> ACOUSTIC BANDPASS FILTERS
          </span>
          <span className="text-[10px] text-gray-500 font-semibold">2.5 kHz - 6.5 kHz PASSBAND</span>
        </div>

        <div className="space-y-3">
          {/* High Pass Cutoff */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">HIGH-PASS CUTOFF:</span>
              <span className="text-crt-cyan font-bold font-mono">{options.highPassCutoff} Hz</span>
            </div>
            <input
              type="range"
              min="1000"
              max="4000"
              step="100"
              value={options.highPassCutoff}
              onChange={(e) => onUpdateOptions({ highPassCutoff: Number(e.target.value) })}
              className="w-full accent-crt-cyan"
            />
          </div>

          {/* Low Pass Cutoff */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">LOW-PASS CUTOFF:</span>
              <span className="text-crt-amber font-bold font-mono">{options.lowPassCutoff} Hz</span>
            </div>
            <input
              type="range"
              min="4500"
              max="9000"
              step="100"
              value={options.lowPassCutoff}
              onChange={(e) => onUpdateOptions({ lowPassCutoff: Number(e.target.value) })}
              className="w-full accent-crt-amber"
            />
          </div>

          {/* Gain Boost */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">INPUT GAIN BOOST:</span>
              <span className="text-crt-green font-bold font-mono">{options.gainBoost.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.5"
              value={options.gainBoost}
              onChange={(e) => onUpdateOptions({ gainBoost: Number(e.target.value) })}
              className="w-full accent-crt-green"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: SYNTHETIC CALIBRATION CONTROLS (DEMO MODE) */}
      <div className="bg-crt-panel border border-crt-border/70 rounded-lg p-4 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between border-b border-crt-border/50 pb-2 mb-3">
          <span className="flex items-center gap-2 text-xs font-bold text-crt-magenta tracking-wider">
            <Sliders className="w-4 h-4 text-crt-magenta" /> DEMO SYNTH DRIFT SIMULATOR
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
            isSynthetic ? "bg-crt-magenta/20 text-crt-magenta border border-crt-magenta/40" : "bg-gray-800 text-gray-500"
          }`}>
            {isSynthetic ? "ACTIVE DEMO" : "STANDBY"}
          </span>
        </div>

        <div className="space-y-3">
          {/* Simulated Rate Drift Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">SIMULATED DRIFT (s/day):</span>
              <span className="text-crt-magenta font-bold font-mono">
                {synthDriftSd > 0 ? `+${synthDriftSd.toFixed(1)}` : synthDriftSd.toFixed(1)} s/d
              </span>
            </div>
            <input
              type="range"
              min="-25.0"
              max="25.0"
              step="0.5"
              value={synthDriftSd}
              onChange={(e) => onSetSynthDrift(Number(e.target.value), synthBeatErrorMs)}
              className="w-full accent-crt-magenta"
            />
          </div>

          {/* Simulated Beat Error Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">SIMULATED BEAT ERROR (ms):</span>
              <span className="text-crt-amber font-bold font-mono">{synthBeatErrorMs.toFixed(1)} ms</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.5"
              step="0.1"
              value={synthBeatErrorMs}
              onChange={(e) => onSetSynthDrift(synthDriftSd, Number(e.target.value))}
              className="w-full accent-crt-amber"
            />
          </div>

          <p className="text-[10px] text-gray-500 italic mt-1">
            * Drag sliders during Demo Synth mode to watch the dual dot drift lines dynamically change slope and separation in real time!
          </p>
        </div>
      </div>
    </div>
  );
};
