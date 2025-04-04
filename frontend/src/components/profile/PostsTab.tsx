import { useEffect, useState } from "react";
import { getUserPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";
import { Post } from "../../types";

/**
 * Props for the PostsTab component
 */
interface PostsTabProps {
  userId: string;
}

/**
 * PostsTab Component
 *
 * @description Displays a list of posts created by the specified user.
 *
 * @param {string} userId - ID of the user whose posts to fetch.
 * @returns JSX.Element
 */
const PostsTab = ({ userId }: PostsTabProps) => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = await getUserPosts(userId);
      setPosts(res.posts);
    };

    fetchPosts();
  }, [userId]);

  if (posts.length === 0) {
    return <p className="text-center text-sm text-gray-500">No posts yet.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostsTab;
