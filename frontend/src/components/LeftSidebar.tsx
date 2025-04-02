import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LeftSidebar = () => {
  const { user } = useAuth();

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 space-y-4 sticky top-20">
      <div className="flex items-center gap-2">
        <img
          src={user?.profile?.profilePicture || "/default-avatar.png"}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <p className="font-semibold">{user?.profile?.username}</p>
          <p className="text-xs text-gray-400">View Profile</p>
        </div>
      </div>
      <nav className="space-y-2">
        <Link to="/home" className="block hover:text-indigo-500">🏠 Home</Link>
        <Link to="/explore" className="block hover:text-indigo-500">🔍 Explore</Link>
        <Link to="/messages" className="block hover:text-indigo-500">💬 Messages</Link>
        <Link to="/notifications" className="block hover:text-indigo-500">🔔 Notifications</Link>
      </nav>
    </div>
  );
};

export default LeftSidebar;
