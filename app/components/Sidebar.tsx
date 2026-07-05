"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPresets } from "../lib/motionPresets";
import {
  Logo,
  DashboardIcon,
  InvoicesIcon,
  ClientsIcon,
  TemplatesIcon,
  PaymentsIcon,
  SettingsIcon,
  CloseIcon,
} from "./Icons";

interface SidebarProps {
  activeItem: string;
  onSelect: (item: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelect,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { buttonPressProps, shouldReduce } = useMotionPresets();

  const menuItems = [
    { name: "Dashboard", icon: <DashboardIcon size={18} />, badge: null },
    { name: "Invoices", icon: <InvoicesIcon size={18} />, badge: "12" },
    { name: "Clients", icon: <ClientsIcon size={18} />, badge: "8" },
    { name: "Templates", icon: <TemplatesIcon size={18} />, badge: null },
    { name: "Payments", icon: <PaymentsIcon size={18} />, badge: "4" },
    { name: "Settings", icon: <SettingsIcon size={18} />, badge: null },
  ];

  const handleItemClick = (name: string) => {
    onSelect(name);
    onCloseMobile();
  };

  const leftDrawerVariants = {
    initial: { x: shouldReduce ? 0 : "-100%", opacity: shouldReduce ? 0 : 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: shouldReduce ? 0 : "-100%", opacity: shouldReduce ? 0 : 1 },
    transition: shouldReduce ? { duration: 0.15 } : { type: "spring", damping: 30, stiffness: 350 },
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-background p-4 justify-between select-none">
      {/* Brand & Workspace */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <Logo size={20} />
            </div>
            {!isCollapsed && (
              <span className="text-md font-bold tracking-tight text-foreground uppercase">
                Silex
              </span>
            )}
          </div>
          {/* Collapse trigger for desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden sm:flex h-6 w-6 items-center justify-center rounded-md border border-border-custom bg-surface text-muted-custom hover:text-foreground transition-all duration-200"
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Workspace details */}
        {!isCollapsed ? (
          <div className="rounded-lg border border-border-custom bg-surface px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-success-custom animate-pulse" />
              <div className="text-left min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  Personal Space
                </p>
                <p className="text-2xs text-muted-custom truncate">Starter Plan</p>
              </div>
            </div>
            <span className="text-muted-custom text-[10px] bg-border-custom px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-success-custom animate-pulse" />
          </div>
        )}

        {/* Menu items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeItem === item.name;
            return (
              <motion.button
                key={item.name}
                onClick={() => handleItemClick(item.name)}
                {...buttonPressProps}
                className={`relative w-full flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-surface text-foreground"
                    : "text-muted-custom hover:bg-surface/50 hover:text-foreground"
                } ${isCollapsed ? "justify-center" : "justify-between"}`}
                title={item.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarBorder"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-accent" : ""}>{item.icon}</span>
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span
                    className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-2xs font-bold leading-none ${
                      isActive
                        ? "bg-accent/20 text-accent"
                        : "bg-border-custom text-muted-custom"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* User profile details at the bottom */}
      <div className="border-t border-border-custom pt-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2">
            <div className="relative h-8 w-8 rounded-full bg-surface border border-border-custom flex items-center justify-center font-bold text-xs text-accent">
              AG
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-success-custom ring-2 ring-background" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Ahad G.</p>
              <p className="text-2xs text-muted-custom truncate">ahad@silex.com</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="relative h-8 w-8 rounded-full bg-surface border border-border-custom flex items-center justify-center font-bold text-xs text-accent">
              AG
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
              onClick={onCloseMobile}
            />

            <motion.div
              variants={leftDrawerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fixed inset-y-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-border-custom bg-background sm:hidden"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onCloseMobile}
                  className="rounded-lg p-1 text-muted-custom hover:bg-border-custom hover:text-foreground transition-colors"
                >
                  <CloseIcon size={20} />
                </button>
              </div>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Persistent) */}
      <div
        className={`hidden sm:flex h-screen flex-col border-r border-border-custom bg-background transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
