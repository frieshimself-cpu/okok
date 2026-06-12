import { FadeUp } from "../FadeUp";
import { Section } from "./Section";
import { useChain } from "../../context/ChainContext";

export function About() {
  const { booting, stats } = useChain();

  const tiles = [
    { label: "Block height", value: stats ? `#${stats.height}` : "—" },
    { label: "Circulating supply", value: stats ? `${stats.supply.toLocaleString()} LEAF` : "—" },
    { label: "Cumulative work", value: stats ? `2^${Math.log2(stats.work).toFixed(1)}` : "—" },
    { label: "Tip difficulty", value: stats ? `${stats.difficulty} bits` : "—" },
  ];

  return (
    <Section
      id="about"
      eyebrow="About"
      title="A real chain, not a simulation"
      intro="Verdant enforces the same rules that secure every proof-of-work blockchain — hash-linked blocks, signed transactions, difficulty retargeting, heaviest-chain consensus. The only difference: the node is this page. It booted when you arrived, mined its first blocks in your browser, and revalidates itself from genesis on demand. The numbers below are its live state."
      className="py-24"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile, i) => (
          <FadeUp key={tile.label} delay={i * 0.08}>
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
