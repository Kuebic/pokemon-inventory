/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          red: '#FF0000',
          blue: '#3B4CCA',
          yellow: '#FFDE00',
          gold: '#B3A125',
          dark: '#1a1a1a',
        }
      }
    },
  },
  plugins: [],
}