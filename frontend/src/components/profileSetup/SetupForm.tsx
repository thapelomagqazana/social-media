import { Formik, Form } from "formik";
import * as Yup from "yup";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import SetupHeader from "./SetupHeader";
import AvatarUploader from "./AvatarUploader";
import BioField from "./BioField";
import InterestsSelector from "./InterestsSelector";
import UsernameField from "./UsernameField";
import { Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useState } from "react";
import { motion } from "framer-motion";
import { updateProfile } from "../../services/profileService";
import { useAuth } from "../../context/AuthContext";
import { getMe } from "../../services/authService";
import { useParams } from "react-router-dom";

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username too long")
    .required("Username is required"),
  avatar: Yup.mixed().required("Avatar is required"),
  bio: Yup.string().required("Bio is required"),
  interests: Yup.array().min(1, "Select at least 1 interest"),
});

const initialValues = {
  username: "",
  avatar: null,
  bio: "",
  interests: [] as string[],
};

const SetupForm = () => {
  const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "info" | "warning";
    }>({
        open: false,
        message: "",
        severity: "success",
    });
  const [loading, setLoading] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();

  const { setUser } = useAuth();
  const handleClose = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("bio", values.bio);
      formData.append("interests", JSON.stringify(values.interests));
      formData.append("file", values.avatar!);

      await updateProfile(userId!, formData);
      const user = await getMe(); // secure endpoint
      setUser(user); // Set user from backend
      setSnackbar({ message: `Welcome to ${import.meta.env.VITE_APP_NAME}!`, severity: "success", open: true });

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error: unknown) {
        const err = error as AxiosError<{ message: string }>;
        const msg = err?.response?.data?.message || "Failed to save profile";
        setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ values, setFieldValue, errors, touched }) => (
          <Form className="space-y-6">
            <SetupHeader />

            <AvatarUploader
              value={values.avatar}
              onChange={(file) => setFieldValue("avatar", file)}
              error={touched.avatar && !!errors.avatar}
            />

            <UsernameField
              value={values.username}
              onChange={(e) => setFieldValue("username", e.target.value)}
              error={touched.username && errors.username}
            />

            <BioField
              value={values.bio}
              onChange={(e) => setFieldValue("bio", e.target.value)}
              error={touched.bio && errors.bio}
            />

            <InterestsSelector
              selected={values.interests}
              onChange={(arr) => setFieldValue("interests", arr)}
              error={
                touched.interests && typeof errors.interests === "string"
                  ? errors.interests
                  : undefined
              }
            />

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                variant="contained"
                sx={{ backgroundColor: "#4f46e5", py: 1.5, borderRadius: "12px" }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Finish Setup"}
              </Button>
            </motion.div>
          </Form>
        )}
      </Formik>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SetupForm;
