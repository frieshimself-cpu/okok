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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300/70">
            {eyebrow}
          </p>
          <h2 className="mt-3 max-w-[680px] text-3xl tracking-[-0.02em] text-foreground sm:text-4xl">
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
