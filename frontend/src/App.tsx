import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SplashLanding from "./pages/SplashLanding";
import theme from "./theme";
import "./index.css";


const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<SplashLanding />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
