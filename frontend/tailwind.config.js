/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensure Tailwind scans your components
    "./node_modules/@mui/**/*.{js,jsx,ts,tsx}" // Include MUI
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E90FF", // Electric Blue
        secondary: "#BB86FC", // Cyber Purple
        accent: "#00FF7F", // Lime Green
        background: "#121212", // Dark Mode
        text: "#E0E0E0", // Light Gray for readability
      },
      boxShadow: {
        neo: "0px 4px 30px rgba(30, 144, 255, 0.5)", // Neon glow effect
      },
      animation: {
        glitch: "glitch 1.5s infinite alternate",
      },
      keyframes: {
        glitch: {
          "0%": { textShadow: "2px 2px 2px #ff00ff" },
          "50%": { textShadow: "-2px -2px 2px #00ffff" },
          "100%": { textShadow: "2px 2px 2px #ff00ff" },
        },
      },
    },
  },
  plugins: [],
};
