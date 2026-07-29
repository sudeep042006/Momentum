/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        momentum: {
          bg: '#050a0f',
          panel: '#0a121a',
          border: '#1e293b',
          green: {
            DEFAULT: '#10b981',
            glow: '#34d399',
            bright: '#22c55e'
          },
          text: {
            DEFAULT: '#ffffff',
            secondary: '#8b949e'
          }
        }
      }
    },
  },
  plugins: [],
}
