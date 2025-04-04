import { useEffect, useState } from "react";
import { getUserMediaPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";
import FeedSkeleton from "../feed/FeedSkeleton";

const MediaTab = ({ userId }: { userId: string }) => {
  const [mediaPosts, setMediaPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getUserMediaPosts(userId);
      const posts = data.posts;
      setMediaPosts(posts);
      setLoading(false);
    })();
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
