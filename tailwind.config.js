/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102A43',
        paper: '#F8F6F0',
        line: '#1A3148',
        muted: '#667788',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
        script: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
}
