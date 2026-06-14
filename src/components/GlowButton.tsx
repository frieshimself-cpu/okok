import type { MouseEventHandler, ReactNode } from "react";

/**
 * Cyan pill CTA with a large electric halo and an internal blurred highlight
 * blob peeking over the top edge.
 */
export function GlowButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-[43px] bg-accent px-10 py-4 text-xl text-accent-foreground transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ boxShadow: "0px 4px 95px 4px hsl(186 90% 52% / 0.55)" }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 h-10 w-48 -translate-x-1/2 rounded-full blur-xl"
        style={{ top: "-12px", background: "hsl(186 80% 92%)" }}
      />
      <span className="relative">{children}</span>
    </button>
  );
}
