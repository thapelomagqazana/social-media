/**
 * AuthContext (Advanced: Token Expiry Detection + Polling)
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
  profile: {
    bio: string;
    interests: string[];
    profilePicture: string;
    username: string;
  };
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

  // Fetch user initially and on interval
  useEffect(() => {
    const rememberMe =
      localStorage.getItem("rememberMe") || sessionStorage.getItem("rememberMe");

    if (!rememberMe) {
      setIsLoading(false);
      return;
    }

    let interval: NodeJS.Timeout;

    const fetchUser = async () => {
      try {
        const user = await getMe();
        setUser(user);
      } catch {
        setUser(null);
        localStorage.removeItem("rememberMe");
        sessionStorage.removeItem("rememberMe");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser(); // Initial fetch

    // Refresh user every 5 minutes
    interval = setInterval(fetchUser, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Logout clears session + flags
  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error", err);
    }
    setUser(null);
    localStorage.removeItem("rememberMe");
    sessionStorage.removeItem("rememberMe");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
