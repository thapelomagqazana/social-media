import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
import {
  Snackbar,
  Alert,
  Backdrop,
  Button,
} from "@mui/material";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const username = user?.profile?.username || user?.name?.split(" ")[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setSnackbarOpen(true);
      navigate("/signin");
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  const navLinks = user
    ? [
        { label: "Home", path: "/home" },
        { label: "Explore", path: "/explore" },
        { label: "Profile", path: `/profile/${user?._id}` },
        { label: "Logout", action: () => setConfirmOpen(true) },
      ]
    : [
        { label: "Sign In", path: "/signin" },
        { label: "Sign Up", path: "/signup" },
      ];

  return (
    <>
      <nav className="w-full fixed top-0 left-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-4">
          {/* App Name */}
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "MERN Social"}
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Desktop Inline Links */}
            <div className="hidden md:flex items-center gap-6">
                  {navLinks
                    .filter((link) => link.label !== "Profile")
                    .map((link) =>
                      link.action ? (
                        <button
                          key={link.label}
                          onClick={link.action}
                          className="text-sm hover:text-purple-300 transition"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link
                          key={link.path}
                          to={link.path!}
                          className="text-sm hover:text-purple-300 transition"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
            </div>
            {user && (
              <>
                {/* Avatar */}
                <Link
                  to={`/profile/${user?._id}`}
                  className="hidden sm:block w-9 h-9 rounded-full border-2 border-indigo-400 overflow-hidden hover:ring-2 hover:ring-indigo-500 transition"
                  title="View Profile"
                >
                  <img
                    src={user?.profile?.profilePicture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </Link>
              </>
            )}

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="focus:outline-none"
                aria-label="Toggle menu"
              >
                {menuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="md:hidden bg-indigo-950 px-6 py-4 space-y-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {user && (
                <div className="text-sm text-purple-200 italic mb-2">
                  👋 Hi, {username}
                </div>
              )}
              {navLinks.map((link) =>
                link.action ? (
                  <button
                    key={link.label}
                    onClick={() => {
                      setMenuOpen(false);
                      link.action();
                    }}
                    className="block w-full text-left text-white py-1 hover:text-purple-300 transition"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path!}
                    onClick={() => setMenuOpen(false)}
                    className="block text-white text-base py-1 hover:text-purple-300 transition"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <Backdrop open className="z-50 bg-black/30" />
            <motion.div
              className="fixed top-1/2 left-1/2 z-50 bg-white rounded-xl shadow-xl p-6 w-80 text-center"
              initial={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={{ opacity: 0, scale: 0.8, y: "-50%", x: "-50%" }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
            >
              <h3 className="text-lg font-semibold mb-4">
                Are you sure you want to log out?
              </h3>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outlined"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loggingOut}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  sx={{ backgroundColor: "#4f46e5" }}
                >
                  {loggingOut ? "Logging out..." : "Yes, Log Out"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast after logout */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          You have been logged out successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
