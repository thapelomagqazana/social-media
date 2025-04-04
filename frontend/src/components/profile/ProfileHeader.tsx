const ProfileHeader = ({ profile, isOwner }: { profile: any; isOwner: boolean }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
      <img
        src={profile?.profilePicture || "/default-avatar.png"}
        alt="Avatar"
        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
      />
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.user.name}</h2>
        <p className="text-sm text-gray-500">@{profile?.username}</p>
        <p className="mt-2 text-gray-700 dark:text-gray-300">{profile?.bio}</p>
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