/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enables dark mode switching
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00C2FF", // Neon Blue
        secondary: "#BB86FC", // Vibrant Purple
        background: "#121212", // Dark Mode Background
        text: "#F5F5F5", // Soft White for Readability
        card: "#1E1E2E", // Glass UI Cards
      },
      boxShadow: {
        neumorphism: "6px 6px 12px #121212, -6px -6px 12px #2A2A38",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
  plugins: [],
};
