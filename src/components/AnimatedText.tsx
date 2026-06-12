import { motion } from "framer-motion";
import type { ReactNode } from "react";

const TRANSITION = { duration: 0.2, ease: "easeInOut" } as const;
const primary = { rest: { y: 0 }, hover: { y: -40 } };
const replacement = { rest: { y: 40 }, hover: { y: 0 } };

/**
 * On hover the label slides up and out while an identical copy slides in
 * from 40px below. Pure variant consumer: the interactive parent (a
 * motion.a / motion.button with initial="rest" whileHover="hover"
 * animate="rest") drives the state, so the effect triggers from anywhere on
 * the parent's hit area, padding included.
 */
export function AnimatedText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex overflow-hidden ${className}`}>
      <motion.span variants={primary} transition={TRANSITION} className="inline-flex whitespace-nowrap">
        {children}
      </motion.span>
      <motion.span
        aria-hidden
        variants={replacement}
        transition={TRANSITION}
        className="absolute inset-0 inline-flex items-center justify-center whitespace-nowrap"
      >
        {children}
      </motion.span>
    </span>
  );
}
