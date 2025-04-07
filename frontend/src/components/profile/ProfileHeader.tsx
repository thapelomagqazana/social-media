import { useState } from "react";
import FollowButton from "./FollowButton";
import EditProfileModal from "./EditProfileModal";
import { UserProfile } from "../../types";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwner: boolean;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
}

const ProfileHeader = ({ profile, isOwner, onProfileUpdate }: ProfileHeaderProps) => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <img
          src={profile?.profilePicture || "/default-avatar.png"}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
        />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile.user.name}
          </h2>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full dark:bg-indigo-800 dark:text-white"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {isOwner ? (
            <button
              className="mt-2 px-4 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
              onClick={() => setOpenModal(true)}
            >
              Edit Profile
            </button>
          ) : (
            <FollowButton targetUserId={profile.user._id} />
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditProfileModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          profile={profile}
          onSuccess={(updated) => {
            setOpenModal(false);
            onProfileUpdate?.(updated); // ✅ notify parent
          }}
        />
      )}
    </>
  );
};

export default ProfileHeader;
