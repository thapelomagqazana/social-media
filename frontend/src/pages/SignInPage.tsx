import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/userService";
import {
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Visibility, VisibilityOff, Google, Facebook, Person } from "@mui/icons-material";
import { motion } from "framer-motion";
import "../styles/Auth.css";

/**
 * **Sign-In Page**
 * - Users can log in using email/password or OAuth.
 * - Implements form validation with **React Hook Form & Yup**.
 * - Features **Glassmorphism UI** with **responsive design**.
 * - **Smooth animations** for a futuristic experience.
 */

// Form Validation Schema
const signInSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

// Type for Form Inputs
interface SignInFormInputs {
  email: string;
  password: string;
}

/**
 * **Sign-In Component**
 * - Floating input labels with modern UI.
 * - Animated buttons for smooth interactions.
 * - OAuth login support (Google & Facebook).
 */
const SignInPage: React.FC = () => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SignInFormInputs>({
    resolver: yupResolver(signInSchema),
  });

  const navigate = useNavigate();
  const { authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  console.log(localStorage.getItem("token"));
  console.log(localStorage.getItem("userId"));

  /**
   * Handles form submission.
   * - Sends login data to the backend.
   * - Displays success/error messages via Snackbar.
   * - Redirects users to the dashboard after successful login.
   */
  const onSubmit = async (data: SignInFormInputs) => {
    setLoading(true);
    try {
      const response = await loginUser(data);
      authUser(response);
      console.log(localStorage.getItem("token"));
      console.log(localStorage.getItem("userId"));
 

      setSnackbar({ open: true, message: "Login successful", severity: "success" });

      // Reset form and redirect after success
      reset();
      setTimeout(() => navigate("/home"), 2000);
    } catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        setSnackbar({ open: true, message: axiosError.response?.data?.message || "Login failed", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "An unexpected error occurred", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      {/* Glassmorphism UI Container */}
      <Paper className="auth-container">
        {/* Avatar Placeholder */}
        <motion.div
          className="avatar-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Person fontSize="large" />
        </motion.div>

        <Typography variant="h4" align="center" gutterBottom>
          Sign In
        </Typography>

        {/* Sign-In Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email Input */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          {/* Password Input with Toggle Visibility */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            )}
          />

          {/* "Remember Me" Checkbox & Forgot Password */}
          <div className="flex justify-between items-center forgot-password-container">
            <FormControlLabel
              control={<Checkbox checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />}
              label="Remember Me"
            />
            <Typography variant="body2" className="forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </Typography>
          </div>

          <motion.div whileHover={{ scale: 1.05 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              className="submit-button mt-4" 
              disabled={loading}
              sx={{
                color: "white",
              }}
              >
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
          </motion.div>

          {/* OR Separator */}
          <div className="or-separator">—————OR ——————</div>

          {/* OAuth Login Options */}
          <div className="oauth-container">
            <Button variant="contained" color="error" startIcon={<Google />} fullWidth>
              Sign in with Google
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Facebook />} 
              fullWidth
              sx={{
                color: "white",
              }}
            >
              Sign in with Facebook
            </Button>
          </div>

          {/* Redirect to Sign-Up */}
          <Typography variant="body2" className="sign-up-redirect">
            Don't have an account? <Link to="/signup">Create Account</Link>
          </Typography>

        </form>
      </Paper>

      {/* Snackbar for success/error messages */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default SignInPage;
