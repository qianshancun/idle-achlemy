/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'game-bg': {
          light: '#f8f8f8',
          dark: '#1a1a1a'
        },
        'panel-bg': {
          light: 'rgba(255, 255, 255, 0.95)',
          dark: 'rgba(40, 40, 40, 0.95)'
        }
      },
      fontFamily: {
        'game': ['system-ui', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
} 