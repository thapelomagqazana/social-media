const FeedSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-300 dark:bg-gray-700 h-48 rounded-xl" />
      ))}
    </div>
  );
  
  export default FeedSkeleton;
  