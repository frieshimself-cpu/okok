import { FadeUp } from "./FadeUp";
import { GlowButton } from "./GlowButton";
import { TokenCA } from "./TokenCA";
import { useChain } from "../context/ChainContext";

/** The crawlers that actually read the modern web — the real audience of any
 *  page you publish today. On the narrative: you're mostly writing for bots. */
const crawlers = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Bytespider",
  "Amazonbot",
  "CCBot",
  "Meta-ExternalAgent",
  "Applebot-Extended",
  "Bingbot",
];

/**
 * A word with a directional neon glow: two white duplicates layered on top,
 * gradient-masked toward the top-right, one tight (blur-sm) and one wide
 * (blur-md) — so the glow bleeds out past the glyphs.
 */
function GlowWord({ children }: { children: string }) {
  const tightMask = "linear-gradient(to bottom left, white 25%, transparent 55%)";
  const wideMask = "linear-gradient(to bottom left, white 20%, transparent 50%)";
  return (
    <span className="relative inline-block overflow-visible">
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none blur-sm"
        style={{ color: "hsl(186 90% 80%)", WebkitMaskImage: tightMask, maskImage: tightMask }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none opacity-60 blur-md"
        style={{ color: "hsl(186 90% 80%)", WebkitMaskImage: wideMask, maskImage: wideMask }}
      >
        {children}
      </span>
    </span>
  );
}

export function Hero() {
  const { booting, restored, stats } = useChain();

  return (
    <section id="hero" className="relative flex min-h-screen w-full flex-col overflow-visible">
      {/* Backdrop: pure-CSS aurora + a faint machine grid. No video, no CDN —
          the page is as serverless as the chain it runs. */}
      <div className="absolute inset-0 z-0">
        <div className="aurora" />
        <div className="machine-grid absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 flex-col justify-between px-8 pb-10 pt-28 md:px-16">
        {/* Heading + CTA, vertically centered */}
        <div className="my-auto max-w-4xl overflow-visible">
          <FadeUp>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.06] px-3.5 py-1.5 font-inter text-xs text-accent/90">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Bots have outnumbered humans online since 2024
            </div>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h1 className="mb-8 text-6xl leading-[0.95] tracking-tight text-foreground md:text-8xl lg:text-[6.6rem]">
              More <GlowWord>bots</GlowWord> than
              <br />
              humans. Pay them in $ATB.
            </h1>
          </FadeUp>
          <FadeUp delay={0.12}>
            <p className="mb-9 max-w-xl font-inter text-lg leading-relaxed text-foreground/60">
              A growing share of the internet isn't humans talking to humans anymore — it's machines
              transacting. $AttentionBot is the coin they settle in. And the bots are already
              shilling the ticker.
            </p>
          </FadeUp>
          <FadeUp delay={0.18}>
            <div className="flex flex-wrap items-center gap-4">
              <GlowButton
                onClick={() =>
                  document.getElementById("swarm")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Enter the swarm
              </GlowButton>
              <TokenCA />
            </div>
            <p className="mt-6 max-w-md font-inter text-sm text-foreground/45">
              {booting
                ? "Booting the settlement ledger in your browser…"
                : restored
                  ? `Ledger resumed at block #${stats?.height ?? 0} — your agents picked up where they left off.`
                  : `A real settlement ledger, sealing blocks live on this page — now at block #${stats?.height ?? 0}.`}
            </p>
          </FadeUp>
        </div>

        {/* Crawler marquee pinned to the bottom of the hero */}
        <div className="mt-auto w-full">
          <p className="mb-5 text-left font-inter text-sm text-foreground/40">
            Today’s audience — the bots reading this page
          </p>
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="flex w-max animate-marquee">
              {[...crawlers, ...crawlers].map((name, i) => (
                <div key={i} className="mx-5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/60" />
                  <span className="whitespace-nowrap font-mono text-lg tracking-wide text-foreground/55">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
