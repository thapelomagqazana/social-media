/**
 * PostCard.tsx - Single post with text, image, likes, etc.
 */
const PostCard = ({ post }: { post: any }) => {
    const createdAt = new Date(post.createdAt).toLocaleString();
  
    return (
      <div className="bg-white dark:bg-[#1b1b1b] rounded-xl shadow hover:shadow-md transition-all p-4">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={post.author?.profilePicture || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-semibold">{post.author?.username}</p>
            <p className="text-xs text-gray-500">{createdAt}</p>
          </div>
        </div>
  
        <p className="text-gray-800 dark:text-gray-200">{post.text}</p>
  
        {post.image && (
          <img
            src={post.image}
            alt="post"
            className="w-full rounded-xl mt-3 max-h-[400px] object-cover"
          />
        )}
  
        <div className="flex gap-6 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>❤️ {post.likes.length}</span>
          <span>💬 {post.comments.length}</span>
        </div>
      </div>
    );
  };
  
  export default PostCard;
  