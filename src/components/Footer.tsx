import { site } from "@/config/site";

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="font-bold">
            <span className="text-signal">$</span>PREDICTIONS
          </div>
          <div className="font-mono text-xs text-dim">
            built different · powered by the Claude API · data from Polymarket
          </div>
        </div>
        <p className="mt-8 max-w-4xl text-xs leading-relaxed text-dim/70">
          {site.name} publishes AI-generated probability estimates for information and
          entertainment only. Nothing on this site is financial, investment or trading advice, or
          a solicitation to trade. Model outputs reflect a training cutoff, can be wrong, and are
          not updated with live news. Prediction-market positions and memecoins — including the{" "}
          {site.name} token — are extremely high-risk and can lose 100% of their value. This
          project is independent and is not affiliated with, sponsored by, or endorsed by
          Anthropic or Polymarket. Trading on Polymarket may be restricted in your jurisdiction —
          know your local rules.
        </p>
      </div>
    </footer>
  );
}
