import api from "./api";

/**
 * PostService - API functions for fetching and managing posts.
 */

// TypeScript interface for a post object
export interface Post {
  id: string;
  user: string;
  hashtag: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

// Fetch posts with pagination
/**
 * Fetches posts from the API based on the current page.
 * Uses pagination to fetch posts incrementally.
 * 
 * @param {number} page - The page number for pagination.
 * @returns {Promise<Post[]>} - An array of posts.
 */
export const fetchPosts = async (page: number): Promise<Post[]> => {
  try {
    const response = await api.get(`/api/posts?page=${page}`);
    return response.data.posts;
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw error;
  }
};

// Fetch a specific post by postId
/**
 * Fetches a specific post by its ID.
 * 
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Post>} - The post object.
 */
export const fetchPostById = async (postId: string): Promise<Post> => {
  const response = await api.get(`/api/posts/${postId}`);
  return response.data;
};

// Create a new post
/**
 * Creates a new post.
 * 
 * @param {Partial<Post>} postData - The new post data.
 * @returns {Promise<Post>} - The created post.
 */
export const createPost = async (postData: Partial<Post>): Promise<Post> => {
  const response = await api.post("/api/posts", postData);
  return response.data;
};

// Like a post
/**
 * Likes a post by its ID.
 * 
 * @param {string} postId - The ID of the post.
 * @returns {Promise<void>} - No return value on success.
 */
export const likePost = async (postId: string): Promise<void> => {
  await api.post(`/api/posts/${postId}/like`);
};

// Unlike a post
/**
 * Unlikes a post by its ID.
 * 
 * @param {string} postId - The ID of the post.
 * @returns {Promise<void>} - No return value on success.
 */
export const unlikePost = async (postId: string): Promise<void> => {
  await api.post(`/api/posts/${postId}/unlike`);
};

// Add a comment to a post
/**
 * Adds a comment to a post.
 * 
 * @param {string} postId - The ID of the post.
 * @param {string} comment - The comment text.
 * @returns {Promise<void>} - No return value on success.
 */
export const addComment = async (postId: string, comment: string): Promise<void> => {
  await api.post(`/api/posts/${postId}/comment`, { comment });
};

// Delete a comment
/**
 * Deletes a comment from a post.
 * 
 * @param {string} postId - The ID of the post.
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<void>} - No return value on success.
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  await api.delete(`/api/posts/${postId}/comment/${commentId}`);
};

// Delete a post
/**
 * Deletes a post by its ID.
 * 
 * @param {string} postId - The ID of the post.
 * @returns {Promise<void>} - No return value on success.
 */
export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`/api/posts/${postId}`);
};
