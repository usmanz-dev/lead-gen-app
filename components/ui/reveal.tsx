"use client";

import { motion, type HTMLMotionProps } from "motion/react";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  /** Stagger delay in seconds, for revealing a sequence of siblings. */
  delay?: number;
}

/**
 * Fade + translateY(20px→0) when a section scrolls into view, once only.
 * Used for marketing page sections — see leadgen.md §11 "Animations".
 */
export function Reveal({ children, delay = 0, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
