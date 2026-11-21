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
        sans: ['var(--font-sans)', 'var(--font-tamil)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(58,42,5,.05), 0 4px 16px -4px rgba(58,42,5,.10)',
        lift: '0 2px 4px rgba(58,42,5,.06), 0 14px 32px -10px rgba(122,20,20,.28)',
        glow: '0 0 0 4px rgba(212,162,58,.22)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        bump: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        twinkle: { '0%,100%': { opacity: '.35', transform: 'scale(.85)' }, '50%': { opacity: '1', transform: 'scale(1.1)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        pop: { '0%': { transform: 'scale(.6)', opacity: '0' }, '60%': { transform: 'scale(1.12)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        // "backwards" (not "both") so the animation releases transform afterwards and hover lifts still work.
        'fade-up': 'fade-up .45s cubic-bezier(.2,.7,.2,1) backwards',
        'fade-in': 'fade-in .3s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        bump: 'bump .45s cubic-bezier(.3,1.6,.5,1)',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        'spin-slow': 'spin 2.2s linear infinite',
        marquee: 'marquee 28s linear infinite',
        pop: 'pop .35s cubic-bezier(.3,1.6,.5,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
