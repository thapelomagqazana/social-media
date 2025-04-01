import { useAuth, AuthProvider } from "./context/AuthContext";
import FullScreenLoader from "./components/FullScreenLoader";
import AppRoutes from "./routes";

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  return <AppRoutes />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
