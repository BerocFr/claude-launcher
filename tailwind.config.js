/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0B0B10',
          card: '#14141C',
          elevated: '#1C1C28',
          hover: '#232332',
        },
        brand: {
          orange: '#F06A35',
          'orange-dim': '#F06A3530',
          'orange-border': '#F06A3550',
          purple: '#9B72F6',
          'purple-dim': '#9B72F620',
          blue: '#4A9EF5',
          'blue-dim': '#4A9EF520',
        },
        ok: '#10B981',
        'ok-dim': '#10B98118',
        warn: '#F59E0B',
        'warn-dim': '#F59E0B18',
        danger: '#EF4444',
        'danger-dim': '#EF444418',
        tx: {
          1: '#EEEEF5',
          2: '#8888A8',
          3: '#45455A',
        },
        edge: 'rgba(255,255,255,0.06)',
        'edge-strong': 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'sans-serif'],
        mono: ['"SF Mono"', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin-slow': 'spin 1.4s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
