"use client";

import React from "react";
import { PlusIcon } from "./Icons";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Decorative premium SVG illustration */}
      <div className="mb-6 relative flex items-center justify-center">
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-accent/5 rounded-full filter blur-xl w-24 h-24 -z-10" />
        
        {icon ? (
          <div className="h-16 w-16 rounded-2xl bg-surface border border-border-custom text-accent/60 flex items-center justify-center shadow-lg">
            {icon}
          </div>
        ) : (
          <svg
            className="w-28 h-28 text-muted-custom/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1.5 text-2xs text-muted-custom max-w-sm leading-relaxed">
        {description}
      </p>

      <div className="mt-6">
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 outline-none"
        >
          <PlusIcon size={14} />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
