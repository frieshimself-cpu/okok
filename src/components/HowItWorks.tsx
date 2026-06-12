const steps = [
  {
    n: "01",
    title: "Scan",
    body: "Every refresh pulls Polymarket's highest-volume binary markets from the public Gamma API, filtered for liquidity, sane prices and real time-to-resolution.",
  },
  {
    n: "02",
    title: "Analyze",
    body: "Claude reads each market's exact resolution criteria and estimates the true probability from base rates and deadline math — and passes when news it can't see should decide it.",
  },
  {
    n: "03",
    title: "Rank",
    body: "Edge = Claude's probability minus the market's. The biggest, highest-confidence gaps make the board, each with a plain-English rationale and a risk note.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How the <span className="text-signal">engine</span> works
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card p-6">
              <div className="font-mono text-sm text-signal">{s.n}</div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-dim/70">
          Powered by the Claude API · Market data from Polymarket&apos;s public API · Refreshes
          every 30 minutes
        </p>
      </div>
    </section>
  );
}
