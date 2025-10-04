/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/forms'),
  ],
  daisyui: {
    themes: [
      {
        craftycook: {
          "primary": "#667eea",
          "secondary": "#764ba2", 
          "accent": "#fbbf24",
          "neutral": "#2d3748",
          "base-100": "#ffffff",
          "base-200": "#f7fafc",
          "base-300": "#edf2f7",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
      "light",
      "dark",
    ],
  },
}