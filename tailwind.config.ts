import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      colors: {
        blue: {
          100: '#042540',
          400: '#2589FE',
          500: '#0070F3',
          600: '#2F6FEB',
        },
        yellow: {
          100: '#c09f4a',
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-slow-reverse': 'spin 2.5s linear infinite reverse',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.5s ease-out forwards',
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
// tailwind.config.js

