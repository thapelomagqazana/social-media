/**
 * @file UserStats.tsx
 * @description Displays the user's follower, following, and post counts with interactivity.
 */

/**
 * Props type for user statistics
 */
interface UserStatsProps {
  stats: {
    followersCount: number;
    followingCount: number;
    postCount: number;
  };
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

/**
 * UserStats Component
 * 
 * @param {UserStatsProps} props - Contains counts and click handlers for stats
 * @returns JSX.Element
 */
const UserStats = ({ stats, onFollowersClick, onFollowingClick }: UserStatsProps) => {
  return (
    <div className="flex gap-6 text-sm mt-4">
      <button onClick={onFollowersClick} className="hover:underline">
        <strong>{stats.followersCount}</strong> Followers
      </button>
      <button onClick={onFollowingClick} className="hover:underline">
        <strong>{stats.followingCount}</strong> Following
      </button>
      <div>
        <strong>{stats.postCount}</strong> Posts
      </div>
    </div>
  );
};

export default UserStats;
