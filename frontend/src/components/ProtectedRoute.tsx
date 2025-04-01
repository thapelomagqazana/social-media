import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "./FullScreenLoader";

const PrivateRoute = () => {
  const { user, isLoading } = useAuth();

  // Don’t render or redirect while loading auth state
  if (isLoading) return <FullScreenLoader />;

  return user ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default PrivateRoute;
