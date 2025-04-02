/**
 * Navbar Component
 * Responsive navigation bar with dynamic links based on auth state
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../context/AuthContext";
import {
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const username = user?.profile?.username || user?.name?.split(" ")[0];
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout(); // Clears cookie-based token from context
      setSnackbarOpen(true);
      navigate("/signin");
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  };

  // Auth-based nav links
  const navLinks = user
    ? [
        { label: "Home", path: "/home" },
        { label: "Explore", path: "/explore" },
        { label: "Profile", path: `/profile/${user._id}` },
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
          <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight">
            {import.meta.env.VITE_APP_NAME || "MERN Social"}
          </Link>

          {user && (
            <span className="hidden sm:inline text-sm sm:text-base text-purple-200 italic">
              👋 Hi, {username}
            </span>
          )}

          {/* Desktop */}
          <div className="hidden md:flex space-x-6 text-sm sm:text-base">
            {navLinks.map((link) =>
              link.action ? (
                <button
                  key={link.label}
                  onClick={link.action}
                  className="hover:text-purple-300 transition"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.path}
                  to={link.path!}
                  className="hover:text-purple-300 transition"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Toggle */}
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

        {/* Mobile Nav */}
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
                    className="block text-left w-full text-white py-1 hover:text-purple-300 transition"
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

      {/* ✅ Confirmation Modal */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Are you sure you want to log out?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loggingOut}>
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
        </DialogActions>
      </Dialog>

      {/* ✅ Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          You have been logged out successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default Navbar;
