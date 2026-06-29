/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: stone trail-marker neutrals + a calm "signal" teal accent.
        ink: '#0b1220',
        signal: {
          50: '#effdfa',
          100: '#c9fbf1',
          200: '#96f3e3',
          300: '#5be4d2',
          400: '#2dccbd',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#107569',
          800: '#115e55',
          900: '#134e48',
        },
        // AI-attribution spectrum: each provider owns a fixed hue product-wide.
        // Scaled so badges can pair a light tint with a high-contrast text shade.
        attribution: {
          human: { 100: '#f1f5f9', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 700: '#334155' },
          claude: { 100: '#ffedd5', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 700: '#c2410c' },
          chatgpt: { 100: '#d1fae5', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 700: '#047857' },
          copilot: { 100: '#ede9fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 700: '#6d28d9' },
          gemini: { 100: '#e0f2fe', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 700: '#0369a1' },
        },
        // Functional / status colors. DEFAULT is the canonical hue; the ramp
        // lets badges pair a light tint with a high-contrast text shade.
        success: { DEFAULT: '#16a34a', 50: '#f0fdf4', 100: '#dcfce7', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
        warning: { DEFAULT: '#f59e0b', 50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        error: { DEFAULT: '#dc2626', 50: '#fef2f2', 100: '#fee2e2', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
        info: { DEFAULT: '#0ea5e9', 50: '#f0f9ff', 100: '#e0f2fe', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Typographic scale (root 16px). Adds text-h1…text-h6, text-display,
      // text-body*, text-caption alongside Tailwind's default text-* sizes.
      fontSize: {
        display: ['4.5rem', { lineHeight: '1.05' }],
        h1: ['3rem', { lineHeight: '1.08' }],
        h2: ['2.25rem', { lineHeight: '1.15' }],
        h3: ['1.75rem', { lineHeight: '1.25' }],
        h4: ['1.375rem', { lineHeight: '1.3' }],
        h5: ['1.125rem', { lineHeight: '1.4' }],
        h6: ['1rem', { lineHeight: '1.45' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
        caption: ['0.6875rem', { lineHeight: '1.45' }],
      },
      maxWidth: {
        container: '1140px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
