import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zioRed: '#9B1B1F',
        zioGreen: '#1F5E3B',
        zioCream: '#F8F2E9',
        zioBlack: '#1D1D1B',
      },
    },
  },
  plugins: [],
};

export default config;
