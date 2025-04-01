/**
 * AuthContext (Cookie-Based Auth)
 * Manages global auth state via user object from secure cookies
 * Loads user on app start using GET /auth/me
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getMe, signOut } from "../services/authService";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fetch user on load using cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getMe(); // secure endpoint
        setUser(user); // Set user from backend
      } catch {
        setUser(null); // Not logged in or session expired
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Logout handler — clear user + cookie
  const logout = async () => {
    try {
      await signOut(); // Backend clears HTTP-only cookie
    } catch (err) {
      console.error("Logout error", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
