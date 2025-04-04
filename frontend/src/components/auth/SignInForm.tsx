import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Snackbar,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { signIn, getMe } from "../../services/authService";
import { AxiosError } from "axios";
import { useAuth } from "../../context/AuthContext";

// Yup Validation Schema
const SignInSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const SignInForm = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleClose = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (values: {
    email: string;
    password: string;
    remember: boolean;
  }) => {
    setLoading(true);
    try {
      // Send login request (sets secure cookie via backend)
      await signIn(values);

      // Set flag in localStorage or sessionStorage
      if (values.remember) {
        localStorage.setItem("rememberMe", "true");
      } else {
        sessionStorage.setItem("rememberMe", "true");
      }

      const freshUser = await getMe();
      // Save user in context
      setUser(freshUser);

      // Show success snackbar
      setSnackbar({
        open: true,
        message: "Login successful! Redirecting to your newsfeed...",
        severity: "success",
      });

      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      const msg = err.response?.data?.message || "Login failed. Try again!";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-indigo-900">
          Welcome back to {import.meta.env.VITE_APP_NAME}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect with your friends!
        </p>
      </div>

      <Formik
        initialValues={{ email: "", password: "", remember: false }}
        validationSchema={SignInSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleBlur, touched, errors }) => (
          <Form className="space-y-4">
            <motion.div whileFocus={{ scale: 1.02 }}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
            </motion.div>

            <motion.div whileFocus={{ scale: 1.02 }}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && Boolean(errors.password)}
                helperText={touched.password && errors.password}
              />
            </motion.div>

            <FormControlLabel
              control={<Field type="checkbox" name="remember" as={Checkbox} />}
              label="Remember Me"
            />

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                sx={{ backgroundColor: "#4f46e5", py: 1.5, borderRadius: "12px" }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </Button>
            </motion.div>

            <div className="flex justify-between text-sm mt-2">
              <Link to="/signup" className="text-indigo-600 hover:underline">
                Don't have an account? Sign Up
              </Link>
              <Link to="/forgot-password" className="text-gray-500 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </Form>
        )}
      </Formik>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleClose}>
        <Alert severity={snackbar.severity} onClose={handleClose} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SignInForm;
