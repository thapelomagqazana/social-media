import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * PrivateRoute Component
 * - Redirects to /signin if user is not authenticated
 * - Otherwise, renders the requested route
 */
const PrivateRoute: React.FC = () => {
  const token = localStorage.getItem("token");

  return token ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
