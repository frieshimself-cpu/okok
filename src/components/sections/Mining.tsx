import { useEffect, useMemo, useReducer, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FadeUp } from "../FadeUp";
import { MIcon } from "../MIcon";
import { Section } from "./Section";
import { useChain } from "../../context/ChainContext";
import { shortAddress } from "../../chain";

function age(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const VISIBLE_BLOCKS = 7;

export function Mining() {
  const { booting, mining, progress, blocks, stats, mineOne, sendTransfer, audit, resetChain } =
    useChain();
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Re-render every few seconds so block ages stay fresh.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const timer = setInterval(tick, 5_000);
    return () => clearInterval(timer);
  }, []);

  const recent = useMemo(() => [...blocks].reverse().slice(0, VISIBLE_BLOCKS), [blocks]);
  const hiddenCount = Math.max(0, blocks.length - VISIBLE_BLOCKS);
  const busy = booting || mining;

  const copyAddress = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (permissions, http) — fail quietly.
    }
  };

  const onMine = async () => {
    const result = await mineOne();
    if (result) {
      setLastAction(
        `Sealed block #${result.block.index} — ${result.block.hash.slice(0, 14)}… in ` +
          `${(result.durationMs / 1000).toFixed(2)}s after ${result.attempts.toLocaleString()} hashes.`,
      );
    }
  };

  const onSend = async () => setLastAction(await sendTransfer());

  const onAudit = async () => {
    const result = await audit();
    setLastAction(
      result.valid
        ? "Audit complete: every hash, signature, nonce and balance re-verified from genesis — valid ✓"
        : `Audit failed: ${result.error}`,
    );
  };

  const onReset = async () => {
    setLastAction("Wiping saved state — growing a fresh chain from genesis…");
    await resetChain();
    setLastAction("Fresh genesis era: new wallet, new chain, saved automatically from here on.");
  };

  return (
    <Section
      id="mining"
      eyebrow="Mining"
      title="Mine your next block right here"
      intro="These buttons drive the same node the console talks to. Mine a block and watch it land in the explorer; send LEAF and see the transfer confirmed; audit the whole chain whenever you like. Everything is saved in your browser — reload and it's all still here."
      className="py-24"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Block explorer */}
        <FadeUp>
          <div className="liquid-glass rounded-2xl p-4 font-inter sm:p-5">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-sm font-medium text-foreground">Latest blocks</span>
              <span className="text-[11px] tabular-nums text-white/40">
                {blocks.length} total · {stats?.mempool ?? 0} pending tx
              </span>
            </div>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {recent.map((block) => (
                  <motion.li
                    key={block.hash}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 sm:gap-4"
                  >
                    <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-accent/90">
                      #{block.index}
                    </span>
                    <code className="min-w-0 flex-1 truncate text-xs text-white/70">
                      {block.hash.slice(0, 24)}…
                    </code>
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-white/40 sm:inline">
                      {block.transactions.length} tx
                    </span>
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-white/40 md:inline">
                      {block.difficulty} bits
                    </span>
                    <span className="hidden shrink-0 text-[11px] tabular-nums text-accent/70 md:inline">
                      {block.index === 0 ? "—" : `+${block.transactions[0]?.amount ?? 0} LEAF`}
                    </span>
                    <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-white/40">
                      {block.index === 0 ? "genesis" : age(block.timestamp)}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {hiddenCount > 0 && (
              <p className="px-1 pt-3 text-[11px] text-white/30">
                + {hiddenCount} earlier {hiddenCount === 1 ? "block" : "blocks"} back to genesis
              </p>
            )}
          </div>
        </FadeUp>

        {/* Wallet + actions */}
        <div className="flex flex-col gap-4">
          <FadeUp delay={0.08}>
            <div className="liquid-glass rounded-2xl p-5 font-inter">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-white/40">
                  Your wallet
                </span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <code>{stats ? shortAddress(stats.address) : "minting…"}</code>
                  <MIcon name={copied ? "check" : "content_copy"} size={12} />
                </button>
              </div>
              <p className="mt-3 text-3xl tabular-nums tracking-tight text-foreground">
                {stats ? stats.balance.toLocaleString() : "—"}{" "}
                <span className="text-base text-accent/90">LEAF</span>
              </p>
              <p className="mt-1 text-[11px] tabular-nums text-white/40">
                peer wallet {stats ? shortAddress(stats.peerAddress) : "…"} holds{" "}
                {stats?.peerBalance ?? 0} LEAF · saved in this browser
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.16}>
            <div className="liquid-glass space-y-2.5 rounded-2xl p-5 font-inter">
              <button
                type="button"
                onClick={() => void onMine()}
                disabled={busy}
                className="h-11 w-full rounded-full bg-accent text-sm font-medium text-accent-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: "0 2px 40px hsl(45 70% 50% / 0.35)" }}
              >
                {booting ? "Booting…" : mining ? "Mining…" : "⛏ Mine a block"}
              </button>
              <div className="h-4 text-center text-[11px] tabular-nums text-accent/80">
                {mining && progress
                  ? `${progress.attempts.toLocaleString()} hashes · ${progress.hashrate.toLocaleString()} H/s`
                  : ""}
              </div>
              <button
                type="button"
                onClick={() => void onSend()}
                disabled={busy}
                className="h-11 w-full rounded-full border border-landing-border bg-landing-surface text-sm font-medium text-foreground transition-colors hover:bg-landing-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send LEAF to the peer
              </button>
              <button
                type="button"
                onClick={() => void onAudit()}
                disabled={busy}
                className="h-11 w-full rounded-full border border-landing-border bg-landing-surface text-sm font-medium text-foreground transition-colors hover:bg-landing-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Audit the chain from genesis
              </button>
              <p
                aria-live="polite"
                className="min-h-[3.25rem] pt-1 text-xs leading-relaxed text-landing-text-muted"
              >
                {lastAction ??
                  "Every action here is a real chain operation — state auto-saves in this browser."}
              </p>
              <button
                type="button"
                onClick={() => void onReset()}
                disabled={busy}
                className="w-full text-center text-xs text-foreground/35 underline underline-offset-4 transition-colors hover:text-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset chain & wallet
              </button>
            </div>
          </FadeUp>
        </div>
      </div>
    </Section>
  );
}
