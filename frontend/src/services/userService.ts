import api from "./api";

/**
 * Fetch posts created by a user
 * @param userId - ID of the user
 * @param page - Pagination page
 * @param limit - Number of posts per page
 */
export const getUserPosts = async (userId: string, page = 1, limit = 10) => {
  const res = await api.get(`/api/users/${userId}/posts`, {
    params: { page, limit },
  });
  return res.data;
};

/**
 * Fetch posts liked by a user
 * @param userId - ID of the user
 * @param page - Pagination page
 * @param limit - Number of posts per page
 */
export const getUserLikedPosts = async (userId: string, page = 1, limit = 10) => {
  const res = await api.get(`/api/users/${userId}/liked-posts`, {
    params: { page, limit },
  });
  return res.data;
};

/**
 * Fetch media posts (posts with images) by a user
 * @param userId - ID of the user
 * @param page - Pagination page
 * @param limit - Number of posts per page
 */
export const getUserMediaPosts = async (userId: string, page = 1, limit = 10) => {
  const res = await api.get(`/api/users/${userId}/media-posts`, {
    params: { page, limit },
  });
  return res.data;
};

/**
 * Get followers of a user
 * @param userId - ID of the user
 */
export const getUserFollowers = async (userId: string) => {
  const res = await api.get(`/api/users/${userId}/followers`);
  return res.data;
};

/**
 * Get users that a user is following
 * @param userId - ID of the user
 */
export const getUserFollowing = async (userId: string) => {
  const res = await api.get(`/api/users/${userId}/following`);
  return res.data;
};

/**
 * Get statistics for a user (followers, following, post count)
 * @param userId - ID of the user
 */
export const getUserStats = async (userId: string) => {
  const res = await api.get(`/api/users/${userId}/stats`);
  return res.data;
};

export const isFollowingUser = async (targetUserId: string) => {
    const res = await api.get(`/api/follow/${targetUserId}`);
    return res.data;
};

export const followUser = async (targetUserId: string) => {
    const res = await api.post(`/api/follow/${targetUserId}`);
    return res.data;
};

export const unfollowUser = async (targetUserId: string) => {
    const res = await api.delete(`/api/unfollow/${targetUserId}`);
    return res.data;
};

export const deleteAccount = async () => {
  const res = await api.delete("/api/users/me");
  return res.data;
};
  
