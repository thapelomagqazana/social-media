import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00C2FF", // Neon Blue
    },
    secondary: {
      main: "#BB86FC", // Vibrant Purple
    },
    background: {
      default: "#121212", // Dark Mode Background
      paper: "#1E1E2E", // Glass UI Cards
    },
    text: {
      primary: "#F5F5F5",
    },
  },
  typography: {
    fontFamily: "Inter, Poppins, sans-serif",
    h4: { fontWeight: 700 },
    body1: { fontWeight: 400 },
  },
});

export default theme;
