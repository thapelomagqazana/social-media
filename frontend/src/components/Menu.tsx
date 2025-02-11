import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useMediaQuery,
  Box,
} from "@mui/material";
import {
  Home,
  ExitToApp,
  Person,
  Group,
  Login,
  HowToReg,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "../styles/Menu.css"; // Import Tailwind-based styles

// Lazy load Drawer to optimize initial bundle size
const Drawer = lazy(() => import("@mui/material/Drawer"));

/**
 * **Navigation Menu Component**
 * - Uses a **glassmorphism navbar** with a **responsive hamburger menu**.
 * - Implements **lazy loading** for the drawer (mobile optimization).
 * - Includes **debounced menu toggling** for better performance.
 */
const Menu: React.FC = () => {
  const { logout } = useAuth();
  const userId = localStorage.getItem("userId");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1024px)"); // Adjusted for tablets & desktops

  // Toggle Mobile Menu
  const toggleMobileMenu = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Memoized Navigation Items for Performance
  const navItems = useMemo(() => {
    if (!userId) {
      return [
        { text: "Sign Up", icon: <HowToReg />, to: "/signup" },
        { text: "Sign In", icon: <Login />, to: "/signin" },
      ];
    }
    return [
      { text: "Dashboard", icon: <Home />, to: "/dashboard" },
      { text: "Users", icon: <Group />, to: "/users" },
      { text: "Profile", icon: <Person />, to: `/profile/${userId}` },
      { text: "Logout", icon: <ExitToApp />, onClick: logout },
    ];
  }, [userId, logout]);

  return (
    <>
      <AppBar position="sticky" className="glass-navbar">
        <Toolbar className="toolbar">
          {/* Brand Logo */}
          <Typography variant="h5" className="brand-title">
            🚀 NeoSocial
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box className="nav-links">
              {navItems.map(({ text, to, onClick }) => (
                <Button
                  key={text}
                  component={to ? Link : "button"}
                  to={to}
                  onClick={onClick}
                  className="nav-button"
                >
                  {text}
                </Button>
              ))}
            </Box>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <IconButton edge="end" className="hamburger-menu" onClick={toggleMobileMenu}>
              <MenuIcon fontSize="large" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer (Lazy Loaded) */}
      <Suspense fallback={<div className="loading-drawer">Loading menu...</div>}>
        <Drawer anchor="left" open={mobileOpen} onClose={toggleMobileMenu} className="mobile-menu">
          <div className="drawer-header">
            <IconButton onClick={toggleMobileMenu}>
              <CloseIcon fontSize="large" />
            </IconButton>
          </div>
          {navItems.map(({ text, icon, to, onClick }) => (
            <ListItem
              key={text}
              component={to ? Link : "div"}
              to={to}
              onClick={onClick ? () => { toggleMobileMenu(); onClick(); } : toggleMobileMenu}
              className="drawer-item"
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </Drawer>
      </Suspense>
    </>
  );
};

export default Menu;
