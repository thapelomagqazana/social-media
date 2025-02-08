import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import UsersListPage from "./pages/UsersListPage";
import ViewProfilePage from "./pages/ViewProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";
import Menu from "./components/Menu";

/**
 * Main application component.
 * - Displays a splash screen before showing authentication routes.
 * - Manages protected and public routes.
 */
const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 4000);
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashScreen />
      ) : (
        /** Wrapping elements inside a parent `<>` fragment */
        <>
          <Menu />
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<SignInPage />} />

            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/profile/:userId" element={<ViewProfilePage />} />
              <Route path="/profile/edit/:userId" element={<EditProfilePage />} />
            </Route>
          </Routes>
        </>
      )}
    </>
  );
};

export default App;
