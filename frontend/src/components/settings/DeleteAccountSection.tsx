import { useState } from "react";
import DeleteAccountModal from "./DeleteAccountModal";
import { deleteAccount } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DeleteAccountSection = () => {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    await deleteAccount();
    logout();
    navigate("/signup", { replace: true });
  };

  return (
    <section className="border-t border-gray-200 dark:border-zinc-700 pt-8 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-md">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="self-start sm:self-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition"
        >
          Delete My Account
        </button>
      </div>

      <DeleteAccountModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  );
};

export default DeleteAccountSection;
