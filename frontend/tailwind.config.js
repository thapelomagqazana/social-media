/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Enables Dark Mode Support
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          neonBlue: '#00E5FF',
          neonPink: '#FF00FF',
          neonGreen: '#00FF99',
          neonRed: '#FF1744',
          darkBackground: '#0D0D0D',
          glassBackground: 'rgba(25, 25, 25, 0.7)',
        },
        fontFamily: {
          futuristic: ['Orbitron', 'sans-serif'],
        },
        boxShadow: {
          neon: '0 0 10px rgba(0, 229, 255, 0.7)',
          glow: '0 0 20px rgba(255, 0, 255, 0.5)',
        },
        backdropBlur: {
          xs: '4px',
          sm: '8px',
          md: '12px',
          lg: '16px',
          xl: '20px',
        },
        animation: {
          fadeIn: 'fadeIn 0.8s ease-in-out',
          pulseGlow: 'pulseGlow 2s infinite',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          pulseGlow: {
            '0%': { boxShadow: '0 0 10px rgba(0, 229, 255, 0.7)' },
            '50%': { boxShadow: '0 0 20px rgba(0, 229, 255, 1)' },
            '100%': { boxShadow: '0 0 10px rgba(0, 229, 255, 0.7)' },
          },
        },
      },
    },
    plugins: [],
};
  