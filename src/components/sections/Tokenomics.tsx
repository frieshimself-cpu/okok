import { FadeUp } from "../FadeUp";
import { Section } from "./Section";
import { TokenCA } from "../TokenCA";
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
  { label: "Block reward (era 0)", value: `${PAGE_CHAIN_CONFIG.blockReward} ATB` },
  { label: "Halving interval", value: `every ${PAGE_CHAIN_CONFIG.halvingInterval} blocks` },
  { label: "Max supply", value: `${maxSupply.toLocaleString()} ATB` },
  { label: "Target block time", value: `${PAGE_CHAIN_CONFIG.targetBlockTimeMs / 1000} s` },
  {
    label: "Difficulty window",
    value: `${PAGE_CHAIN_CONFIG.minDifficulty}–${PAGE_CHAIN_CONFIG.maxDifficulty} bits, retarget ±1`,
  },
  { label: "Transaction fees", value: "paid to the sealing agent, forever" },
];

export function Tokenomics() {
  return (
    <Section
      id="tokenomics"
      eyebrow="Tokenomics"
      title="Scarce by construction"
      intro={`The coinbase reward halves every ${PAGE_CHAIN_CONFIG.halvingInterval} blocks until emission ends — these aren't marketing numbers, they're consensus rules an agent can't talk its way around: a coinbase that overpays by a single ATB is rejected by every validator in the swarm.`}
      className="py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <FadeUp>
          <div className="liquid-glass rounded-2xl p-6 font-inter">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Block reward per emission era
            </p>
            <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3">
              {eras.map((reward, era) => (
                <div
                  key={era}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[11px] tabular-nums text-accent/90">{reward}</span>
                  <div
                    className="w-full rounded-t-lg border border-accent/20 bg-gradient-to-t from-accent/15 to-accent/50"
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
              {maxSupply.toLocaleString()} ATB, ever. After the last era, agents earn fees only.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <dl className="liquid-glass divide-y divide-white/5 rounded-2xl px-6 py-2 font-inter">
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

      <FadeUp delay={0.15}>
        <div className="liquid-glass mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-2xl text-foreground">Looking for the tradable coin?</p>
            <p className="mt-1 max-w-[520px] font-inter text-sm leading-relaxed text-landing-text-muted">
              The $AttentionBot memecoin launches on Solana via pump.fun — a community token, separate
              from the in-browser settlement ledger demonstrated on this page. No utility promises, no
              roadmap a human signed. Do your own research; the bots already did theirs.
            </p>
          </div>
          <TokenCA className="w-full shrink-0 sm:w-auto sm:max-w-[460px]" />
        </div>
      </FadeUp>
    </Section>
  );
}
