/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#171717',
        charcoal: '#242424',
        ivory: '#E8DFCF',
        champagne: {
          light: '#DFC396',
          DEFAULT: '#C5A46D',
          dark: '#997D4E',
        },
        stone: {
          muted: '#77736B',
        },
        success: '#477A60',
        burgundy: '#873F4B',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
