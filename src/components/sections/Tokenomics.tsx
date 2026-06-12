import { FadeUp } from "../FadeUp";
import { Section } from "./Section";
import { blockRewardAt } from "../../chain";
import { PAGE_CHAIN_CONFIG } from "../../context/ChainContext";

/** Emission eras until the reward hits zero, computed from the live config. */
const eras: number[] = [];
for (let era = 0; ; era++) {
  const reward = blockRewardAt(era * PAGE_CHAIN_CONFIG.halvingInterval, PAGE_CHAIN_CONFIG);
  if (reward === 0) break;
  eras.push(reward);
}
const maxSupply = eras.reduce((sum, reward) => sum + reward * PAGE_CHAIN_CONFIG.halvingInterval, 0);

const parameters = [
  { label: "Block reward (era 0)", value: `${PAGE_CHAIN_CONFIG.blockReward} LEAF` },
  { label: "Halving interval", value: `every ${PAGE_CHAIN_CONFIG.halvingInterval} blocks` },
  { label: "Max supply", value: `${maxSupply.toLocaleString()} LEAF` },
  { label: "Target block time", value: `${PAGE_CHAIN_CONFIG.targetBlockTimeMs / 1000} s` },
  {
    label: "Difficulty window",
    value: `${PAGE_CHAIN_CONFIG.minDifficulty}–${PAGE_CHAIN_CONFIG.maxDifficulty} bits, retarget ±1`,
  },
  { label: "Transaction fees", value: "paid to the miner, forever" },
];

export function Tokenomics() {
  return (
    <Section
      id="tokenomics"
      eyebrow="Tokenomics"
      title="Scarce by construction"
      intro={`The coinbase reward halves every ${PAGE_CHAIN_CONFIG.halvingInterval} blocks until emission ends — these aren't marketing numbers, they're consensus rules: a coinbase that overpays by a single LEAF is rejected by every validator.`}
      className="py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <FadeUp>
          <div className="liquid-glass rounded-2xl p-6">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Block reward per emission era
            </p>
            <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3">
              {eras.map((reward, era) => (
                <div
                  key={era}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[11px] tabular-nums text-emerald-200/80">{reward}</span>
                  <div
                    className="w-full rounded-t-lg border border-emerald-300/20 bg-gradient-to-t from-emerald-500/15 to-emerald-300/50"
                    style={{ height: `${Math.max(5, (reward / eras[0]) * 78)}%` }}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-white/30">
                    era {era}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-landing-text-muted">
              {eras.length} eras × {PAGE_CHAIN_CONFIG.halvingInterval} blocks ={" "}
              {maxSupply.toLocaleString()} LEAF, ever. After the last era miners earn fees only.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <dl className="liquid-glass divide-y divide-white/5 rounded-2xl px-6 py-2">
            {parameters.map((parameter) => (
              <div key={parameter.label} className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="text-sm text-landing-text-muted">{parameter.label}</dt>
                <dd className="text-right text-sm tabular-nums text-foreground">
                  {parameter.value}
                </dd>
              </div>
            ))}
          </dl>
        </FadeUp>
      </div>
    </Section>
  );
}
