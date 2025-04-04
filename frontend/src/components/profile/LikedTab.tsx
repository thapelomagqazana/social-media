import { useEffect, useState } from "react";
import { getUserLikedPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";
import FeedSkeleton from "../feed/FeedSkeleton";
import { Post } from "../../types";

/**
 * Props for the LikedTab component
 */
interface LikedTabProps {
  userId: string;
}

/**
 * LikedTab component
 *
 * @description
 * Displays the list of posts liked by the user.
 *
 * @param {string} userId - ID of the user whose liked posts are fetched.
 *
 * @returns JSX.Element
 */
const LikedTab = ({ userId }: LikedTabProps) => {
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      const data = await getUserLikedPosts(userId);
      setLikedPosts(data.posts);
      setLoading(false);
    };

    fetchLikedPosts();
  }, [userId]);

  if (loading) return <FeedSkeleton />;

  return (
    <div className="space-y-4">
      {likedPosts.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No liked posts yet.</p>
      ) : (
        likedPosts.map((post) => <PostCard key={post._id} post={post} />)
      )}
    </div>
  );
};

export default LikedTab;
