/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: 'rgb(var(--color-obsidian-rgb) / <alpha-value>)',
        charcoal: 'rgb(var(--color-charcoal-rgb) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        ivory: 'rgb(var(--color-ivory-rgb) / <alpha-value>)',
        champagne: {
          light: '#DFC396',
          DEFAULT: 'rgb(var(--color-champagne-rgb) / <alpha-value>)',
          dark: '#997D4E',
        },
        stone: {
          muted: 'rgb(var(--color-stone-rgb) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        burgundy: 'rgb(var(--color-burgundy-rgb) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
