import { useEffect, useState } from "react";
import { followUser, unfollowUser, isFollowingUser } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { CircularProgress } from "@mui/material";

interface Props {
  targetUserId: string;
}

const FollowButton = ({ targetUserId }: Props) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user._id === targetUserId) return; // don't run effect for own profile or unauthenticated
    const checkFollowing = async () => {
      try {
        const res = await isFollowingUser(targetUserId);
        setFollowing(res.following);
      } catch (err) {
        console.error("Failed to check following:", err);
      }
    };

    checkFollowing();
  }, [targetUserId, user]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(targetUserId);
        setFollowing(false);
      } else {
        await followUser(targetUserId);
        setFollowing(true);
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Only render the button if the user is authenticated and not viewing their own profile
  if (!user || user._id === targetUserId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mt-2 px-4 py-1 rounded-md text-sm font-medium transition ${
        following ? "bg-gray-300 text-black hover:bg-gray-400" : "bg-indigo-500 text-white hover:bg-indigo-600"
      }`}
    >
      {loading ? <CircularProgress size={18} color="inherit" /> : following ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;
