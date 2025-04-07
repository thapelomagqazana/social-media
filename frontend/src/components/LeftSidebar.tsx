import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const navItems = [
  { label: "Home", icon: "🏠", path: "/home" },
  { label: "Explore", icon: "🔍", path: "/explore" },
  { label: "Messages", icon: "💬", path: "/messages" },
  { label: "Notifications", icon: "🔔", path: "/notifications" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

const LeftSidebar = () => {
  const { user } = useAuth();
  console.log(user);
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`sticky top-20 transition-all duration-300 h-fit bg-white dark:bg-zinc-900 shadow-md rounded-xl
      ${expanded ? "w-64 p-4" : "w-16 p-2"} 
      hidden sm:block`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="mb-4 text-indigo-500 hover:text-indigo-700 transition"
        aria-label="Toggle Sidebar"
      >
        {expanded ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Profile Section */}
      {expanded && (
        <div className="flex items-center gap-3 mb-6">
          <img
            src={user?.profile?.profilePicture || "/default-avatar.png"}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {user?.profile?.username || "User"}
            </p>
            <Link
              to={`/profile/${user?._id}`}
              className="text-xs text-indigo-500 hover:underline"
            >
              View Profile
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-3 text-gray-600 dark:text-gray-300 text-sm">
        {navItems.map(({ label, icon, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 hover:text-indigo-600 transition
            ${expanded ? "justify-start" : "justify-center"}`}
          >
            <span className="text-lg">{icon}</span>
            {expanded && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default LeftSidebar;
