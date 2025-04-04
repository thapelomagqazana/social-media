import { useEffect, useState } from "react";
import { getUserLikedPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";
import FeedSkeleton from "../feed/FeedSkeleton";

const LikedTab = ({ userId }: { userId: string }) => {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getUserLikedPosts(userId);
      const posts = data.posts;
      setLikedPosts(posts);
      setLoading(false);
    })();
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
