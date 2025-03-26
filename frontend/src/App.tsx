import { useState, useEffect } from "react";
import FullScreenLoader from "./components/FullScreenLoader";
import AppRoutes from "./routes";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading or check auth
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <FullScreenLoader /> : <AppRoutes />;
};

export default App;
