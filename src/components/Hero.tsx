import CopyCA from "@/components/CopyCA";
import { site } from "@/config/site";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="glow-orb absolute -top-32 left-1/2 h-96 w-[44rem] -translate-x-1/2" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-[1.15fr_1fr] md:items-center md:pt-24">
        <div className="animate-rise">
          <div className="chip inline-flex items-center gap-2 border-signal/40 text-signal">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-signal" />
            LIVE ON POLYMARKET DATA · TOKEN ON PUMP.FUN
          </div>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Claude reads the markets.
            <br />
            <span className="text-signal text-glow">You take the trade.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg text-dim">
            {site.name} points Claude at Polymarket&apos;s biggest markets, has it estimate the
            real odds, and surfaces the gaps — ranked by edge, explained in plain English.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#picks"
              className="rounded-full bg-signal px-6 py-3 font-bold text-[#04130c] transition-transform hover:scale-105"
            >
              View today&apos;s picks
            </a>
            <a
              href={site.pumpFunUrl || "https://pump.fun"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line px-6 py-3 font-bold text-ink transition-colors hover:border-signal/50 hover:text-signal"
            >
              Buy on pump.fun ↗
            </a>
          </div>

          <div className="mt-6">
            <CopyCA />
          </div>

          <p className="mt-6 max-w-xl text-xs text-dim/80">
            AI estimates, not guarantees. Nothing here is financial advice — prediction markets
            and memecoins can go to zero.
          </p>
        </div>

        <TerminalCard />
      </div>
    </section>
  );
}

function TerminalCard() {
  return (
    <div className="card animate-rise p-1 font-mono text-[13px] leading-relaxed shadow-2xl shadow-black/60 [animation-delay:120ms]">
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-blood/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
        <span className="ml-3 text-xs text-dim">claude@predictions — edge-scan</span>
      </div>
      <div className="space-y-1.5 px-4 py-4 text-dim">
        <p>
          <span className="text-signal">$</span> scan polymarket --order volume --binary
        </p>
        <p>↳ pulling top markets from gamma-api…</p>
        <p>
          ↳ <span className="text-ink">14 markets</span> pass liquidity + deadline filters
        </p>
        <p>
          <span className="text-signal">$</span> claude analyze --calibrated --explain
        </p>
        <p>↳ estimating true odds vs market price…</p>
        <p>
          ↳ edge found: <span className="text-amber">market 8% / model 3%</span> → fade the
          longshot
        </p>
        <p>
          ↳ edge found: <span className="text-amber">market 61% / model 72%</span> → YES is
          cheap
        </p>
        <p>
          <span className="text-signal">$</span> publish board
          <span className="animate-blink text-signal">▌</span>
        </p>
      </div>
    </div>
  );
}
