const faqs = [
  {
    q: "Is this financial advice?",
    a: "No. The board shows probability estimates from an AI model, published for information and entertainment. Markets can and will disagree with the model. Do your own research and only risk what you can afford to lose entirely.",
  },
  {
    q: "How are the picks actually made?",
    a: "On each refresh the server pulls Polymarket's top-volume binary markets, sends them to Claude in a single batched API call, and asks for a calibrated probability per market with a written rationale. Picks are the markets where Claude's estimate differs most from the price, weighted by its stated confidence.",
  },
  {
    q: "Does Claude know today's news?",
    a: "Not necessarily — models have a training cutoff and this engine doesn't browse. That's why it's prompted to prefer structural edges (deadline math, base rates, resolution-criteria quirks) and to PASS on markets that hinge on breaking news. Each pick ships with a risk note for exactly this reason.",
  },
  {
    q: "What is the $PREDICTIONS token for?",
    a: "It's the community memecoin around the project, launched on pump.fun. It grants no rights, no yield and no access — the board is free for everyone. If you buy it, you're buying a meme.",
  },
  {
    q: "Where do I find the contract address?",
    a: "Only on this site and our official socials once the pump.fun launch goes live. Anything posted before we announce it is a scam — copycat tokens always front-run launches like this.",
  },
  {
    q: "Is this affiliated with Anthropic or Polymarket?",
    a: "No. The engine is built on the Claude API and reads Polymarket's public market data, but the project is independent and not endorsed by either company.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="border-t border-line bg-panel/40">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Questions, <span className="text-signal">answered</span>
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card group px-5 py-4">
              <summary className="cursor-pointer list-none font-bold marker:content-none">
                <span className="mr-2 font-mono text-signal transition-transform group-open:hidden">+</span>
                <span className="mr-2 hidden font-mono text-signal group-open:inline">−</span>
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
