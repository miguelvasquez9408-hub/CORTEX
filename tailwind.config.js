/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          dark: '#121212',
          cyan: '#00f3ff',
          purple: '#bd00ff',
          dim: '#1a1a1a'
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
