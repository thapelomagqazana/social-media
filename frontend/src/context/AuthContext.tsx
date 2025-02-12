import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { logoutUser } from "../services/userService";
import { useNavigate } from "react-router-dom";

// Define AuthContext type
interface AuthContextType {
  authUser: (data: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Type for decoded JWT token
interface DecodedToken {
  exp: number;
  id: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * Function to check if the token is expired
   */
  const isTokenExpired = (token: string) => {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp * 1000 < Date.now(); // Convert expiration to milliseconds
    } catch (error) {
      return true; // If decoding fails, assume expired
    }
  };

  /**
   * Check user authentication state on app load
   */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || isTokenExpired(token)) {
      setIsAuthenticated(false);
      logout(); // Only log out if needed
    } else {
      setIsAuthenticated(true); // ✅ Persist auth state on reload
    }

    setTimeout(() => {
      setIsCheckingAuth(false); // ✅ Allow app to render once auth check is done
    }, 2000); // Reduced from 4000ms
  }, []);

  /**
   * Save user credentials on successful login
   */
  const authUser = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.user._id);
    setIsAuthenticated(true); // ✅ Update state when user logs in
  };

  /**
   * Logout function
   */
  const logout = () => {
    logoutUser();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    navigate("/signin");
  };

  return (
    <AuthContext.Provider value={{ authUser, logout, isAuthenticated }}>
      {!isCheckingAuth && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
