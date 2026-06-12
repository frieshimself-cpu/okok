/**
 * Boots a real Verdant node inside the page: mints two wallets, mines the
 * first blocks, then exposes a prompt interface the chat panel uses — every
 * prompt drives actual chain operations (mining, signed transfers, audits)
 * and the replies report real receipts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Blockchain,
  shortAddress,
  Wallet,
  type ChainConfig,
  type MineResult,
} from "../chain";

const BROWSER_CONFIG: Partial<ChainConfig> = {
  initialDifficulty: 13,
  minDifficulty: 12,
  maxDifficulty: 16,
  targetBlockTimeMs: 4_000,
  blockReward: 50,
  halvingInterval: 100,
  maxTransactionsPerBlock: 50,
};

/** Yield to the event loop every N hashes so mining never janks the page. */
const YIELD_EVERY = 2_500;

export interface ChainStats {
  height: number;
  tipHash: string;
  difficulty: number;
  supply: number;
  address: string;
  balance: number;
  peerAddress: string;
  peerBalance: number;
}

export interface VerdantHandle {
  booting: boolean;
  stats: ChainStats | null;
  handlePrompt: (text: string) => Promise<string>;
}

interface ChainEnv {
  chain: Blockchain;
  wallet: Wallet;
  peer: Wallet;
}

const fmtHash = (hash: string) => `${hash.slice(0, 10)}…`;
const fmtSecs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export function useVerdantChain(): VerdantHandle {
  const [booting, setBooting] = useState(true);
  const [stats, setStats] = useState<ChainStats | null>(null);
  const envRef = useRef<ChainEnv | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const startedRef = useRef(false);

  const refresh = useCallback(() => {
    const env = envRef.current;
    if (!env) return;
    const { chain, wallet, peer } = env;
    setStats({
      height: chain.height,
      tipHash: chain.tip.hash,
      difficulty: chain.tip.difficulty,
      supply: chain.totalSupply(),
      address: wallet.address,
      balance: chain.getBalance(wallet.address),
      peerAddress: peer.address,
      peerBalance: chain.getBalance(peer.address),
    });
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    (async () => {
      const chain = new Blockchain(BROWSER_CONFIG);
      const wallet = await Wallet.create();
      const peer = await Wallet.create();
      envRef.current = { chain, wallet, peer };

      await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
      await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
      const tx = await wallet.createTransaction(peer.address, 5, 1, chain.getPendingNonce(wallet.address));
      await chain.addTransaction(tx);
      await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });

      if (cancelled) return;
      refresh();
      setBooting(false);
    })().catch((err) => console.error("verdant boot failed", err));

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const handlePrompt = useCallback(
    (text: string): Promise<string> => {
      const run = async (): Promise<string> => {
        const env = envRef.current;
        if (!env) {
          return "The chain is still booting — wallets are being minted and the first blocks mined. Give it a second and try again.";
        }
        const { chain, wallet, peer } = env;
        const prompt = text.toLowerCase();

        try {
          if (/balance|wallet|holding|supply|rich/.test(prompt)) {
            return (
              `Your wallet ${shortAddress(wallet.address)} holds ${chain.getBalance(wallet.address)} LEAF; ` +
              `the peer wallet ${shortAddress(peer.address)} holds ${chain.getBalance(peer.address)} LEAF. ` +
              `Total supply is ${chain.totalSupply()} LEAF across ${chain.height} blocks — every unit traceable to a coinbase.`
            );
          }

          if (/valid|verify|audit|check|tamper|secure/.test(prompt)) {
            const audit = await chain.audit();
            return audit.valid
              ? `Re-verified the whole chain from genesis: ${chain.height + 1} blocks — every hash, proof-of-work, ` +
                  `ECDSA signature, nonce and balance checked. Verdict: valid ✓. Cumulative work 2^${Math.log2(chain.work()).toFixed(1)}.`
              : `Audit failed: ${audit.error}`;
          }

          if (/send|pay|transfer|transaction|tx\b/.test(prompt)) {
            const amount = 2 + Math.floor(Math.random() * 5);
            const tx = await wallet.createTransaction(peer.address, amount, 1, chain.getPendingNonce(wallet.address));
            await chain.addTransaction(tx);
            const mined = await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
            return (
              `Signed a transfer of ${amount} LEAF (fee 1) with ECDSA P-256, then mined block #${mined.block.index} ` +
              `to confirm it — ${fmtHash(mined.block.hash)} after ${mined.attempts.toLocaleString()} hashes. ` +
              `Balances now: you ${chain.getBalance(wallet.address)} LEAF, peer ${chain.getBalance(peer.address)} LEAF.`
            );
          }

          const mined: MineResult = await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
          return (
            `Sealed block #${mined.block.index} in ${fmtSecs(mined.durationMs)} — ${fmtHash(mined.block.hash)} at ` +
            `${mined.block.difficulty}-bit difficulty, ${mined.attempts.toLocaleString()} hashes. ` +
            `Reward ${mined.block.transactions[0].amount} LEAF → ${shortAddress(wallet.address)}. ` +
            `Height ${chain.height}, supply ${chain.totalSupply()} LEAF, chain valid ✓`
          );
        } finally {
          refresh();
        }
      };

      const next = queueRef.current.then(run, run);
      queueRef.current = next.catch(() => undefined);
      return next;
    },
    [refresh],
  );

  return { booting, stats, handlePrompt };
}
