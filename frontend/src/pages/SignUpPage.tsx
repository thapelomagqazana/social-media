import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/userService";
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
import "../styles/Auth.css"; // Tailwind-based styles

/**
 * 📌 **Sign-Up Page**
 * - Implements **email/password registration** with **OAuth options**.
 * - Uses **React Hook Form & Yup** for validation.
 * - Modern **Glassmorphism UI** with full **responsiveness**.
 */

// 📜 Form Validation Schema
const signUpSchema = yup.object({
  name: yup.string().required("Name is required").min(3, "Must be at least 3 characters"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must include an uppercase letter")
    .matches(/[a-z]/, "Must include a lowercase letter")
    .matches(/[0-9]/, "Must include a number")
    .matches(/[@$!%*?&]/, "Must include a special character"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

// 📜 Type for Form Data
interface SignUpFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUpPage: React.FC = () => {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SignUpFormInputs>({
    resolver: yupResolver(signUpSchema),
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  /**
   * Handles form submission.
   */
  const onSubmit = async (data: SignUpFormInputs) => {
    setLoading(true);
    try {
      const response = await registerUser(data); 
      setSnackbar({ open: true, message: response.message, severity: "success" });

      if (rememberMe) {
        localStorage.setItem("savedUser", JSON.stringify(data));
      }

      reset();
      setTimeout(() => navigate("/signin"), 2000);
    }  catch (error: unknown) {
      if (error instanceof Error && "response" in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        setSnackbar({ open: true, message: axiosError.response?.data?.message || "Signup failed", severity: "error" });
      } else {
        setSnackbar({ open: true, message: "An unexpected error occurred", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper className="auth-container">
        {/* Avatar Placeholder */}
        <div className="avatar-container">
          <Person fontSize="large" />
        </div>

        <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>

        {/* Sign-Up Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Name Input */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Full Name" fullWidth margin="normal" error={!!errors.name} helperText={errors.name?.message} />
            )}
          />

          {/* Email Input */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Email" type="email" fullWidth margin="normal" error={!!errors.email} helperText={errors.email?.message} />
            )}
          />

          {/* Password Input */}
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

          {/* Confirm Password Input */}
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
            )}
          />

          {/* Remember Me Checkbox */}
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />}
            label="Remember Me"
          />

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            className="submit-button mt-4" 
            sx={{ color: "white" }} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>

          {/* OR Separator */}
          <div className="or-separator">————— OR ——————</div>

          {/* OAuth Login Options */}
          <div className="oauth-container">
            <Button variant="contained" color="error" startIcon={<Google />} fullWidth>
              Sign in with Google
            </Button>
            <Button variant="contained" color="primary" startIcon={<Facebook />} fullWidth sx={{ color: "white" }}>
              Sign in with Facebook
            </Button>
          </div>

          {/* Redirect to Sign-In */}
          <Typography variant="body2" align="center" className="sign-up-redirect">
            Already have an account? <Link to="/signin">Sign in</Link>
          </Typography>
        </form>
      </Paper>

      {/* Snackbar for Success/Error Messages */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default SignUpPage;
