import React, { useState } from "react";
import { Card, CardContent, Typography, Avatar, IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ShareIcon from "@mui/icons-material/Share";

interface PostProps {
  post: {
    id: string;
    user: string;
    hashtag: string;
    content: string;
    likes: number;
    comments: number;
    time: string;
  };
}

const PostCard: React.FC<PostProps> = ({ post }) => {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLikes(liked ? likes - 1 : likes + 1);
    setLiked(!liked);
  };

  return (
    <Card className="glass my-4 p-4">
      <CardContent>
        <Typography variant="h6" className="glowing-hashtag">
          #{post.hashtag}
        </Typography>
        <div className="flex items-center mb-2">
          <Avatar>{post.user.charAt(0)}</Avatar>
          <Typography variant="subtitle2" className="ml-2">{post.user} · {post.time} ago</Typography>
        </div>
        <Typography variant="body1">{post.content}</Typography>

        <div className="flex justify-between mt-2">
          <IconButton onClick={handleLike} color={liked ? "error" : "default"}>
            <FavoriteIcon /> {likes}
          </IconButton>
          <IconButton>
            <ChatBubbleIcon /> {post.comments}
          </IconButton>
          <IconButton>
            <ShareIcon />
          </IconButton>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
