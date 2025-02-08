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
import { Visibility, VisibilityOff, Google, Facebook } from "@mui/icons-material";

/**
 * Sign-In Page Component
 *
 * - Allows users to log in with email/password or OAuth.
 * - Implements form validation using React Hook Form and Yup.
 * - Integrates with backend authentication API.
 * - Features a sleek Glassmorphism UI.
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
 * Sign-In Component
 * - Provides a login form for users.
 * - Implements validation, error handling, and success feedback.
 * - Supports OAuth login (Google & Facebook).
 */
const SignInPage: React.FC = () => {
  // Initialize form handling with validation
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

  /**
   * Handles form submission.
   * - Sends login data to the backend.
   * - Displays success/error messages via a Snackbar.
   * - Redirects users to the dashboard upon successful login.
   * @param {SignInFormInputs} data - Form input data.
   */
  const onSubmit = async (data: SignInFormInputs) => {
    setLoading(true);
    try {
      const response = await loginUser(data);
      authUser(response); // Store user data in AuthContext

      // Store credentials if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("savedUser", JSON.stringify(data));
      }

      setSnackbar({ open: true, message: "Login successful", severity: "success" });

      // Reset form and navigate to dashboard
      reset();
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch {
      setSnackbar({ open: true, message: "Login failed. Try again.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      {/* Glassmorphism UI Container */}
      <Paper className="glassmorphism p-8 mt-10">
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
              <TextField {...field} label="Email" type="email" fullWidth margin="normal" autoFocus error={!!errors.email} helperText={errors.email?.message} />
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

          {/* "Remember Me" Checkbox */}
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />}
            label="Remember Me"
          />

          {/* Forgot Password Link */}
          <Typography variant="body2" align="right" className="mt-2">
            <Link to="/forgot-password">Forgot Password?</Link>
          </Typography>

          {/* OAuth Login Options */}
          <div className="flex justify-center gap-4 my-4">
            <Button variant="contained" color="error" startIcon={<Google />}>
              Google
            </Button>
            <Button variant="contained" color="primary" startIcon={<Facebook />}>
              Facebook
            </Button>
          </div>

          {/* Submit Button */}
          <Button type="submit" variant="contained" color="primary" fullWidth className="mt-4" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>

          {/* Redirect to Sign-Up */}
          <Typography variant="body2" align="center" className="mt-4">
            Don't have an account? <Link to="/signup">Sign up</Link>
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
