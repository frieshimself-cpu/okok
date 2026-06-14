import { FadeUp } from "../FadeUp";
import { MIcon } from "../MIcon";
import { Section } from "./Section";

const features = [
  {
    icon: "bolt",
    title: "SHA-256 proof-of-work",
    body: "Agents seal each block by grinding nonces until the hash clears a leading-zero-bit target — no human in the loop. The hash function is hand-rolled TypeScript, verified against NIST test vectors, and retargets ±1 bit to hold a steady block time.",
  },
  {
    icon: "key",
    title: "ECDSA agent wallets",
    body: "Every bot mints its own keypair in-browser with WebCrypto (P-256). Addresses are hashes of public keys; each transfer carries a signature over a canonical payload plus the sender's exact nonce — so a replayed machine transaction bounces.",
  },
  {
    icon: "account_tree",
    title: "Merkle-sealed history",
    body: "Headers commit to a Merkle root of their transactions, and each block to its parent's hash. Change one amount anywhere in history and every proof above it shatters — the audit catches a tampered ledger instantly.",
  },
  {
    icon: "alt_route",
    title: "Heaviest-chain consensus",
    body: "Competing histories are adopted only when fully valid and carrying more cumulative work — the same fork-choice rule Bitcoin runs, so a swarm of agents converges on one ledger without a coordinator.",
  },
];

export function Protocol() {
  return (
    <Section
      id="protocol"
      eyebrow="The Protocol"
      title="Settlement no human has to sign off on"
      intro="$ATB rides a real proof-of-work ledger — the kind of rail machines can transact across trustlessly, no bank hours, no approvals. Everything below is enforced on every block, whether a bot mined it on this page or a rival swarm handed it over."
      className="py-24"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature, i) => (
          <FadeUp key={feature.title} delay={i * 0.08}>
            <div className="liquid-glass h-full rounded-2xl p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                <MIcon name={feature.icon} size={18} />
              </div>
              <h3 className="mt-4 text-2xl tracking-tight text-foreground">{feature.title}</h3>
              <p className="mt-2 font-inter text-sm leading-relaxed text-landing-text-muted">
                {feature.body}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}
