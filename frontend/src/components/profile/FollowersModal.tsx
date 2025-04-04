import { useEffect, useState } from "react";
import { getUserFollowers } from "../../services/userService";
import { Link } from "react-router-dom";
import ModalWrapper from "../ModalWrapper";

/**
 * Represents a user with basic profile info.
 */
interface UserWithProfile {
  _id: string;
  name: string;
  profile: {
    username?: string;
    bio?: string;
    profilePicture?: string;
  };
}

/**
 * Props for the FollowersModal component.
 */
interface FollowersModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

/**
 * FollowersModal component
 *
 * @description
 * Displays a modal showing a list of users who are following the specified user.
 *
 * @param {boolean} open - Determines whether the modal is visible.
 * @param {() => void} onClose - Callback function to close the modal.
 * @param {string} userId - ID of the user whose followers are being shown.
 *
 * @returns JSX.Element
 */
const FollowersModal = ({ open, onClose, userId }: FollowersModalProps) => {
  const [followers, setFollowers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch followers when modal is opened or when userId changes.
   */
  useEffect(() => {
    if (open) {
      fetchFollowers();
    }
  }, [open, userId]);

  /**
   * Fetches the list of followers for a given user.
   */
  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const res = await getUserFollowers(userId);
      setFollowers(res.followers);
    } finally {
      setLoading(false);
    }
  };

  // Determine modal content based on state
  let content: React.ReactNode;

  if (loading) {
    content = <p className="text-center text-gray-400">Loading...</p>;
  } else if (followers.length === 0) {
    content = <p className="text-center text-gray-400">No one is following you yet.</p>;
  } else {
    content = (
      <ul className="space-y-4">
        {followers.map((person) => (
          <li key={person._id} className="flex items-center gap-3">
            <img
              src={person.profile?.profilePicture || "/default-avatar.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <Link
                to={`/profile/${person._id}`}
                className="font-medium text-indigo-600 hover:underline"
                onClick={onClose}
              >
                @{person.profile?.username || person.name}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {person.profile?.bio?.slice(0, 40)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ModalWrapper open={open} onClose={onClose} title="Followers">
      {content}
    </ModalWrapper>
  );
};

export default FollowersModal;
