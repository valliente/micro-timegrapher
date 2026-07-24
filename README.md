# Micro-Timegrapher ⏱️⚡

> **Ambient, Retro-Futuristic Acoustic Mechanical Watch Analyzer & CRT Oscilloscope Visualizer**

Micro-Timegrapher is a high-precision, standalone single-page web application designed to analyze the acoustic tick-tock signature of mechanical watches using native **Web Audio API** digital signal processing (DSP) and **HTML5 Canvas** oscilloscope rendering.

---

## 🌟 Key Features

1. **Acoustic Mechanical Watch DSP Engine**
   - Live microphone feed via `navigator.mediaDevices.getUserMedia`.
   - Dual `BiquadFilterNode` acoustic bandpass chain (~2.5 kHz to 6.5 kHz) to isolate ruby jewel escapement clicks from ambient room noise and low-frequency hum.
   - Real-time peak/transient detector measuring:
     - **Rate Drift**: Daily timing error in seconds/day (+/- s/d).
     - **Beat Error**: Millisecond asymmetry (ms) between "tick" and "tock" pallet jewel swings.
     - **Amplitude**: Balance wheel rotation angle (deg °) based on customizable Lift Angle settings ($48^\circ$–$58^\circ$).
     - **VPH Auto-Detection / Lock**: Automatic frequency detection across standard mechanical watch rates (18,000, 21,600, 25,200, 28,800, and 36,000 vph).

2. **CRT Oscilloscope & Paper-Tape Visualizers**
   - **Timegrapher Dot Drift Tape**: Traditional paper-tape printout simulation plotting dual tick-tock dot drift slopes over time.
   - **CRT Oscilloscope Wave**: Live high-pass filtered PCM waveform sweep trace with CRT grid overlay and phosphor glow effects.
   - **FFT Frequency Spectrum**: Real-time acoustic frequency spectrum highlighting the ruby jewel impact passband.

3. **Built-in Demo Watch Sound Synthesizer**
   - Integrated acoustic synthesizer generating ultra-realistic mechanical watch escapement tick-tock audio impulses.
   - Interactive sliders to dynamically simulate Rate Drift (+/- 25 s/d) and Beat Error (0–2.5 ms) live without needing a physical watch attached.

4. **Retro Synthwave Control Panel & HUD**
   - Modern dark lab aesthetic with CRT amber, cyan phosphor, and neon magenta glow effects.
   - Real-time digital HUD display, LED signal strength meter, adjustable input gain boost, bandpass filter cutoff sliders, and headphone audio monitoring.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- `npm` or `pnpm`

### Installation Commands

```bash
# Navigate to the project directory
cd H:\antigravity

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open your browser at `http://localhost:3000` to launch the application.

---

## 🛠️ Build & Deployment

### Production Build

To compile TypeScript and build the optimized production assets:

```bash
npm run build
```

To preview the built static bundle locally:

```bash
npm run preview
```

### GitHub Pages Deployment Workflow

This repository includes a full GitHub Actions deployment workflow at `.github/workflows/deploy.yml`. 

Whenever code is pushed to the `main` branch, GitHub Actions automatically builds the project and deploys it to GitHub Pages.

---

## 📂 Project Directory Structure

```
H:\antigravity\
├── .github\
│   └── workflows\
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── public\                     # Static assets and favicons
├── src\
│   ├── audio\
│   │   ├── AudioEngine.ts      # Core Web Audio API DSP & transient detector
│   │   └── WatchSynthesizer.ts # Synthetic watch tick audio generator
│   ├── components\
│   │   ├── Header.tsx          # Branding & input source controls
│   │   ├── DisplayHUD.tsx      # Real-time metrics HUD readout
│   │   ├── ControlPanel.tsx    # Analog retro filter & VPH sliders
│   │   └── VisualizerCanvas.tsx# CRT Canvas oscilloscope & paper tape renderer
│   ├── hooks\
│   │   └── useWatchAudioProcessor.ts # React stateful Web Audio hook
│   ├── styles\
│   │   └── index.css           # Tailwind directives & CRT glow styling
│   ├── App.tsx                 # Main application dashboard layout
│   └── main.tsx                # Vite React DOM entry point
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## 📜 License

MIT License. Designed with Google Antigravity Agentic AI.
