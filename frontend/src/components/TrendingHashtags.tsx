import React from "react";
import { Typography } from "@mui/material";
import "../styles/TrendingHashtags.css";

const trendingTags = ["tech", "AI", "web3", "startups", "innovation", "blockchain"];

const TrendingHashtags: React.FC = () => {
  return (
    <aside className="trending-sidebar">
      <Typography variant="h6" className="trending-title">
        Trending Hashtags:
      </Typography>
      <div className="trending-tags">
        {trendingTags.map((tag) => (
          <Typography key={tag} className="glowing-hashtag">
            #{tag}
          </Typography>
        ))}
      </div>
    </aside>
  );
};

export default TrendingHashtags;
