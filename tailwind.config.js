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
        pivot: {
          row: 'rgba(59, 130, 246, 0.2)', // blue-500 with opacity
          col: 'rgba(245, 158, 11, 0.2)', // amber-500 with opacity
          cell: 'rgba(239, 68, 68, 0.6)', // red-500 with opacity
        }
      }
    },
  },
  plugins: [],
}
