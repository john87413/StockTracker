/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stock: {
          bg: '#09090b',          // var(--bg)
          secondary: '#18181b',   // var(--bg-secondary)
          card: '#111113',        // var(--card-bg)
          border: '#27272a',      // var(--card-border)
          primary: '#3b82f6',     // var(--primary)
          text: '#e4e4e7',        // var(--text-main)
          muted: '#71717a',       // var(--text-muted)
          
          // 台股紅漲綠跌
          up: '#ef4444',          // var(--up-color)
          down: '#22c55e',        // var(--down-color)
          flat: '#a1a1aa',        // var(--flat-color)
        }
      },
      fontFamily: {
        sans: ['"SF Pro TC"', '"PingFang TC"', '"Noto Sans TC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}