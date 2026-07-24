import React, { useEffect, useRef, useState } from 'react';
import { AudioWaveform, Sliders, Activity, Disc, Maximize2 } from 'lucide-react';
import { WatchMetrics } from '../audio/AudioEngine';

export type VisualizerMode = 'oscilloscope' | 'dotdrift' | 'spectrum';

interface VisualizerCanvasProps {
  analyserNode: AnalyserNode | null;
  metrics: WatchMetrics;
  isRunning: boolean;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  analyserNode,
  metrics,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('dotdrift');
  const [sweepSpeed, setSweepSpeed] = useState<number>(2); // 1, 2, 3 speed multiplier

  // Animation Loop Ref
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let historyDotsCopy: typeof metrics.historyDots = [];

    const render = () => {
      // Responsive resolution
      const width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.parentElement?.clientHeight || 450;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Background CRT dark fill
      ctx.fillStyle = '#090c10';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Overlay
      drawGrid(ctx, width, height);

      if (mode === 'oscilloscope') {
        drawOscilloscope(ctx, width, height, analyserNode);
      } else if (mode === 'dotdrift') {
        historyDotsCopy = metrics.historyDots;
        drawDotDriftTape(ctx, width, height, historyDotsCopy, metrics.rateSd);
      } else if (mode === 'spectrum') {
        drawFrequencySpectrum(ctx, width, height, analyserNode);
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [mode, analyserNode, metrics, sweepSpeed]);

  // CRT Grid Drawing
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';

    const stepX = 40;
    const stepY = 40;

    ctx.beginPath();
    for (let x = 0; x <= width; x += stepX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += stepY) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Center reticle crosshair
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
  };

  // Mode 1: CRT Oscilloscope Waveform
  const drawOscilloscope = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    analyser: AnalyserNode | null
  ) => {
    if (!analyser || !isRunning) {
      // Idle line with slight phosphor noise
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      return;
    }

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    const sliceWidth = (width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i];
      const y = (height / 2) + v * (height / 2.5);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Trigger Line indicator
    ctx.strokeStyle = 'rgba(255, 176, 0, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2 - 40);
    ctx.lineTo(width, height / 2 - 40);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Mode 2: Traditional Timegrapher Dot Drift Tape
  const drawDotDriftTape = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    historyDots: Array<{ xTime: number; driftMs: number; isTick: boolean }>,
    currentRateSd: number
  ) => {
    // Tape Header Labels
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = '#ffb000';
    ctx.fillText('PAPER TAPE DRIFT PLOT [HORIZONTAL: TIME / VERTICAL: PHASE DRIFT]', 20, 25);

    // Zero-drift center line
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (historyDots.length === 0 || !isRunning) {
      // Demo simulated drift line when not active or populating
      const time = Date.now() * 0.001;
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 6;
      for (let x = 0; x < width; x += 12 * sweepSpeed) {
        const driftY = height / 2 - (x * (currentRateSd || 3.5) * 0.08);
        ctx.beginPath();
        ctx.arc(x, driftY + Math.sin(x * 0.05 + time) * 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, driftY + Math.sin(x * 0.05 + time) * 1.5 + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      return;
    }

    // Render recorded dot history
    const dotSpacing = 3 * sweepSpeed;
    const startX = width - historyDots.length * dotSpacing;

    ctx.shadowBlur = 8;

    historyDots.forEach((dot, index) => {
      const x = startX + index * dotSpacing;
      if (x < 0 || x > width) return;

      // Vertical position shifts according to cumulative drift slope
      // Rate +10 s/d = dot shifts up; -10 s/d = shifts down
      const driftSlope = currentRateSd * (index * 0.015);
      const y = (height / 2) - (driftSlope + dot.driftMs * 2);

      // Tick = Amber dot, Tock = Cyan dot
      if (dot.isTick) {
        ctx.fillStyle = '#ffb000';
        ctx.shadowColor = '#ffb000';
      } else {
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
      }

      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  };

  // Mode 3: FFT Frequency Spectrum Display
  const drawFrequencySpectrum = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    analyser: AnalyserNode | null
  ) => {
    if (!analyser || !isRunning) {
      // Idle Spectrum baseline
      ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.fillRect(0, height - 4, width, 4);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Highlight 2.5kHz - 6.0kHz watch tick bandpass zone
    const sampleRate = analyser.context.sampleRate;
    const nyquist = sampleRate / 2;
    const bandLowX = (2500 / nyquist) * width;
    const bandHighX = (6500 / nyquist) * width;

    // Bandpass region highlight box
    ctx.fillStyle = 'rgba(255, 176, 0, 0.08)';
    ctx.fillRect(bandLowX, 0, bandHighX - bandLowX, height);

    ctx.strokeStyle = 'rgba(255, 176, 0, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(bandLowX, 0, bandHighX - bandLowX, height);
    ctx.setLineDash([]);

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#ffb000';
    ctx.fillText('RUBY JEWEL BANDPASS PASSBAND [2.5 kHz - 6.5 kHz]', bandLowX + 10, 20);

    // Draw Spectrum Bars
    const barWidth = (width / bufferLength) * 2.2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * (height * 0.85);

      // Color code frequency region
      const freqHz = (i / bufferLength) * nyquist;
      if (freqHz >= 2500 && freqHz <= 6500) {
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
      if (x > width) break;
    }

    ctx.shadowBlur = 0;
  };

  return (
    <div className="w-full flex-1 min-h-[380px] bg-[#07090e] flex flex-col relative overflow-hidden border-b border-crt-border">
      {/* Visualizer Mode Toolbar & CRT Overlay Controls */}
      <div className="w-full bg-[#0d111a]/90 backdrop-blur border-b border-crt-border/50 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-10 select-none">
        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-md border border-crt-border/60">
          <button
            onClick={() => setMode('dotdrift')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === 'dotdrift'
                ? 'bg-crt-amber/20 border border-crt-amber text-crt-amber shadow-amber-glow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>DOT DRIFT TAPE</span>
          </button>

          <button
            onClick={() => setMode('oscilloscope')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === 'oscilloscope'
                ? 'bg-crt-cyan/20 border border-crt-cyan text-crt-cyan shadow-cyan-glow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <AudioWaveform className="w-3.5 h-3.5" />
            <span>OSCILLOSCOPE WAVE</span>
          </button>

          <button
            onClick={() => setMode('spectrum')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === 'spectrum'
                ? 'bg-crt-magenta/20 border border-crt-magenta text-crt-magenta shadow-magenta'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>FFT SPECTRUM</span>
          </button>
        </div>

        {/* Sweep Speed Selector */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-semibold text-crt-cyan">SWEEP SPEED:</span>
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setSweepSpeed(speed)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                sweepSpeed === speed
                  ? 'bg-crt-cyan text-black border-crt-cyan font-black'
                  : 'bg-crt-card border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {speed}X
            </button>
          ))}
        </div>
      </div>

      {/* Main CRT Screen Container with Glare Effect & Scanlines */}
      <div className="relative flex-1 w-full h-full crt-grid crt-screen-glare">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute inset-0 crt-scanline pointer-events-none" />
      </div>
    </div>
  );
};
