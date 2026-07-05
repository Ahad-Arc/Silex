"use client";

import { useReducedMotion } from "framer-motion";

export function useMotionPresets() {
  const shouldReduce = useReducedMotion();

  const pageTransition = {
    initial: { opacity: 0, y: shouldReduce ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduce ? 0 : -8 },
    transition: { duration: 0.15, ease: "easeInOut" },
  };

  const modalVariants = {
    initial: { opacity: 0, scale: shouldReduce ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: shouldReduce ? 1 : 0.96 },
    transition: { type: "spring", duration: 0.25, bounce: 0 },
  };

  const drawerVariants = {
    initial: { x: shouldReduce ? 0 : "100%", opacity: shouldReduce ? 0 : 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: shouldReduce ? 0 : "100%", opacity: shouldReduce ? 0 : 1 },
    transition: shouldReduce ? { duration: 0.15 } : { type: "spring", damping: 30, stiffness: 350 },
  };

  const toastVariants = {
    initial: { opacity: 0, y: shouldReduce ? 0 : 12, scale: shouldReduce ? 1 : 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: shouldReduce ? 1 : 0.96, transition: { duration: 0.15 } },
    transition: { duration: 0.2, ease: "easeOut" },
  };

  const fadeInVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  };

  const staggerContainerVariants = {
    animate: { transition: { staggerChildren: shouldReduce ? 0 : 0.04 } },
  };

  const listItemVariants = {
    initial: { opacity: 0, y: shouldReduce ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
  };

  const cardHoverProps = shouldReduce ? {} : {
    whileHover: { y: -2 },
    transition: { duration: 0.15, ease: "easeInOut" },
  };

  const buttonPressProps = shouldReduce ? {} : {
    whileTap: { scale: 0.98 },
  };

  return {
    pageTransition,
    modalVariants,
    drawerVariants,
    toastVariants,
    fadeInVariants,
    staggerContainerVariants,
    listItemVariants,
    cardHoverProps,
    buttonPressProps,
    shouldReduce,
  };
}
