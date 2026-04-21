/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          bright: 'var(--surface-bright)',
          dim: 'var(--surface-dim)',
          'container-lowest': 'var(--surface-container-lowest)',
          'container-low': 'var(--surface-container-low)',
          container: 'var(--surface-container)',
          'container-high': 'var(--surface-container-high)',
          'container-highest': 'var(--surface-container-highest)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          dim: 'var(--primary-dim)',
          container: 'var(--primary-container)',
        },
        'on-primary': {
          DEFAULT: 'var(--on-primary)',
          container: 'var(--on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          dim: 'var(--secondary-dim)',
          container: 'var(--secondary-container)',
        },
        'on-secondary': {
          DEFAULT: 'var(--on-secondary)',
          container: 'var(--on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          dim: 'var(--tertiary-dim)',
          container: 'var(--tertiary-container)',
        },
        'on-tertiary': {
          DEFAULT: 'var(--on-tertiary)',
          container: 'var(--on-tertiary-container)',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
        },
        'on-error-container': 'var(--on-error-container)',
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        ambient: 'var(--shadow-ambient)',
        elevated: 'var(--shadow-elevated)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
