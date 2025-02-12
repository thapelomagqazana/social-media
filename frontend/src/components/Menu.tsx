import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Badge,
  Box,
  Avatar,
  Menu as MuiMenu,
  MenuItem,
} from "@mui/material";
import {
  Home,
  Notifications,
  Chat,
  ExitToApp,
  Person,
  Group,
  Login,
  HowToReg,
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import "../styles/Menu.css"; // Import futuristic styles

// Lazy load Drawer for performance optimization
const Drawer = lazy(() => import("@mui/material/Drawer"));

/**
 * @component Menu
 * @description NeoSocial Navigation Menu with Glassmorphism UI.
 * - **Unified Navbar & Mobile Drawer** for seamless experience.
 * - **Lazy Loaded Drawer** to reduce initial bundle size.
 * - **Interactive notifications** for messages & alerts.
 * - **Smooth animations with Neumorphic effects**.
 */
const Menu: React.FC = () => {
  const { logout } = useAuth();
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 1024px)"); // Adjusted for tablets & desktops

  // Toggle Mobile Drawer
  const toggleMobileMenu = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Open/Close Profile Dropdown
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Memoized Navigation Items for Performance
  const navItems = useMemo(() => {
    if (!userId) {
      return [
        { text: "Sign Up", icon: <HowToReg />, to: "/signup" },
        { text: "Sign In", icon: <Login />, to: "/signin" },
      ];
    }
    return [
      { text: "Home", icon: <Home />, to: "/home" },
      { text: "Messages", icon: <Badge badgeContent={3} color="primary"><Chat /></Badge>, to: "/messages" },
      { text: "Notifications", icon: <Badge badgeContent={5} color="secondary"><Notifications /></Badge>, to: "/notifications" },
      { text: "Users", icon: <Group />, to: "/users" },
      { text: "Profile", icon: <Person />, to: `/profile/${userId}` },
      { text: "Logout", icon: <ExitToApp />, onClick: () => { logout(); } },
    ];
  }, [userId, logout]);

  return (
    <>
      {/* 🚀 Glassmorphic Navbar */}
      <AppBar position="sticky" className="glass-navbar">
        <Toolbar className="toolbar">
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <IconButton edge="start" className="hamburger-menu" onClick={toggleMobileMenu}>
              <MenuIcon fontSize="large" />
            </IconButton>
          )}

          {/* Brand Name */}
          <Typography variant="h5" className="brand-title" onClick={() => userId ? navigate("/home") : navigate("/signin")}>
            🚀 NeoSocial
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box className="nav-links">
              {navItems.map(({ text, to, onClick, icon }) => (
                <Button
                  key={text}
                  component={to ? Link : "button"}
                  to={to}
                  onClick={onClick}
                  className="nav-button neumorphic-button"
                >
                  {icon} {text}
                </Button>
              ))}
            </Box>
          )}

          {/* Profile Dropdown */}
          {userId && (
            <>
              <IconButton color="inherit" onClick={handleMenuClick}>
                <Avatar className="profile-avatar" />
              </IconButton>
              <MuiMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem component={Link} to={`/profile/${userId}`} onClick={handleMenuClose}>
                  <AccountCircle /> Profile
                </MenuItem>
                <MenuItem onClick={() => { logout(); navigate("/signin"); }}>
                  <ExitToApp /> Logout
                </MenuItem>
              </MuiMenu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Suspense fallback={<div className="loading-drawer">Loading menu...</div>}>
        <Drawer anchor="left" open={mobileOpen} onClose={toggleMobileMenu} className="mobile-menu">
          <div className="drawer-header">
            <IconButton onClick={toggleMobileMenu} className="close-menu-button">
              <CloseIcon fontSize="large" />
            </IconButton>
          </div>
          {navItems.map(({ text, icon, to, onClick }) => (
            <ListItem
              key={text}
              component={to ? Link : "div"}
              to={to}
              onClick={onClick ? () => { toggleMobileMenu(); onClick(); } : toggleMobileMenu}
              className="drawer-item neumorphic-item"
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
