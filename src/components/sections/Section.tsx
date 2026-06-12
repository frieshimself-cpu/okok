import type { ReactNode } from "react";
import { FadeUp } from "../FadeUp";

/** Shared section shell: eyebrow label, heading, intro, content. */
export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative scroll-mt-24 ${className}`}>
      <div className="mx-auto max-w-[1080px] px-6">
        <FadeUp>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.25em] text-accent/80">
            {eyebrow}
          </p>
          <h2 className="mt-3 max-w-[680px] text-4xl tracking-tight text-foreground sm:text-5xl">
            {title}
          </h2>
          {intro && (
            <p className="mt-4 max-w-[640px] text-base leading-relaxed text-landing-text">{intro}</p>
          )}
        </FadeUp>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
