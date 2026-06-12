import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Scroll-reveal: fade in while translating up, once, honoring reduced motion. */
export function FadeUp({
  children,
  delay = 0,
  duration = 0.6,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
