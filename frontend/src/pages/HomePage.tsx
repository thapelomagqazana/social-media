import React, { useEffect, useState } from "react";
import { Container, Grid, Fab, CircularProgress, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PostCard from "../components/PostCard";
import TrendingHashtags from "../components/TrendingHashtags";
import SearchBar from "../components/SearchBar";
import { useWebSocket } from "../context/WebSocketContext";
import SkeletonLoader from "../components/SkeletonLoader";
import { fetchPosts } from "../services/postService";

/**
 * @component HomePage
 * @description Displays the user's newsfeed, trending hashtags, and enables real-time updates.
 * - Fetches posts using API with pagination.
 * - Listens for real-time updates via WebSockets.
 * - Includes a floating action button for creating new posts.
 */
const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { newPost } = useWebSocket() ?? {}; // Listen for real-time updates

  useEffect(() => {
    loadPosts();
  }, [page]);

  useEffect(() => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]); // Insert new post at the top
    }
  }, [newPost]);

  /**
   * Fetches posts from the API based on the current page.
   * Uses pagination to fetch posts incrementally.
   */
  const loadPosts = async () => {
    try {
      const data = await fetchPosts(page);
      setPosts((prev) => [...prev, ...data]); // Append new posts
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <SearchBar />

      {/* Trending Hashtags Section */}
      <TrendingHashtags />

      {/* Newsfeed Posts */}
      <Grid container spacing={2} className="mt-4">
        {loading ? (
          <SkeletonLoader />
        ) : posts.length === 0 ? (
          <Typography variant="h6" align="center" color="textSecondary" className="mt-6">
            No posts available. Be the first to share something!
          </Typography>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </Grid>

      {/* Floating Action Button for New Post */}
      <Fab
        color="primary"
        className="fixed bottom-10 right-10"
        onClick={() => console.log("Open Post Modal")}
      >
        <AddIcon />
      </Fab>

      {/* Pagination Button */}
      <div className="flex justify-center mt-4">
        {loading ? (
          <CircularProgress />
        ) : (
          posts.length > 0 && (
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="bg-primary text-white px-4 py-2 rounded-md"
            >
              Load More
            </button>
          )
        )}
      </div>
    </Container>
  );
};

export default HomePage;
