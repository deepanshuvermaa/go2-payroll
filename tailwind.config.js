/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette from WorkLog MVP
        ink: {
          DEFAULT: '#0d0d0d',
          2: '#3a3a3a',
          3: '#767676',
          4: '#b0b0b0',
        },
        paper: {
          DEFAULT: '#f8f6f1',
          2: '#eeebe3',
          3: '#e3dfd4',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          DEFAULT: '#2563EB',
          light: '#dbeafe',
        },
        gold: {
          DEFAULT: '#c9933a',
          light: '#fef3c7',
        },
        success: {
          DEFAULT: '#1a6b4a',
          light: '#d1fae5',
          dark: '#065f46',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fef3c7',
          dark: '#92400e',
        },
        danger: {
          DEFAULT: '#c0392b',
          light: '#fee2e2',
          dark: '#991b1b',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#dbeafe',
          dark: '#1e40af',
        },
        grape: {
          DEFAULT: '#6d28d9',
          light: '#ede9fe',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,.12)',
        'soft': '0 2px 8px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
