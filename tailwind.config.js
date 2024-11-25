/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'rgb(147, 197, 253)' }, // bg-blue-300
          '100%': { backgroundColor: 'transparent' },
        }
      },
      animation: {
        highlight: 'highlight 2s ease-in-out',
      }
    },
  },
  plugins: [],
}
