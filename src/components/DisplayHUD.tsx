import React from 'react';
import { Gauge, Clock, Zap, Flame, BarChart2 } from 'lucide-react';
import { WatchMetrics } from '../audio/AudioEngine';

interface DisplayHUDProps {
  metrics: WatchMetrics;
  isRunning: boolean;
}

export const DisplayHUD: React.FC<DisplayHUDProps> = ({ metrics, isRunning }) => {
  // Rate Color Coding
  const absRate = Math.abs(metrics.rateSd);
  const rateColorClass = !isRunning
    ? "text-gray-500"
    : absRate <= 4
    ? "text-crt-green glow-green"
    : absRate <= 12
    ? "text-crt-amber glow-amber"
    : "text-crt-red glow-magenta";

  // Beat Error Color Coding
  const beatErrColorClass = !isRunning
    ? "text-gray-500"
    : metrics.beatErrorMs <= 0.4
    ? "text-crt-green glow-green"
    : metrics.beatErrorMs <= 0.8
    ? "text-crt-amber glow-amber"
    : "text-crt-red";

  // Amplitude Color Coding
  const ampColorClass = !isRunning
    ? "text-gray-500"
    : metrics.amplitudeDeg >= 240 && metrics.amplitudeDeg <= 315
    ? "text-crt-cyan glow-cyan"
    : "text-crt-amber";

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-3 px-4 py-3 bg-[#0c1017] border-b border-crt-border/60">
      {/* 1. RATE DRIFT (s/d) */}
      <div className="bg-crt-panel border border-crt-border/80 rounded-lg p-3 flex flex-col justify-between shadow-inner relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span className="flex items-center gap-1.5 text-crt-amber">
            <Clock className="w-3.5 h-3.5" /> RATE
          </span>
          <span className="text-[10px] text-gray-500">s/day</span>
        </div>
        <div className="mt-2 text-center">
          <span className={`text-3xl font-black tracking-tight font-mono transition-colors ${rateColorClass}`}>
            {isRunning ? (metrics.rateSd > 0 ? `+${metrics.rateSd.toFixed(1)}` : metrics.rateSd.toFixed(1)) : "---"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500 font-semibold">
          {isRunning ? (absRate <= 5 ? "EXCELLENT DRIFT" : absRate <= 15 ? "ACCEPTABLE" : "NEEDS REGULATION") : "NO SIGNAL"}
        </div>
      </div>

      {/* 2. BEAT ERROR (ms) */}
      <div className="bg-crt-panel border border-crt-border/80 rounded-lg p-3 flex flex-col justify-between shadow-inner relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span className="flex items-center gap-1.5 text-crt-cyan">
            <Zap className="w-3.5 h-3.5" /> BEAT ERROR
          </span>
          <span className="text-[10px] text-gray-500">ms</span>
        </div>
        <div className="mt-2 text-center">
          <span className={`text-3xl font-black tracking-tight font-mono transition-colors ${beatErrColorClass}`}>
            {isRunning ? metrics.beatErrorMs.toFixed(1) : "---"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500 font-semibold">
          {isRunning ? (metrics.beatErrorMs <= 0.4 ? "BALANCED TICK/TOCK" : "ASYMMETRIC PALLET") : "NO SIGNAL"}
        </div>
      </div>

      {/* 3. AMPLITUDE (deg) */}
      <div className="bg-crt-panel border border-crt-border/80 rounded-lg p-3 flex flex-col justify-between shadow-inner relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span className="flex items-center gap-1.5 text-crt-green">
            <Flame className="w-3.5 h-3.5" /> AMPLITUDE
          </span>
          <span className="text-[10px] text-gray-500">deg (°)</span>
        </div>
        <div className="mt-2 text-center">
          <span className={`text-3xl font-black tracking-tight font-mono transition-colors ${ampColorClass}`}>
            {isRunning ? `${metrics.amplitudeDeg}°` : "---"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500 font-semibold">
          {isRunning ? "BALANCE SWING" : "NO SIGNAL"}
        </div>
      </div>

      {/* 4. BEAT RATE (VPH) */}
      <div className="bg-crt-panel border border-crt-border/80 rounded-lg p-3 flex flex-col justify-between shadow-inner relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span className="flex items-center gap-1.5 text-crt-magenta">
            <Gauge className="w-3.5 h-3.5" /> FREQUENCY
          </span>
          <span className="text-[10px] text-gray-500">VPH</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-black tracking-tight font-mono text-gray-100 glow-cyan">
            {metrics.detectedVph.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500 font-semibold">
          {(metrics.detectedVph / 3600).toFixed(1)} Hz / {(metrics.detectedVph / 3600 * 2).toFixed(0)} Ticks/s
        </div>
      </div>

      {/* 5. SIGNAL METER */}
      <div className="bg-crt-panel border border-crt-border/80 rounded-lg p-3 flex flex-col justify-between shadow-inner col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span className="flex items-center gap-1.5 text-amber-400">
            <BarChart2 className="w-3.5 h-3.5" /> SIGNAL STRENGTH
          </span>
          <span className="text-[10px] text-gray-500">{Math.round(metrics.signalLevel * 100)}%</span>
        </div>
        {/* LED Segment Bar */}
        <div className="mt-2 flex items-center gap-1 h-6 bg-black/50 p-1 rounded border border-gray-800">
          {Array.from({ length: 12 }).map((_, idx) => {
            const threshold = (idx + 1) / 12;
            const isActive = isRunning && metrics.signalLevel >= threshold;
            let barColor = "bg-crt-green shadow-green-glow";
            if (idx >= 8) barColor = "bg-crt-amber shadow-amber-glow";
            if (idx >= 10) barColor = "bg-crt-red shadow-magenta";

            return (
              <div
                key={idx}
                className={`h-full flex-1 rounded-sm transition-all duration-75 ${
                  isActive ? barColor : "bg-gray-800/60 opacity-30"
                }`}
              />
            );
          })}
        </div>
        <div className="mt-1 text-[10px] text-center text-gray-500 font-semibold">
          {metrics.tickCount > 0 ? `${metrics.tickCount} TICKS DETECTED` : "LISTEN FOR IMPULSES"}
        </div>
      </div>
    </div>
  );
};
