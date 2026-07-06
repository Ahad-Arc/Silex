"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandIcon, SearchIcon, CloseIcon } from "./Icons";
import { useMotionPresets } from "../lib/motionPresets";

export interface Command {
  name: string;
  category: "Navigation" | "Actions" | "Design Defaults" | "Builder Layout";
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { modalVariants, fadeInVariants } = useMotionPresets();

  const filtered = useMemo(() => {
    if (!search.trim()) return commands;
    const query = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
    );
  }, [commands, search]);

  // Reset selection index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard navigation inside list
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Palette Card */}
        <motion.div
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          ref={containerRef}
          className="relative w-full max-w-lg bg-[#111113] border border-border-custom rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Input Bar */}
          <div className="relative border-b border-border-custom flex items-center px-4">
            <span className="text-muted-custom">
              <SearchIcon size={16} />
            </span>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-4 pl-3.5 pr-10 bg-transparent text-sm text-foreground focus:outline-none placeholder-muted-custom"
              placeholder="Type a command or search action..."
            />
            <button
              onClick={onClose}
              className="absolute right-4 p-1 rounded-lg text-muted-custom hover:bg-surface hover:text-foreground transition-all focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Close Command Palette"
            >
              <CloseIcon size={14} />
            </button>
          </div>

          {/* Results List */}
          <div
            ref={listRef}
            className="max-h-[320px] overflow-y-auto p-2 space-y-0.5"
            role="listbox"
          >
            {filtered.length > 0 ? (
              filtered.map((cmd, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={`${cmd.category}-${cmd.name}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`w-full text-left rounded-xl px-4 py-3 flex justify-between items-center text-xs font-semibold transition-all border outline-none ${
                      isSelected
                        ? "bg-accent/10 border-accent/20 text-accent"
                        : "bg-transparent border-transparent text-muted-custom hover:bg-surface/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-custom uppercase text-[9px] tracking-wider font-bold opacity-60">
                        {cmd.category}
                      </span>
                      <span className="text-foreground font-medium">{cmd.name}</span>
                    </div>
                    {cmd.shortcut && (
                      <span className="text-3xs font-mono bg-surface border border-border-custom px-1.5 py-0.5 rounded text-muted-custom font-bold">
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-muted-custom">
                No commands matching "{search}" found.
              </div>
            )}
          </div>

          {/* Footer Guide */}
          <div className="border-t border-border-custom px-4 py-2.5 bg-background/50 flex justify-between items-center text-[10px] text-muted-custom font-medium">
            <div className="flex items-center gap-1.5">
              <span>Use</span>
              <kbd className="bg-surface border border-border-custom px-1 py-0.5 rounded font-mono font-bold text-3xs">↑↓</kbd>
              <span>to navigate</span>
              <kbd className="bg-surface border border-border-custom px-1 py-0.5 rounded font-mono font-bold text-3xs">Enter</kbd>
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="bg-surface border border-border-custom px-1.5 py-0.5 rounded font-mono font-bold text-3xs">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
