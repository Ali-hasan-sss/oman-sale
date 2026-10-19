import type { Config } from 'tailwindcss';

const channel = (token: string) => `rgb(var(${token}) / <alpha-value>)`;

const green = {
  50: channel('--oman-green-50'),
  100: channel('--oman-green-100'),
  200: channel('--oman-green-200'),
  300: channel('--oman-green-300'),
  400: channel('--oman-green-400'),
  500: channel('--oman-green-500'),
  600: channel('--oman-green-600'),
  700: channel('--oman-green-700'),
  800: channel('--oman-green-800'),
  900: channel('--oman-green-900'),
  950: channel('--oman-green-950')
};

const brick = {
  50: channel('--oman-brick-50'),
  100: channel('--oman-brick-100'),
  200: channel('--oman-brick-200'),
  300: channel('--oman-brick-300'),
  400: channel('--oman-brick-400'),
  500: channel('--oman-brick-500'),
  600: channel('--oman-brick-600'),
  700: channel('--oman-brick-700'),
  800: channel('--oman-brick-800'),
  900: channel('--oman-brick-900')
};

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif']
      },
      colors: {
        brand: {
          DEFAULT: channel('--oman-green-600'),
          ...green,
          foreground: channel('--oman-white')
        },
        green,
        emerald: green,
        brick,
        desert: {
          50: brick[50],
          400: brick[400],
          500: brick[500],
          600: brick[600]
        },
        ink: {
          900: channel('--oman-ink-900'),
          950: channel('--oman-ink-950')
        }
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgb(15 23 42 / 0.35)'
      },
      keyframes: {
        'assistant-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--oman-green-600) / 0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgb(var(--oman-green-600) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--oman-green-600) / 0)' }
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
