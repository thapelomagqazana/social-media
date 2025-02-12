import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Import AuthContext
import SplashScreen from "./pages/SplashScreen";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import UsersListPage from "./pages/UsersListPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import HomePage from "./pages/HomePage";
import PrivateRoute from "./components/PrivateRoute";
import Menu from "./components/Menu";

/**
 * Main application component.
 * - Displays a splash screen before showing authentication routes.
 * - Manages protected and public routes.
 */
const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Show splash screen only on first load
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      sessionStorage.setItem("hasSeenSplash", "true");
      setTimeout(() => setShowSplash(false), 2000); // Reduce splash duration
    } else {
      setShowSplash(false); // Skip splash if already seen
    }
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen />
      ) : (
        <>
          <Menu />
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/profile/:userId" element={<ViewProfilePage />} />
              <Route path="/profile/edit/:userId" element={<EditProfilePage />} />
            </Route>

            {/* Redirect unknown routes to home if authenticated, else signin */}
            <Route
              path="*"
              element={isAuthenticated ? <HomePage /> : <SignInPage />}
            />
          </Routes>
        </>
      )}
    </>
  );
};

export default App;
