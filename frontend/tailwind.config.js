/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // 主强调色：琥珀金
        accent: {
          50: '#FDF8EF',
          100: '#FAEED6',
          200: '#F4DCA9',
          300: '#EFC877',
          400: '#EBB24F',
          500: '#E8A33D',
          600: '#CE8A28',
          700: '#A96D1F',
          800: '#85541B',
          900: '#6B441A',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.24s ease-out both',
        'scale-in': 'scale-in 0.14s ease-out both',
        'slide-up': 'slide-up 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}