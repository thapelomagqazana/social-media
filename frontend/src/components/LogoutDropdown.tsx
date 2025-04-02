/**
 * LogoutFlow.tsx
 * Implements user logout with dropdown, confirmation modal, and snackbar feedback.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert } from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const LogoutDropdown = () => {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setConfirmOpen(false);
    setSnackbarOpen(true);
    navigate("/signin");
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        <img
          src={user?.profile?.profilePicture || "/default-avatar.png"}
          alt="avatar"
          className="w-10 h-10 rounded-full border"
        />
      </button>

      {open && (
        <motion.div
          className="absolute right-0 z-50 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="py-1 text-sm text-gray-700 dark:text-gray-200">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              View Profile
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              Settings
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Log Out
            </button>
          </div>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>Are you sure you want to log out?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
          >
            Yes, Log Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          You have been logged out successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LogoutDropdown;
