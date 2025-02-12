import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute Component
 * - Redirects to /signin if user is not authenticated
 * - Otherwise, renders the requested route
 */
const PrivateRoute: React.FC = () => {
  const { isAuthenticated } = useAuth(); // Use Auth Context instead of localStorage
  console.log(isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
