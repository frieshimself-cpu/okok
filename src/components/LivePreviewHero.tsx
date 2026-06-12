import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

const DASHBOARD_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

const prevent = (e: MouseEvent) => e.preventDefault();

/**
 * The right column of the dashboard mock: a miniature "live preview" of a
 * site being built, with a JS-driven fade-in/out video loop (the video has
 * no `loop` attribute on purpose — we fade out near the end, snap to the
 * start, then fade back in for a seamless cinematic restart).
 */
export function LivePreviewHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;
    let restartTimer = 0;
    let fadingOut = false;

    const fadeTo = (target: number, ms: number) => {
      cancelAnimationFrame(raf);
      const from = Number.parseFloat(video.style.opacity || "0");
      const started = performance.now();
      const tick = (t: number) => {
        const progress = Math.min(1, (t - started) / ms);
        video.style.opacity = String(from + (target - from) * progress);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const onLoadedData = () => {
      video.style.opacity = "0";
      void video.play().catch(() => {});
      fadeTo(1, 500);
    };
    const onTimeUpdate = () => {
      if (!video.duration) return;
      if (video.duration - video.currentTime < 0.55 && !fadingOut) {
        fadingOut = true;
        fadeTo(0, 500);
      }
    };
    const onEnded = () => {
      cancelAnimationFrame(raf);
      video.style.opacity = "0";
      restartTimer = window.setTimeout(() => {
        video.currentTime = 0;
        void video.play().catch(() => {});
        fadingOut = false;
        fadeTo(1, 500);
      }, 100);
    };

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      cancelAnimationFrame(raf);
      window.clearTimeout(restartTimer);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[440px] sm:min-h-[500px] overflow-hidden rounded-2xl bg-black">
      {/* Gradient backdrop so the panel never renders pitch black if the
          remote video can't load. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 70% 8%, rgba(124,58,237,0.30), transparent 60%), radial-gradient(70% 55% at 18% 92%, rgba(16,185,129,0.22), transparent 60%), #050208",
        }}
      />
      <video
        ref={videoRef}
        src={DASHBOARD_VIDEO}
        muted
        autoPlay
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover translate-y-[17%]"
        style={{ opacity: 0 }}
      />

      <div className="relative z-10 flex flex-col min-h-full h-full">
        <div className="relative z-20 px-3 sm:px-4 py-3">
          <div className="rounded-full px-2 sm:px-4 py-1.5 flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-white" />
                <span className="text-white font-semibold text-xs sm:text-sm">Verdant</span>
              </span>
              <div className="hidden md:flex items-center gap-5">
                {["Features", "Mining", "About"].map((label) => (
                  <a
                    key={label}
                    href="#"
                    onClick={prevent}
                    className="text-white/80 hover:text-white text-[11px] font-medium"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <a href="#" onClick={prevent} className="text-white text-[11px] font-medium hidden sm:inline">
                Sign Up
              </a>
              <a
                href="#"
                onClick={prevent}
                className="liquid-glass rounded-full px-3 sm:px-4 py-1 text-white text-[11px] font-medium"
              >
                Login
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 text-center -translate-y-[8%] sm:-translate-y-[15%]">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4 sm:mb-5 tracking-tight whitespace-nowrap"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Grown for the curious
          </h1>
          <div className="max-w-sm w-full space-y-3">
            <form
              className="liquid-glass rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) {
                  setSubscribed(true);
                  setEmail("");
                }
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={subscribed ? "You're on the list 🌱" : "Enter your email"}
                className="flex-1 bg-transparent text-white placeholder:text-white/40 text-xs focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="bg-white rounded-full p-1.5 text-black hover:bg-white/90 transition-colors"
              >
                <ArrowRight size={14} />
              </button>
            </form>
            <p className="text-white/80 text-[11px] leading-relaxed px-2">
              Watch the meadow grow. Get protocol updates, halving alerts and explorer drops — no
              spam, just blocks.
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setManifestoOpen(true)}
                className="liquid-glass rounded-full px-5 py-1.5 text-white text-[11px] font-medium hover:bg-white/5 transition-colors"
              >
                Manifesto
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-center gap-2 pb-4 sm:pb-6">
          {[Instagram, Twitter, Globe].map((Icon, i) => (
            <a
              key={i}
              href="#"
              onClick={prevent}
              aria-label="Social link"
              className="liquid-glass rounded-full p-2 text-white/80 hover:text-white hover:bg-white/5 transition-all"
            >
              <Icon size={14} />
            </a>
          ))}
        </div>
      </div>

      {/* The mock site's manifesto opens inside the preview panel itself. */}
      <AnimatePresence>
        {manifestoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
          >
            <div className="max-w-xs text-center">
              <h2
                className="mb-4 text-2xl text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                The Verdant Manifesto
              </h2>
              <p className="text-xs leading-relaxed text-white/70">
                Chains don't need data centers. Proof should be something you can watch. Every
                block here is mined by you, for you — signed, sealed and re-verified in the time
                it takes to read this. Touch grass. Grow blocks.
              </p>
              <button
                type="button"
                onClick={() => setManifestoOpen(false)}
                className="liquid-glass mt-5 rounded-full px-5 py-1.5 text-[11px] font-medium text-white hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
