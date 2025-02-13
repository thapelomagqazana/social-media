import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // Enables dark mode
    primary: {
      main: '#00E5FF', // Neon Cyan
    },
    secondary: {
      main: '#FF00FF', // Neon Magenta
    },
    background: {
      default: '#0D0D0D', // Deep Black for Cyberpunk Aesthetic
      paper: 'rgba(25, 25, 25, 0.9)', // Glass Effect Background
    },
    text: {
      primary: '#E0E0E0', // Light Gray
      secondary: '#B0B0B0',
    },
    success: {
      main: '#00FF99', // Neon Green
    },
    error: {
      main: '#FF1744', // Bright Red
    },
    warning: {
      main: '#FF9800', // Neon Orange
    },
    info: {
      main: '#3D5AFE', // Deep Blue
    },
  },
  typography: {
    fontFamily: 'Orbitron, sans-serif', // Futuristic Font
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      textShadow: '0 0 10px #00E5FF',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      textShadow: '0 0 8px #FF00FF',
    },
    body1: {
      fontSize: '1rem',
      color: '#E0E0E0',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px',
          textTransform: 'uppercase',
          fontWeight: 700,
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.7)',
          transition: '0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 0 20px rgba(0, 229, 255, 1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(25, 25, 25, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 0 10px rgba(255, 0, 255, 0.3)',
        },
      },
    },
  },
});

export default theme;
