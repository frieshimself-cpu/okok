import { DashboardMock } from "../DashboardMock";
import { Section } from "./Section";
import { useChain } from "../../context/ChainContext";

export function ConsoleSection() {
  const { booting, restored, stats } = useChain();

  return (
    <Section
      id="console"
      eyebrow="Console"
      title="Talk to a chain that remembers you"
      intro="The console on the left is wired to the node running on this page — every message you send mines a real block. And the chain persists: blocks, wallet and balances are saved in your browser, revalidated from genesis on every visit."
      className="pt-28 pb-24"
    >
      <DashboardMock />
      <p className="mt-4 text-center text-sm text-foreground/40">
        {booting
          ? "Booting…"
          : restored
            ? `Resumed from your last visit at block #${stats?.height ?? 0} — nothing was lost.`
            : "Fresh genesis era — everything you mine from here on is saved automatically."}
      </p>
    </Section>
  );
}
