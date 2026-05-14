/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      animation: {
        'in': 'in .25s cubic-bezier(.16,1,.3,1)',
        'in-up': 'in-up .3s cubic-bezier(.16,1,.3,1)',
        'sheet': 'sheet .35s cubic-bezier(.16,1,.3,1)',
        'fade': 'fade .2s ease',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse 2.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'in': { from: { opacity: 0, transform: 'scale(.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'in-up': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'sheet': { from: { opacity: 0, transform: 'translateY(100%)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'fade': { from: { opacity: 0 }, to: { opacity: 1 } },
        'shimmer': { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
      },
    },
  },
  plugins: [],
}
