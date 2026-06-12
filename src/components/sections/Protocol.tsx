import { FadeUp } from "../FadeUp";
import { MIcon } from "../MIcon";
import { Section } from "./Section";

const features = [
  {
    icon: "bolt",
    title: "SHA-256 proof-of-work",
    body: "Every block is sealed by grinding nonces until its hash clears a leading-zero-bit target. The hash function is hand-rolled TypeScript, verified against NIST test vectors, and retargets ±1 bit to chase a steady block time.",
  },
  {
    icon: "key",
    title: "ECDSA wallets",
    body: "Keys are minted in your browser with WebCrypto (P-256). Addresses are hashes of public keys; every transfer carries a signature over a canonical payload plus the sender's exact nonce — so replayed transactions bounce.",
  },
  {
    icon: "account_tree",
    title: "Merkle-sealed history",
    body: "Headers commit to a Merkle root of their transactions, and each block to its parent's hash. Change one amount anywhere in history and every proof above it shatters — the audit catches it instantly.",
  },
  {
    icon: "alt_route",
    title: "Heaviest-chain consensus",
    body: "Competing chains are adopted only when they are fully valid and carry more cumulative proof-of-work — the same fork-choice rule Bitcoin runs, demonstrated end-to-end in the test suite and CLI demo.",
  },
];

export function Protocol() {
  return (
    <Section
      id="protocol"
      eyebrow="Protocol"
      title="Four rules, no exceptions"
      intro="Everything below is enforced on every block — whether it was mined on this page or handed to the node by a rival chain."
      className="py-24"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature, i) => (
          <FadeUp key={feature.title} delay={i * 0.08}>
            <div className="liquid-glass h-full rounded-2xl p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300/90">
                <MIcon name={feature.icon} size={18} />
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-text-muted">{feature.body}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}
