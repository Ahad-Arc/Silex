"use client";

import React, { useEffect } from "react";
import { CheckIcon } from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPresets } from "../lib/motionPresets";

export interface ToastData {
  id: string;
  message: string;
  submessage?: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

const TOAST_DURATION = 3500;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const { toastVariants } = useMotionPresets();

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md min-w-[280px] max-w-[360px] ${
        toast.type === "success"
          ? "border-success-custom/25 bg-[#0d1f17]/90 text-success-custom"
          : toast.type === "error"
          ? "border-red-500/25 bg-[#1f0d0d]/90 text-red-400"
          : "border-accent/25 bg-[#0d0f1f]/90 text-accent"
      }`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
          toast.type === "success"
            ? "bg-success-custom/20"
            : toast.type === "error"
            ? "bg-red-500/20"
            : "bg-accent/20"
        }`}
      >
        {toast.type === "success" && <CheckIcon size={11} />}
        {toast.type === "error" && (
          <span className="text-[10px] font-bold leading-none">✕</span>
        )}
        {toast.type === "info" && (
          <span className="text-[10px] font-bold leading-none">i</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug">{toast.message}</p>
        {toast.submessage && (
          <p
            className={`text-2xs mt-0.5 leading-relaxed ${
              toast.type === "success"
                ? "text-success-custom/70"
                : toast.type === "error"
                ? "text-red-400/70"
                : "text-accent/70"
            }`}
          >
            {toast.submessage}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none mt-0.5"
      >
        ✕
      </button>
    </motion.div>
  );
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const addToast = React.useCallback((
    message: string,
    type: ToastData["type"] = "success",
    submessage?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, submessage, type }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastData["type"]; submessage?: string }>;
      if (customEvent.detail) {
        addToast(customEvent.detail.message, customEvent.detail.type || "success", customEvent.detail.submessage);
      }
    };
    window.addEventListener("silex-toast", handleGlobalToast);
    return () => window.removeEventListener("silex-toast", handleGlobalToast);
  }, [addToast]);

  return { toasts, addToast, dismissToast };
}
