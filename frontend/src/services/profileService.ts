/**
 * profileService.ts
 * Handles profile-related API calls (update, get, etc.)
 */

import api from "./api";

/**
 * Fetch user profile details by user ID
 * @param userId - ID of the user
 */
export const getUserProfile = async (userId: string) => {
  const res = await api.get(`/api/profile/${userId}`);
  return res.data.profile;
};


/**
 * Update user profile by userId
 * @param userId string
 * @param formData FormData (with avatar, bio, interests, username)
 */
export const updateProfile = async (userId: string, formData: FormData) => {
  const response = await api.put(`/api/profile/${userId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
