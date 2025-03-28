/**
 * SignUpForm (Formik + Yup)
 * Formik handles form logic. Yup handles validation schema.
 * Includes Snackbar notifications and MUI + Tailwind + Framer Motion UI
 */

import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Snackbar,
    Alert,
  } from "@mui/material";
  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { Formik, Form, Field } from "formik";
  import * as Yup from "yup";
  import { AxiosError } from "axios";
  import { motion } from "framer-motion";
  import { signUp } from "../../services/authService";
  import { useAuth } from "../../context/AuthContext";
  
  // Validation Schema using Yup
  const SignUpSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[0-9]/, "Include a number")
      .matches(/[!@#$%^&*]/, "Include a special character")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords do not match")
      .required("Confirm your password"),
    agree: Yup.bool().oneOf([true], "You must accept the Terms"),
  });
  
  const initialValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  };
  
  const SignUpForm = () => {
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{
      open: boolean;
      message: string;
      severity: "success" | "error";
    }>({ open: false, message: "", severity: "success" });
  
    const showSnackbar = (message: string, severity: "success" | "error") => {
      setSnackbar({ open: true, message, severity });
    };
    const navigate = useNavigate();

    const { setUser } = useAuth();
  
    const handleCloseSnackbar = () => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    };
  
    const handleSubmit = async (values: typeof initialValues) => {
      setLoading(true);
      try {
        const { user } = await signUp({
          name: values.name,
          email: values.email,
          password: values.password,
        });
  
        showSnackbar("Account created successfully! Redirecting...", "success");
        setUser(user);
        // Redirect after delay
        setTimeout(() => {
          navigate(`/setup/${user.id}`);
        }, 2000);
      } catch (error: unknown) {
        const err = error as AxiosError<{ message: string }>;
        const errorMsg =
          err.response?.data?.message || "Sign-up failed. Please try again!";
        showSnackbar(errorMsg, "error");
      }
       finally {
        setLoading(false);
      }
    };
  
    return (
      <>
        <Formik
          initialValues={initialValues}
          validationSchema={SignUpSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange, handleBlur, values }) => (
            <Form className="space-y-4">
              <motion.div whileFocus={{ scale: 1.02 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
              </motion.div>
  
              <motion.div whileFocus={{ scale: 1.02 }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
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
  
              <motion.div whileFocus={{ scale: 1.02 }}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
              </motion.div>
  
              <FormControlLabel
                control={
                  <Field
                    type="checkbox"
                    name="agree"
                    as={Checkbox}
                    sx={{ color: "#4f46e5" }}
                  />
                }
                label="I agree to the Terms & Conditions"
              />
              {touched.agree && errors.agree && (
                <div className="text-sm text-red-600 -mt-2">{errors.agree}</div>
              )}
  
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  sx={{ backgroundColor: "#4f46e5", py: 1.5, borderRadius: "12px" }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
                </Button>
              </motion.div>
            </Form>
          )}
        </Formik>
  
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    );
  };
  
  export default SignUpForm;
  