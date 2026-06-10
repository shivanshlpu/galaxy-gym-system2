/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          background: '#0D0D0D', // Void
          surface: '#111111', // Base
          card: '#1A1A1A', // Surface
          raised: '#222222', // Raised hover
          overlay: '#2A2A2A', // Overlay
        },
        border: {
          DEFAULT: '#2A2A2A',
          dashed: '#334488',
          active: '#CCFF00',
        },
        accent: {
          primary: '#CCFF00',
          dim: '#99CC00',
          glow: 'rgba(204, 255, 0, 0.12)',
        },
        status: {
          green: '#CCFF00',
          red: '#FF4444',
          amber: '#FF8C00',
          muted: '#555555',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#AAAAAA',
          muted: '#555555',
        },
        danger: {
          DEFAULT: '#FF4444',
          surface: 'rgba(255, 68, 68, 0.12)',
        },
        warning: {
          DEFAULT: '#FF8C00',
          surface: 'rgba(255, 140, 0, 0.10)',
        },
        chart: {
          1: '#CCFF00',
          2: '#FFFFFF',
          3: '#FF4444',
          4: '#FF8C00',
          5: '#555555',
        },
      },
      fontFamily: {
        display: ['Barlow', '"Arial Black"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(204, 255, 0, 0.25)',
        'glow-strong': '0 0 16px rgba(204, 255, 0, 0.4)',
        none: '0 0 0 0 transparent',
      },
      letterSpacing: {
        tag: '0.12em',
        btn: '0.08em',
      },
    },
  },
  plugins: [],
};
