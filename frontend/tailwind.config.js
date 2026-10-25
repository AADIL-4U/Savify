/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oled: {
          black: '#000000',
          base: '#050505',
          card: '#0A0A0A',
          popover: '#111111',
          border: '#242424',
        }
      }
    },
  },
  plugins: [],
}