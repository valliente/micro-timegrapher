/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crt: {
          bg: "#0a0c10",
          panel: "#121620",
          card: "#1a202c",
          border: "#2a3447",
          glow: "#ffb000",
          amber: "#ffb000",
          cyan: "#00f3ff",
          magenta: "#ff007f",
          green: "#00ff66",
          red: "#ff3344",
          dim: "#4a5568",
        },
      },
      boxShadow: {
        'amber-glow': '0 0 15px rgba(255, 176, 0, 0.4), 0 0 30px rgba(255, 176, 0, 0.2)',
        'cyan-glow': '0 0 15px rgba(0, 243, 255, 0.4), 0 0 30px rgba(0, 243, 255, 0.2)',
        'green-glow': '0 0 15px rgba(0, 255, 102, 0.4), 0 0 30px rgba(0, 255, 102, 0.2)',
        'crt-screen': 'inset 0 0 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 243, 255, 0.2)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
