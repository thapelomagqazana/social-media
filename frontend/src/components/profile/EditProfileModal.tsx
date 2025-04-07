import { useState, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import { updateProfile } from "../../services/profileService";
import { getMe } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { Formik, Form } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import {
    Snackbar,
    Alert,
    Button,
    CircularProgress,
    TextField,
    Chip,
    Autocomplete,
} from "@mui/material";
  
import { UserProfile } from "../../types";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSuccess?: (updatedProfile: UserProfile) => void;
}

interface FormValues {
  username: string;
  bio: string;
  avatar: File | null;
  interests: string[];
}


const validationSchema = Yup.object().shape({
  username: Yup.string().min(3).max(20).required("Username is required"),
  bio: Yup.string().max(160, "Bio must be 160 characters or less").required("Bio is required"),
  avatar: Yup.mixed().nullable(),
  interests: Yup.array().min(1, "Select at least one interest"),
});

const EditProfileModal = ({ open, onClose, profile, onSuccess }: EditProfileModalProps) => {
  const { setUser } = useAuth();

  const [preview, setPreview] = useState<string | undefined>(profile.profilePicture);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (open) {
      setSnackbar({ open: false, message: "", severity: "success" });
      setPreview(profile.profilePicture);
    }
  }, [open, profile.profilePicture]);

  const initialValues: FormValues = {
    username: profile.username || "",
    bio: profile.bio || "",
    avatar: null,
    interests: profile.interests || [],
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("bio", values.bio);
    if (values.avatar) formData.append("file", values.avatar);
    formData.append("interests", JSON.stringify(values.interests));

    setUploading(true);
    try {
      await updateProfile(profile.user._id, formData);
      const updatedUser = await getMe();
      setUser(updatedUser);

      const updatedProfile: UserProfile = {
        ...profile,
        username: updatedUser.profile.username,
        bio: updatedUser.profile.bio,
        profilePicture: updatedUser.profile.profilePicture,
        interests: updatedUser.profile.interests,
        user: updatedUser,
      };

      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });

      resetForm();
      setPreview(updatedProfile.profilePicture);

      setTimeout(() => {
        onSuccess?.(updatedProfile);
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Update failed:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} title="Edit Profile">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, setFieldValue, touched, errors }) => (
          <Form className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <label className="relative group cursor-pointer">
                <img
                  src={preview || "/default-avatar.png"}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-600 shadow-md group-hover:opacity-80 transition duration-300"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFieldValue("avatar", file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0"
                />
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition">
                  Change Photo
                </span>
              </label>
            </div>

            {/* Username */}
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={values.username}
              onChange={handleChange}
              error={touched.username && Boolean(errors.username)}
              helperText={touched.username && errors.username}
              inputProps={{ maxLength: 20 }}
              sx={{
                '& label': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: '#c7d2fe' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiFormHelperText-root': { color: '#fca5a5' },
              }}
            />

            {/* Bio */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Bio"
              name="bio"
              value={values.bio}
              onChange={handleChange}
              error={touched.bio && Boolean(errors.bio)}
              helperText={touched.bio && errors.bio}
              inputProps={{ maxLength: 160 }}
              sx={{
                '& label': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'white' },
                  '&:hover fieldset': { borderColor: '#c7d2fe' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiFormHelperText-root': { color: '#fca5a5' },
              }}
            />
            <div className="text-right text-xs text-gray-400">
              {values.bio.length} / 160 characters
            </div>

            {/* Interests Field */}
            <Autocomplete
            multiple
            options={[
                "Music",
                "Sports",
                "Gaming",
                "Reading",
                "Coding",
                "Art",
                "Fitness",
                "Travel",
                "Food",
                "Movies",
            ]}
            getOptionLabel={(option) => option}
            value={values.interests}
            onChange={(_, value) => setFieldValue("interests", value)}
            renderInput={(params) => (
                <TextField
                {...params}
                label="Interests"
                variant="outlined"
                error={touched.interests && Boolean(errors.interests)}
                helperText={touched.interests && errors.interests}
                sx={{
                    '& label': { color: 'white' },
                    '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'white' },
                    '&:hover fieldset': { borderColor: '#c7d2fe' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                    },
                    '& .MuiFormHelperText-root': { color: '#fca5a5' },
                }}
                />
            )}
            renderTags={(value: string[], getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    label={option}
                    sx={{
                      backgroundColor: "#4f46e5",
                      color: "white",
                      fontWeight: 500,
                    }}
                  />
                ))
            } 
            />

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#4f46e5",
                py: 1.4,
                borderRadius: "10px",
                fontWeight: 600,
              }}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={22} color="inherit" /> : "Save Changes"}
            </Button>
          </Form>
        )}
      </Formik>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ModalWrapper>
  );
};

export default EditProfileModal;
