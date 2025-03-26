/**
 * AppRoutes
 * Centralized route configuration using React Router v6
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Splash from "./pages/Splash";
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import ViewProfilePage from "./pages/ViewProfilePage";
import EditUserPage from './pages/EditUserPage';
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
            <main>
                <Routes> 
                    <Route path="/" element={<Splash />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/signin" element={<SignInPage />} />
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile/:userId" element={<ViewProfilePage />} />
                        <Route path="/profile/edit/:userId" element={<EditUserPage />} />
                    </Route>
                </Routes>
            </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default AppRoutes;
