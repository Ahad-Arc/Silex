"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPresets } from "../lib/motionPresets";
import { AlertIcon, CloseIcon } from "./Icons";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}) => {
  const { modalVariants, fadeInVariants } = useMotionPresets();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={fadeInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Card */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative bg-[#111113] border border-border-custom rounded-2xl w-full max-w-[400px] overflow-hidden shadow-2xl z-10 p-6 space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertIcon size={20} />
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-sm font-bold text-foreground leading-none">{title}</h3>
                <p className="text-2xs text-muted-custom leading-relaxed">{message}</p>
              </div>
              <button 
                onClick={onClose}
                className="text-muted-custom hover:text-foreground p-0.5 rounded-lg transition-colors shrink-0"
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-border-custom px-4 py-2 text-2xs font-semibold text-muted-custom hover:text-foreground hover:bg-surface transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-2xs font-bold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
