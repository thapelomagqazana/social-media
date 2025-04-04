import { useEffect, useState, useRef } from "react";
import PostCard from "./PostCard";
import FeedSkeleton from "./FeedSkeleton";
import NoPosts from "./NoPosts";
import { getFeed } from "../../services/postService";
import { Post } from "../../types";

const NewsFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadPosts(page);
  }, [page]);

  const loadPosts = async (page: number) => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const res: Post[] = await getFeed(page);
      if (res.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...res]);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    const current = loader.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading]);

  return (
    <div className="space-y-4 pb-10">
      {posts.length === 0 && !loading && <NoPosts />}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
      {loading && <FeedSkeleton />}
      {!hasMore && posts.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          You're all caught up!
        </div>
      )}
      <div ref={loader} />
    </div>
  );
};

export default NewsFeed;
