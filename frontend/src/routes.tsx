/**
 * AppRoutes
 * Centralized route configuration using React Router v6
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Splash from "./pages/Splash";
import SignUp from "./pages/SignUp";
import SignInPage from './pages/SignInPage';
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
// import ViewProfilePage from "./pages/ViewProfilePage";
// import EditUserPage from './pages/EditUserPage';
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <div>
        <Navbar />
            <main>
                <Routes> 
                    <Route path="/" element={<Splash />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/signin" element={<SignInPage />} />
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/setup/:userId" element={<ProfileSetup />} />
                        <Route path="/home" element={<Home />} />
                        {/* <Route path="/profile/:userId" element={<ViewProfilePage />} />
                        <Route path="/profile/edit/:userId" element={<EditUserPage />} /> */}
                    </Route>
                </Routes>
            </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default AppRoutes;
