import { useEffect, useState } from "react";
import { getUserPosts } from "../../services/userService";
import PostCard from "../feed/PostCard";

const PostsTab = ({ userId }: { userId: string }) => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    getUserPosts(userId).then(setPosts);
  }, [userId]);

  if (!posts.length) return <p className="text-center text-sm text-gray-500">No posts yet.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostsTab;
