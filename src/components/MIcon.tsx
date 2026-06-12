import type { CSSProperties } from "react";

/** Google Material Symbols glyph (loaded as a font in index.html). */
export const MIcon = ({
  name,
  size = 16,
  className = "",
  filled = false,
  weight = 400,
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  weight?: number;
  style?: CSSProperties;
}) => (
  <span
    aria-hidden
    className={`material-symbols-outlined select-none leading-none inline-flex items-center justify-center ${className}`}
    style={{
      fontSize: size,
      width: size,
      height: size,
      fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}`,
      ...style,
    }}
  >
    {name}
  </span>
);
