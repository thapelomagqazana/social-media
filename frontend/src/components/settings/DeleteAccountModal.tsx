import { motion, AnimatePresence } from "framer-motion";
import { Backdrop, Button, CircularProgress } from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteAccountModal = ({ open, onClose, onConfirm }: Props) => {
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
        {open && (
            <>
            <Backdrop open className="z-40 bg-black/30 fixed inset-0" onClick={onClose} />

            {/* Wrapper to guarantee centering */}
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`w-[90%] max-w-md bg-white rounded-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto ${
                    shake ? "animate-shake" : ""
                }`}
                >
                <h2 className="text-lg font-semibold text-red-600 mb-2">Are you sure?</h2>
                <p className="text-sm text-gray-600">
                    This action is <strong>irreversible</strong>. All your data will be deleted permanently.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <Button onClick={onClose} disabled={loading}>
                    Cancel
                    </Button>
                    <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={loading}
                    sx={{
                        backgroundColor: "#dc2626",
                        "&:hover": { backgroundColor: "#b91c1c" },
                    }}
                    >
                    {loading ? <CircularProgress size={20} color="inherit" /> : "Yes, Delete My Account"}
                    </Button>
                </div>
                </motion.div>
            </div>
            </>
        )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
