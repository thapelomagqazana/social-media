import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
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
import "../styles/Menu.css"; // Import custom styles

/**
 * **Navigation Menu Component**
 * - Uses a **clean top bar** and moves navigation into a **hamburger menu**.
 * - Implements **Glassmorphism UI** for a **futuristic and sleek** look.
 * - Dynamically updates links based on authentication status.
 */
const Menu: React.FC = () => {
  const { logout } = useAuth();
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);


  // Toggle Mobile Menu
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar position="sticky" className="glass-navbar">
        <Toolbar className="toolbar">
          {/* Brand Logo */}
          <Typography variant="h5" className="brand-title" onClick={() => navigate("/")}>
            🚀 NeoSocial
          </Typography>

          {/* Hamburger Menu */}
          <IconButton edge="end" className="hamburger-menu" onClick={toggleMobileMenu}>
            <MenuIcon fontSize="large" />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer (Hamburger Menu) */}
      <Drawer anchor="left" open={mobileOpen} onClose={toggleMobileMenu} className="mobile-menu">
        <div className="drawer-header">
          <IconButton onClick={toggleMobileMenu}>
            <CloseIcon fontSize="large" />
          </IconButton>
        </div>
        <List>
          {!userId ? (
            <>
              <ListItem component="div" onClick={toggleMobileMenu} sx={{ cursor: "pointer" }}>
                <Link to="/signup" style={{ textDecoration: "none", color: "inherit", display: "flex", width: "100%" }}>
                  <ListItemIcon>
                    <HowToReg />
                  </ListItemIcon>
                  <ListItemText primary="Sign Up" />
                </Link>
              </ListItem>

              <ListItem component="div" onClick={toggleMobileMenu} sx={{ cursor: "pointer" }}>
                <Link to="/signin" style={{ textDecoration: "none", color: "inherit", display: "flex", width: "100%" }}>
                  <ListItemIcon>
                    <Login />
                  </ListItemIcon>
                  <ListItemText primary="Sign In" />
                </Link>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem component="div" onClick={toggleMobileMenu} sx={{ cursor: "pointer" }}>
                <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit", display: "flex", width: "100%" }}>
                  <ListItemIcon>
                    <Home />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </Link>
              </ListItem>

              <ListItem component="div" onClick={toggleMobileMenu} sx={{ cursor: "pointer" }}>
                <Link to="/users" style={{ textDecoration: "none", color: "inherit", display: "flex", width: "100%" }}>
                  <ListItemIcon>
                    <Group />
                  </ListItemIcon>
                  <ListItemText primary="Users" />
                </Link>
              </ListItem>

              <ListItem component="div" onClick={toggleMobileMenu} sx={{ cursor: "pointer" }}>
                <Link to={`/profile/${userId}`} style={{ textDecoration: "none", color: "inherit", display: "flex", width: "100%" }}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </Link>
              </ListItem>

              <ListItem component="div" onClick={logout} sx={{ cursor: "pointer" }}>
                <ListItemIcon>
                  <ExitToApp />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Menu;
