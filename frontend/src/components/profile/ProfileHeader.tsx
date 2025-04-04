/**
 * Interface for the profile prop
 */
interface UserProfile {
  _id: string;
  username: string;
  bio: string;
  profilePicture?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Props for ProfileHeader
 */
interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner: boolean;
}

/**
 * ProfileHeader Component
 *
 * @description Displays the user's profile picture, name, username, and bio.
 * Shows an "Edit Profile" button if the logged-in user is the profile owner.
 *
 * @param {UserProfile} profile - The user's profile data
 * @param {boolean} isOwner - Flag indicating if the logged-in user is viewing their own profile
 */
const ProfileHeader = ({ profile, isOwner }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <img
        src={profile?.profilePicture || "/default-avatar.png"}
        alt="Avatar"
        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
      />
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.user.name}</h2>
        <p className="text-sm text-gray-500">@{profile.username}</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>
        {isOwner && (
          <button className="mt-2 px-4 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
