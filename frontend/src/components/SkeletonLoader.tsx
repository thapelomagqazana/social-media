import React from "react";
import { Skeleton, Box, Card, CardContent, Typography } from "@mui/material";

/**
 * @component SkeletonLoader
 * @description A reusable skeleton loader for posts, profile, and lists.
 * - **Glassmorphic & Neumorphic effects** for smooth futuristic UI.
 * - **Supports dynamic number of skeletons** via `count` prop.
 * - **Responsive design** for all screen sizes.
 *
 * @param {number} count - The number of skeletons to render (default: 3).
 */
const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <Box className="w-full flex flex-col gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="glassmorphic-card">
          <CardContent>
            {/* 🔵 Profile Picture & Name Skeleton */}
            <Box className="flex items-center gap-4">
              <Skeleton variant="circular" width={50} height={50} />
              <Box>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={15} />
              </Box>
            </Box>

            {/* 📌 Post Content Skeleton */}
            <Box className="mt-4">
              <Skeleton variant="text" width="90%" height={20} />
              <Skeleton variant="text" width="75%" height={20} />
              <Skeleton variant="text" width="50%" height={20} />
            </Box>

            {/* 📸 Image/Video Placeholder */}
            <Box className="mt-3">
              <Skeleton variant="rectangular" width="100%" height={180} />
            </Box>

            {/* ❤️💬🔁 Action Buttons Skeleton */}
            <Box className="flex justify-around mt-4">
              <Skeleton variant="circular" width={30} height={30} />
              <Skeleton variant="circular" width={30} height={30} />
              <Skeleton variant="circular" width={30} height={30} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SkeletonLoader;
