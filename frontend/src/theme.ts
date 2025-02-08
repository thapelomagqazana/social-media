import { createTheme } from "@mui/material/styles";

/**
 * Material-UI Theme Matching Tailwind Colors
 * - Ensures color consistency between MUI & Tailwind
 */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1E90FF" }, // Electric Blue
    secondary: { main: "#BB86FC" }, // Cyber Purple
    background: { default: "#121212", paper: "#1a1a1a" },
    text: { primary: "#E0E0E0", secondary: "#AAAAAA" },
  },
  typography: {
    fontFamily: `"Poppins", sans-serif`, // Modern Font
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          textTransform: "none",
          boxShadow: "0 0 10px rgba(30, 144, 255, 0.5)", // Neon Glow Effect
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 15px rgba(30, 144, 255, 0.7)",
          },
        },
      },
    },
  },
});

export default theme;
