import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { logoutUser } from "../services/userService";
import { useNavigate } from "react-router-dom";

// Define AuthContext type
interface AuthContextType {
  authUser: (data: any) => void;
  logout: () => void;
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
  exp: number; // Expiration time in seconds
  id: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
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
      logout();
    }

    setTimeout(() => {
      setIsCheckingAuth(false); // Wait for splash screen before rendering routes
    }, 4000);
  }, []);

  /**
   * Save user credentials on successful login
   */
  const authUser = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.user._id);
  };

  /**
   * Logout function
   */
  const logout = () => {
    logoutUser();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/signin");
  };

  return (
    <AuthContext.Provider value={{ authUser, logout }}>
      {!isCheckingAuth && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
