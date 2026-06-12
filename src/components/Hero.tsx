import { Box, Feather, Sparkles, Star, Sun } from "lucide-react";
import { FadeUp } from "./FadeUp";
import { GlowButton } from "./GlowButton";
import { TokenCA } from "./TokenCA";
import { useChain } from "../context/ChainContext";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_094440_a3592600-bd1e-49e5-9bce-a73662061d83.mp4";

const builders = [
  { Icon: Sun, name: "Nebulon" },
  { Icon: Box, name: "Prismify" },
  { Icon: Star, name: "Nova Labs" },
  { Icon: Feather, name: "Zephyr" },
  { Icon: Sparkles, name: "Ignite" },
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
        style={{ color: "hsl(0 0% 100%)", WebkitMaskImage: tightMask, maskImage: tightMask }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none opacity-60 blur-md"
        style={{ color: "hsl(0 0% 100%)", WebkitMaskImage: wideMask, maskImage: wideMask }}
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
      {/* Backdrop: animated aurora always present; the video fades in over it
          when (and only when) it actually loads — a dead CDN can never leave
          the hero black. */}
      <div className="absolute inset-0 z-0">
        <div className="aurora" />
        <video
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-1 flex-col justify-between px-8 pb-10 pt-28 md:px-16">
        {/* Heading + CTA, vertically centered */}
        <div className="my-auto max-w-3xl overflow-visible">
          <FadeUp>
            <h1 className="mb-12 text-6xl leading-[0.95] tracking-tight text-foreground md:text-8xl lg:text-[7rem]">
              Own the future of
              <br />
              your <GlowWord>assets.</GlowWord>
            </h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <GlowButton
              onClick={() =>
                document.getElementById("mining")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Launch your orbit
            </GlowButton>
            <p className="mt-8 max-w-md text-lg text-foreground/50">
              {booting
                ? "Booting a real proof-of-work chain in your browser…"
                : restored
                  ? `Welcome back — your chain resumed at block #${stats?.height ?? 0}, right where you left it.`
                  : `A real proof-of-work chain, mining live on this page — block #${stats?.height ?? 0} and saved in your browser.`}
            </p>
          </FadeUp>
          <FadeUp delay={0.25}>
            <div className="mt-6">
              <TokenCA />
            </div>
          </FadeUp>
        </div>

        {/* Logo marquee pinned to the bottom of the hero */}
        <div className="mt-auto w-full md:w-1/2">
          <p className="mb-5 text-left text-base text-foreground/50">Trusted by top builders</p>
          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee">
              {[...builders, ...builders].map(({ Icon, name }, i) => (
                <div key={i} className="mx-6 flex items-center gap-3">
                  <Icon className="h-6 w-6 text-foreground/60" />
                  <span className="whitespace-nowrap text-2xl tracking-wide text-foreground/60">
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
