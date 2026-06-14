import { FadeUp } from "../FadeUp";
import { MIcon } from "../MIcon";
import { Section } from "./Section";
import { useChain } from "../../context/ChainContext";

const claims = [
  {
    icon: "smart_toy",
    stat: "> humans",
    body: "For the first time in history, more bots than humans browse the web. Most traffic is now automated — crawlers, agents, scrapers and assistants.",
  },
  {
    icon: "currency_exchange",
    stat: "M2M",
    body: "Most digital payments, trades and transactions are moving to machines. Agents will negotiate, pay and settle with other agents, around the clock.",
  },
  {
    icon: "hub",
    stat: "machines ↔ machines",
    body: "A growing share of the internet is no longer humans talking to humans, but machines interacting. The audience for everything you publish is increasingly software.",
  },
];

export function About() {
  const { booting, stats } = useChain();

  const tiles = [
    { label: "Ledger height", value: stats ? `#${stats.height}` : "—" },
    { label: "ATB in circulation", value: stats ? `${stats.supply.toLocaleString()}` : "—" },
    { label: "Machine work sealed", value: stats ? `2^${Math.log2(stats.work).toFixed(1)}` : "—" },
    { label: "Tip difficulty", value: stats ? `${stats.difficulty} bits` : "—" },
  ];

  return (
    <Section
      id="about"
      eyebrow="The Thesis"
      title="A web run by machines needs machine money"
      intro="The crossover already happened. Bots outnumber humans online, and the share of the internet that is machines transacting with machines only grows from here. When the buyers, sellers and middlemen are all software, they need a native unit of account — one a bot can earn, hold and spend without ever asking a human. That unit is $AttentionBot."
      className="py-24"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {claims.map((claim, i) => (
          <FadeUp key={claim.stat} delay={i * 0.08}>
            <div className="liquid-glass h-full rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <MIcon name={claim.icon} size={18} />
                </div>
                <span className="font-mono text-sm text-accent/90">{claim.stat}</span>
              </div>
              <p className="mt-4 font-inter text-sm leading-relaxed text-landing-text-muted">
                {claim.body}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.1}>
        <p className="mt-10 font-inter text-sm text-white/40">
          And they’re already settling — on a real ledger running live in this page:
        </p>
      </FadeUp>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <FadeUp key={tile.label} delay={i * 0.06}>
            <div className="liquid-glass rounded-2xl p-5 font-inter">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    booting ? "animate-pulse bg-foreground/30" : "bg-accent"
                  }`}
                />
                <span className="text-[11px] uppercase tracking-wider text-white/40">
                  {tile.label}
                </span>
              </div>
              <p className="mt-2 text-2xl tabular-nums tracking-tight text-foreground">
                {tile.value}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}
