import { motion } from "framer-motion";
import type { MouseEventHandler, ReactNode } from "react";
import { AnimatedText } from "./AnimatedText";

const hoverDriver = {
  initial: "rest" as const,
  whileHover: "hover" as const,
  animate: "rest" as const,
};

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler;
  className?: string;
}

/** White pill CTA. */
export function PrimaryButton({
  children,
  href,
  onClick,
  className = "",
  as = "a",
}: ButtonProps & { as?: "a" | "button" }) {
  const classes = `inline-flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-black leading-none transition-colors h-12 px-9 text-sm font-medium ${className}`;
  if (as === "button") {
    return (
      <motion.button type="button" onClick={onClick} {...hoverDriver} className={classes}>
        <AnimatedText>{children}</AnimatedText>
      </motion.button>
    );
  }
  return (
    <motion.a href={href} onClick={onClick} {...hoverDriver} className={classes}>
      <AnimatedText>{children}</AnimatedText>
    </motion.a>
  );
}

/** Glass pill. */
export function SecondaryButton({
  children,
  href,
  onClick,
  className = "",
  size = "sm",
}: ButtonProps & { size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "h-8 px-4 text-sm" : "h-10 px-6 text-sm";
  return (
    <motion.a
      href={href}
      onClick={onClick}
      {...hoverDriver}
      className={`inline-flex items-center justify-center rounded-full bg-landing-surface hover:bg-landing-surface-hover border border-landing-border text-foreground backdrop-blur-[2.5px] font-medium leading-none ${sizing} ${className}`}
    >
      <AnimatedText>{children}</AnimatedText>
    </motion.a>
  );
}

export function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full bg-landing-surface border border-landing-border px-4 h-7 text-sm text-landing-text">
      {children}
    </div>
  );
}
