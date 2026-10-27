/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        momentum: {
          bg: "#000000",
          surface: "#000000",
          card: "#000000",
          cardElevated: "#000000",
          input: "#000000",
          border: "#18241B",
          borderLight: "#243629",
          emerald: "#00E676",
          emeraldDeep: "#064A25",
          emeraldMuted: "#12301E",
          textPrimary: "#FFFFFF",
          textSecondary: "#8E9C92",
          textMuted: "#526056",
          textDisabled: "#333D36",
        },
      },
    },
  },
  plugins: [],
};
