/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fb923c',
        },
        secondary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        bg: {
          main: '#f8fafc',
          glass: 'rgba(255, 255, 255, 0.7)',
        }
      },
      fontFamily: {
        outfit: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'ios': '16px',
        'ios-lg': '22px',
        'ios-xl': '28px',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
