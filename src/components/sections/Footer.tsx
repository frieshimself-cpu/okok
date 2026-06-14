import { MIcon } from "../MIcon";
import { PUMP_FUN_URL } from "../TokenCA";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-6 px-6 py-12 sm:flex-row">
        <div className="flex items-center gap-2 text-foreground">
          <MIcon name="smart_toy" size={18} />
          <span className="text-xl tracking-wide">AttentionBot</span>
          <span className="font-mono text-sm text-accent/80">$ATB</span>
          <span className="text-sm text-white/30">· the coin for an internet run by bots</span>
        </div>
        <div className="flex items-center gap-6 font-inter text-sm text-landing-text-muted">
          <a
            className="transition-colors hover:text-foreground"
            href={PUMP_FUN_URL}
            target="_blank"
            rel="noreferrer"
          >
            pump.fun ↗
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="https://github.com/frieshimself-cpu/okok"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="transition-colors hover:text-foreground"
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Back to top
          </a>
        </div>
      </div>
      <p className="mx-auto max-w-[1080px] px-6 pb-12 text-center font-inter text-xs leading-relaxed text-white/30">
        $AttentionBot is a community memecoin and an art project about the machine internet. The live
        swarm and the settlement ledger run entirely in your browser for illustration. Nothing here is
        financial advice or a promise of value — do your own research.
      </p>
    </footer>
  );
}
