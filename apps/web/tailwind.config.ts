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
      },
      keyframes: {
        'assistant-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(5, 150, 105, 0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgba(5, 150, 105, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(5, 150, 105, 0)' }
        },
        'assistant-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        'assistant-teaser': {
          '0%, 100%': { opacity: '1', transform: 'translateY(0)' },
          '50%': { opacity: '0.92', transform: 'translateY(-2px)' }
        }
      },
      animation: {
        'assistant-pulse': 'assistant-pulse 2.2s ease-out infinite',
        'assistant-float': 'assistant-float 3s ease-in-out infinite',
        'assistant-teaser': 'assistant-teaser 2.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
