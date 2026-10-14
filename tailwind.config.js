/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand:   { DEFAULT: "#3B82F6", dark: "#0A84FF" },
        ink:     { DEFAULT: "#1B2559", dark: "#FFFFFF" },
        muted:   { DEFAULT: "#7A869F", dark: "#8E8E93" },
        line:    { DEFAULT: "#DCE6F5", dark: "#3A3A3C" },
        surface: { DEFAULT: "#FFFFFF", dark: "#1C1C1E" },
        field:   { DEFAULT: "#FFFFFF", dark: "#2C2C2E" },
        canvas:  { DEFAULT: "#DCE9FB", dark: "#000000" },
      },
    },
  },
  plugins: [],
};