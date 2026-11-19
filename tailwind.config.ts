import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#9B1C1C', dark: '#7A1414', light: '#FBE6E6' },
        gold: { DEFAULT: '#D4A23A', dark: '#6B4E0E', light: '#FBF1DC', text: '#3A2A05' },
        navy: { DEFAULT: '#1E2A44', dark: '#141C30' },
        cream: '#FFFBF4',
        line: '#EADFCB',
        muted: '#6B5E4E',
        leaf: { DEFAULT: '#2E6B47', light: '#E7F3EC', dark: '#1D5A37' },
      },
      fontFamily: {
        sans: ['Poppins', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
