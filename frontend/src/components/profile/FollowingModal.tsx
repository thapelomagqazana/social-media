import { useEffect, useState } from "react";
import ModalWrapper from "../ModalWrapper";
import { getUserFollowing } from "../../services/userService";
import { Link } from "react-router-dom";

/**
 * Represents a user that the current user is following.
 */
interface FollowUser {
  _id: string;
  name: string;
  profile?: {
    username?: string;
    profilePicture?: string;
    bio?: string;
  };
}

/**
 * Props for the FollowingModal component.
 */
interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * FollowingModal component
 *
 * @description
 * Modal that displays a list of users the current user is following.
 *
 * @param {string} userId - ID of the user whose "following" list will be shown.
 * @param {boolean} open - Controls modal visibility.
 * @param {() => void} onClose - Closes the modal.
 *
 * @returns JSX.Element
 */
const FollowingModal = ({ userId, open, onClose }: Props) => {
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch following list when the modal opens.
   */
  useEffect(() => {
    if (open) fetchFollowing();
  }, [open]);

  /**
   * Calls API to get users the current user is following.
   */
  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const res = await getUserFollowing(userId);
      setFollowing(res.following);
    } finally {
      setLoading(false);
    }
  };

  // Determine content based on loading and data state
  let content: React.ReactNode;

  if (loading) {
    content = <p className="text-center text-gray-400">Loading...</p>;
  } else if (following.length === 0) {
    content = <p className="text-center text-gray-400">Not following anyone yet.</p>;
  } else {
    content = (
      <ul className="space-y-4">
        {following.map((person) => (
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
    <ModalWrapper title="Following" open={open} onClose={onClose}>
      {content}
    </ModalWrapper>
  );
};

export default FollowingModal;
