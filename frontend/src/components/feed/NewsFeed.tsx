import { useEffect, useState, useRef } from "react";
import PostCard from "./PostCard";
import FeedSkeleton from "./FeedSkeleton";
import NoPosts from "./NoPosts";
import { getFeed } from "../../services/postService";

const NewsFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Stop fetching when false
  const loader = useRef(null);

  useEffect(() => {
    loadPosts(page);
  }, [page]);

  const loadPosts = async (page: number) => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const res = await getFeed(page);
      if (res.length === 0) {
        setHasMore(false); // No more posts
      } else {
        setPosts((prev) => [...prev, ...res]);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
      setHasMore(false); // Stop retrying endlessly
    } finally {
      setLoading(false);
    }
  };

  // Setup Intersection Observer only when there's more to load
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

      {/* Intersection target for infinite scroll */}
      <div ref={loader} />
    </div>
  );
};

export default NewsFeed;
