/**
 * Navbar Component
 * Responsive navigation bar with hamburger menu for mobile & tablet views
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigation links
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Explore", path: "/explore" },
    { label: "Sign In", path: "/signin" },
    { label: "Sign Up", path: "/signup" },
  ];

  return (
    <nav className="w-full fixed top-0 left-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 py-4">
        {/* App Name/Logo */}
        <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight">
          {import.meta.env.VITE_APP_NAME}
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex space-x-6 text-sm sm:text-base">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="hover:text-purple-300 transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburger Icon (visible on small & medium screens) */}
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

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden bg-indigo-950 px-6 py-4 space-y-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="block text-white text-base py-1 hover:text-purple-300 transition"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
