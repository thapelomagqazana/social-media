import { useEffect, useState } from "react";
import { getUserMediaPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";
import FeedSkeleton from "../feed/FeedSkeleton";
import { Post } from "../../types";

/**
 * Props for the MediaTab component
 */
interface MediaTabProps {
  userId: string;
}

/**
 * MediaTab component
 *
 * @description
 * Displays all posts by a user that contain media (images or videos).
 *
 * @param {string} userId - ID of the user whose media posts are being fetched.
 *
 * @returns JSX.Element
 */
const MediaTab = ({ userId }: MediaTabProps) => {
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMediaPosts = async () => {
      const data = await getUserMediaPosts(userId);
      setMediaPosts(data.posts);
      setLoading(false);
    };

    fetchMediaPosts();
  }, [userId]);

  if (loading) return <FeedSkeleton />;

  return (
    <div className="space-y-4">
      {mediaPosts.length === 0 ? (
        <p className="text-center text-sm text-gray-500">No media posts yet.</p>
      ) : (
        mediaPosts.map((post) => <PostCard key={post._id} post={post} />)
      )}
    </div>
  );
};

export default MediaTab;
