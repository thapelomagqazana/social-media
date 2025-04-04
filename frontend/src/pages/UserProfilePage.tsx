import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProfileHeader from "../components/profile/ProfileHeader";
import UserStats from "../components/profile/UserStats";
import PostsTab from "../components/profile/PostsTab";
import LikedTab from "../components/profile/LikedTab";
import MediaTab from "../components/profile/MediaTab";
import FollowersModal from "../components/profile/FollowersModal";
import FollowingModal from "../components/profile/FollowingModal";
import {
  getUserStats
} from "../services/userService";
import { getUserProfile } from "../services/profileService";
import { useAuth } from "../context/AuthContext";

const tabs = ["Posts", "Liked", "Media"];

const UserProfilePage = () => {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState("Posts");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const profile = await getUserProfile(userId!);
      const stats = await getUserStats(userId!);
      setProfile(profile);
      setStats(stats);
    };
    fetchData();
  }, [userId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mt-20 min-h-[calc(100vh-100px)]">
      {profile && (
        <ProfileHeader
          profile={profile}
          isOwner={profile?.user?._id === authUser?._id}
        />
      )}
      {stats && (
        <UserStats
          stats={stats}
          onFollowersClick={() => setShowFollowers(true)}
          onFollowingClick={() => setShowFollowing(true)}
        />
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mt-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-3 text-sm font-medium transition-all duration-300 ${
              activeTab === tab ? "border-b-2 border-indigo-500 text-indigo-600" : "text-gray-500 hover:text-indigo-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "Posts" && <PostsTab userId={userId!} />}
        {activeTab === "Liked" && <LikedTab userId={userId!} />}
        {activeTab === "Media" && <MediaTab userId={userId!} />}
      </div>

      {/* Modals */}
      <FollowersModal open={showFollowers} onClose={() => setShowFollowers(false)} userId={userId!} />
      <FollowingModal open={showFollowing} onClose={() => setShowFollowing(false)} userId={userId!} />
    </div>
  );
};

export default UserProfilePage;
