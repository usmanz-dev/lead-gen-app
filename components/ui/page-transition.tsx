"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

/**
 * Subtle fade between route changes — 150ms, no layout jump. Wraps the
 * whole app in the root layout so every page inherits it automatically.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
