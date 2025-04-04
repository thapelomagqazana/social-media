interface Props {
    stats: any;
    onFollowersClick: () => void;
    onFollowingClick: () => void;
}
  
const UserStats = ({ stats, onFollowersClick, onFollowingClick }: Props) => {
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
  