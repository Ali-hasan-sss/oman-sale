import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          foreground: '#ffffff'
        },
        desert: {
          50: '#fff7ed',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c'
        },
        ink: {
          900: '#0f172a',
          950: '#020617'
        }
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgb(15 23 42 / 0.35)'
      }
    }
  },
  plugins: []
};

export default config;
