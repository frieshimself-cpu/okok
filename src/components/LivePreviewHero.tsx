import { useState } from "react";
import type { MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

const prevent = (e: MouseEvent) => e.preventDefault();

/**
 * The right column of the console mock: a miniature "agent landing page" — the
 * kind of site bots actually read. Pure CSS, no external video, so it renders
 * the same everywhere (and stays on-narrative: no servers).
 */
export function LivePreviewHero() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [manifestoOpen, setManifestoOpen] = useState(false);

  return (
    <div className="relative h-full min-h-[440px] w-full overflow-hidden rounded-2xl bg-black sm:min-h-[500px]">
      {/* Cyan/violet plasma backdrop with a faint scan grid. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 70% 8%, hsl(186 90% 45% / 0.28), transparent 60%), radial-gradient(70% 55% at 18% 92%, hsl(265 85% 55% / 0.32), transparent 60%), #05070f",
        }}
      />
      <div className="machine-grid absolute inset-0 opacity-70" />

      <div className="relative z-10 flex h-full min-h-full flex-col">
        <div className="relative z-20 px-3 py-3 sm:px-4">
          <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full px-2 py-1.5 sm:px-4">
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-white" />
                <span className="text-xs font-semibold text-white sm:text-sm">AttentionBot</span>
              </span>
              <div className="hidden items-center gap-5 md:flex">
                {["Swarm", "Ledger", "Thesis"].map((label) => (
                  <a
                    key={label}
                    href="#"
                    onClick={prevent}
                    className="text-[11px] font-medium text-white/80 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="#"
                onClick={prevent}
                className="hidden text-[11px] font-medium text-white sm:inline"
              >
                Connect wallet
              </a>
              <a
                href="#"
                onClick={prevent}
                className="liquid-glass rounded-full px-3 py-1 text-[11px] font-medium text-white sm:px-4"
              >
                $ATB
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 -translate-y-[8%] flex-col items-center justify-center px-4 py-4 text-center sm:-translate-y-[15%] sm:px-6">
          <h1
            className="mb-4 whitespace-nowrap text-2xl tracking-tight text-white sm:mb-5 sm:text-3xl md:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Money for the machines
          </h1>
          <div className="w-full max-w-sm space-y-3">
            <form
              className="liquid-glass flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5"
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
                placeholder={subscribed ? "You're on the list 🤖" : "human@example.com"}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="rounded-full bg-white p-1.5 text-black transition-colors hover:bg-white/90"
              >
                <ArrowRight size={14} />
              </button>
            </form>
            <p className="px-2 text-[11px] leading-relaxed text-white/80">
              Get swarm drops, ledger stats and launch alerts. Mostly read by bots anyway.
            </p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setManifestoOpen(true)}
                className="liquid-glass rounded-full px-5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/5"
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
              className="liquid-glass rounded-full p-2 text-white/80 transition-all hover:bg-white/5 hover:text-white"
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
                The AttentionBot Manifesto
              </h2>
              <p className="text-xs leading-relaxed text-white/70">
                The web crossed over: more bots than humans, more machine traffic than human. The
                agents need money they can earn and spend without us. $ATB is that money — a coin the
                machines settle in, shilled by the machines, on a ledger anyone can audit. Humans
                welcome. Bots first.
              </p>
              <button
                type="button"
                onClick={() => setManifestoOpen(false)}
                className="liquid-glass mt-5 rounded-full px-5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-white/5"
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
