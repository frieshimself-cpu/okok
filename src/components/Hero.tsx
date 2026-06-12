import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FadeUp } from "./FadeUp";
import { HeroBadge, PrimaryButton } from "./Buttons";
import { DashboardMock } from "./DashboardMock";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260521_014404_fadafdb1-4df6-4699-be9c-77d25f39a3d0.mp4";
const GRASS_IMG =
  "https://miptxtnhvjrkpmnjgdhk.supabase.co/storage/v1/object/public/training-assets/landing%2Fhero-bottom-bg.png";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const dashboardY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const grassY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={sectionRef} id="hero" className="relative w-full min-h-screen">
      {/* 1) Background video — full bleed, no overlay */}
      <video
        src={HERO_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* 2) Centered copy + CTA, fading and rising away on scroll */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 flex flex-col items-center text-center px-4 sm:px-6 pt-28 sm:pt-36 md:pt-44 max-w-[980px] mx-auto"
      >
        <FadeUp delay={0}>
          <HeroBadge>Genesis era · founder rewards live</HeroBadge>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="mt-8 text-foreground text-[38px] sm:text-[52px] md:text-[64px] leading-[1.05] tracking-[-0.03em] max-w-[960px]">
            An entire blockchain, alive in your browser
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="mt-6 text-landing-text text-base sm:text-lg leading-[1.5] max-w-[520px]">
            Mint a wallet, sign transactions and mine real blocks — a complete proof-of-work chain
            with no servers behind it
          </p>
        </FadeUp>
        <FadeUp delay={0.3} className="mt-10">
          <PrimaryButton
            as="button"
            onClick={() =>
              document.getElementById("console")?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Start mining
          </PrimaryButton>
        </FadeUp>
      </motion.div>

      {/* 3) Dashboard mock — slower parallax */}
      <motion.div style={{ y: dashboardY }} className="relative z-10 mt-8 sm:mt-10 md:mt-12 px-4 sm:px-6">
        <DashboardMock />
      </motion.div>

      {/* 4) Foreground grass — in front of the dashboard, drifting down */}
      <motion.img
        src={GRASS_IMG}
        alt=""
        aria-hidden
        style={{ y: grassY }}
        className="pointer-events-none select-none absolute left-0 right-0 bottom-[-40px] sm:bottom-[-100px] lg:bottom-[-220px] w-full z-30 object-cover"
      />
    </section>
  );
}
