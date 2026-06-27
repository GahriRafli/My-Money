/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1E1E2E",
        muted: "#8C8CA0",
        line: "rgba(255,255,255,0.07)",
        canvas: "#161622",
        brand: "#FF6D4E",
        saffron: "#F59E0B",
        coral: "#FF5C5C",
        sky: "#4EADFF",
      },
    },
  },
  plugins: [],
};
