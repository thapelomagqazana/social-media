import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // or <Spinner />

  return user ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
