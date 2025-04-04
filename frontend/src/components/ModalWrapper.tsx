import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Backdrop } from "@mui/material";

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const ModalWrapper = ({ open, onClose, children, title }: ModalWrapperProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop open className="z-40 bg-black/30" onClick={onClose} />

          <motion.div
            className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
          >
            {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalWrapper;
