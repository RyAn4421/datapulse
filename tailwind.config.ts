import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-card': 'var(--bg-card)',
        'bg-hover': 'var(--bg-hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle': 'var(--accent-subtle)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        cyan: 'var(--cyan)',
        void: {
          950: '#05070F',
          900: '#0A0D1A',
          800: '#0F1324',
          700: '#161B31',
          600: '#1E2440',
          500: '#2A3254',
          400: '#3D4B6E',
        },
        ink: {
          100: '#EDF0F7',
          200: '#B8BFD8',
          300: '#6B7498',
          400: '#3D4B6E',
        },
        iris: {
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
        aqua: {
          400: '#34D9C3',
          500: '#14B8A6',
        },
        emerald: '#10B981',
        amber: '#F59E0B',
        rose: '#F43F5E',
      },
    }
  },
  plugins: [],
};
export default config;
