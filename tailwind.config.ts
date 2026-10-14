import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5dfd0',
          300: '#9ec7b2',
          400: '#71aa8f',
          500: '#4e8e72',
          600: '#3a725b',
          700: '#2f5b49',
          800: '#28493c',
          900: '#1b3229',
          950: '#0a1610',
        },
        moss: {
          50: '#f5f7f2',
          100: '#e8ede1',
          200: '#d2ddc5',
          300: '#b4c7a0',
          400: '#94ad7b',
          500: '#75925c',
          600: '#5a7346',
          700: '#465937',
          800: '#3a482f',
          900: '#313d28',
        },
        smoke: {
          50: '#f6f5f3',
          100: '#e7e5e0',
          200: '#d0ccc3',
          300: '#b3aca0',
          400: '#978c7e',
          500: '#817567',
          600: '#695e52',
          700: '#544a42',
          800: '#463e37',
          900: '#231f1c',
          950: '#13110f',
        },
        ember: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        },
        'smoke-drift': {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '0.2' },
          '50%': { transform: 'scale(1.08) rotate(2deg)', opacity: '0.35' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.2' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'smoke-drift': 'smoke-drift 12s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
export default config;
