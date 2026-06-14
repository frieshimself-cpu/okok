/**
 * One AttentionBot ledger node for the whole page. On mount it restores the chain and
 * wallets from localStorage (fully revalidating from genesis — corrupted
 * storage is discarded, not trusted) or boots fresh by mining the first
 * blocks. Every successful operation persists, so the chain survives
 * reloads. All operations are serialized through a queue so the chat panel
 * and the mining lab can never race each other.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Blockchain,
  DEFAULT_CONFIG,
  shortAddress,
  Wallet,
  type Block,
  type ChainConfig,
  type MineOptions,
  type MineResult,
  type WalletExport,
} from "../chain";

/** The exact consensus parameters the in-page node runs. */
export const PAGE_CHAIN_CONFIG: ChainConfig = {
  ...DEFAULT_CONFIG,
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

const STORAGE_KEY = "attentionbot:ledger:v1";

interface PersistedState {
  version: 1;
  chain: Block[];
  wallet: WalletExport;
  peer: WalletExport;
  savedAt: number;
}

export interface ChainStats {
  height: number;
  tipHash: string;
  difficulty: number;
  supply: number;
  work: number;
  mempool: number;
  address: string;
  balance: number;
  peerAddress: string;
  peerBalance: number;
}

export interface MiningProgress {
  attempts: number;
  hashrate: number;
}

interface ChainContextValue {
  booting: boolean;
  mining: boolean;
  /** True when this session resumed a chain saved by a previous visit. */
  restored: boolean;
  progress: MiningProgress | null;
  blocks: Block[];
  stats: ChainStats | null;
  mineOne: () => Promise<MineResult | null>;
  sendTransfer: () => Promise<string>;
  audit: () => Promise<{ valid: boolean; error?: string }>;
  handlePrompt: (text: string) => Promise<string>;
  resetChain: () => Promise<void>;
}

const ChainContext = createContext<ChainContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useChain(): ChainContextValue {
  const value = useContext(ChainContext);
  if (!value) throw new Error("useChain must be used inside <ChainProvider>");
  return value;
}

interface ChainEnv {
  chain: Blockchain;
  wallet: Wallet;
  peer: Wallet;
  walletExport: WalletExport;
  peerExport: WalletExport;
}

const fmtHash = (hash: string) => `${hash.slice(0, 10)}…`;
const fmtSecs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export function ChainProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [mining, setMining] = useState(false);
  const [restored, setRestored] = useState(false);
  const [progress, setProgress] = useState<MiningProgress | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<ChainStats | null>(null);

  const envRef = useRef<ChainEnv | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const startedRef = useRef(false);
  const lastProgressPaintRef = useRef(0);

  const persist = useCallback(() => {
    const env = envRef.current;
    if (!env) return;
    const payload: PersistedState = {
      version: 1,
      chain: env.chain.chain,
      wallet: env.walletExport,
      peer: env.peerExport,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Quota exceeded or storage unavailable (private mode) — the chain
      // still works for this session, it just won't survive a reload.
    }
  }, []);

  const refresh = useCallback(() => {
    const env = envRef.current;
    if (!env) return;
    const { chain, wallet, peer } = env;
    setBlocks([...chain.chain]);
    setStats({
      height: chain.height,
      tipHash: chain.tip.hash,
      difficulty: chain.tip.difficulty,
      supply: chain.totalSupply(),
      work: chain.work(),
      mempool: chain.mempool.length,
      address: wallet.address,
      balance: chain.getBalance(wallet.address),
      peerAddress: peer.address,
      peerBalance: chain.getBalance(peer.address),
    });
    persist();
  }, [persist]);

  const mineOptions = useCallback(
    (): MineOptions => ({
      yieldEvery: YIELD_EVERY,
      onProgress: (attempts, elapsedMs) => {
        const now = performance.now();
        if (now - lastProgressPaintRef.current < 100) return;
        lastProgressPaintRef.current = now;
        setProgress({
          attempts,
          hashrate: elapsedMs > 0 ? Math.round(attempts / (elapsedMs / 1000)) : 0,
        });
      },
    }),
    [],
  );

  /** Try to resume a previous session; returns false when there is nothing usable. */
  const tryRestore = useCallback(async (): Promise<boolean> => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
    if (!raw) return false;

    try {
      const data = JSON.parse(raw) as PersistedState;
      if (data.version !== 1) throw new Error("unknown storage version");
      const wallet = await Wallet.restore(data.wallet);
      const peer = await Wallet.restore(data.peer);
      // fromChain revalidates every block from genesis — tampered or
      // corrupted storage fails here and we fall back to a fresh boot.
      const chain = await Blockchain.fromChain(data.chain, PAGE_CHAIN_CONFIG);
      envRef.current = {
        chain,
        wallet,
        peer,
        walletExport: data.wallet,
        peerExport: data.peer,
      };
      return true;
    } catch (err) {
      console.warn("attentionbot: discarding unusable saved state", err);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return false;
    }
  }, []);

  const freshBoot = useCallback(async () => {
    const chain = new Blockchain(PAGE_CHAIN_CONFIG);
    const wallet = await Wallet.create();
    const peer = await Wallet.create();
    envRef.current = {
      chain,
      wallet,
      peer,
      walletExport: await wallet.export(),
      peerExport: await peer.export(),
    };
    refresh();

    await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
    refresh();
    await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
    refresh();
    const tx = await wallet.createTransaction(peer.address, 5, 1, chain.getPendingNonce(wallet.address));
    await chain.addTransaction(tx);
    await chain.mineBlock(wallet.address, { yieldEvery: YIELD_EVERY });
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      if (await tryRestore()) {
        setRestored(true);
        refresh();
      } else {
        await freshBoot();
      }
      setBooting(false);
    })().catch((err) => console.error("attentionbot ledger boot failed", err));
  }, [freshBoot, refresh, tryRestore]);

  /** Mine one block for the page wallet. Not queued — wrap with enqueue(). */
  const rawMine = useCallback(async (): Promise<MineResult | null> => {
    const env = envRef.current;
    if (!env) return null;
    setMining(true);
    setProgress(null);
    try {
      return await env.chain.mineBlock(env.wallet.address, mineOptions());
    } finally {
      setMining(false);
      setProgress(null);
      refresh();
    }
  }, [mineOptions, refresh]);

  const rawSend = useCallback(async (): Promise<string> => {
    const env = envRef.current;
    if (!env) return "The chain is still booting — try again in a second.";
    const { chain, wallet, peer } = env;
    const amount = 2 + Math.floor(Math.random() * 5);
    const tx = await wallet.createTransaction(peer.address, amount, 1, chain.getPendingNonce(wallet.address));
    await chain.addTransaction(tx);
    refresh();
    const mined = await rawMine();
    if (!mined) return "Mining was interrupted.";
    return (
      `Agent signed a transfer of ${amount} ATB (fee 1) with ECDSA P-256, then sealed block #${mined.block.index} ` +
      `to confirm it — ${fmtHash(mined.block.hash)} after ${mined.attempts.toLocaleString()} hashes. ` +
      `Balances now: you ${chain.getBalance(wallet.address)} ATB, counterparty agent ${chain.getBalance(peer.address)} ATB.`
    );
  }, [rawMine, refresh]);

  const rawAudit = useCallback(async (): Promise<{ valid: boolean; error?: string }> => {
    const env = envRef.current;
    if (!env) return { valid: false, error: "chain still booting" };
    const result = await env.chain.audit();
    refresh();
    return { valid: result.valid, error: result.error };
  }, [refresh]);

  /** Serialize chain operations; chat and lab buttons share one queue. */
  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.then(operation, operation);
    queueRef.current = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }, []);

  const mineOne = useCallback(() => enqueue(rawMine), [enqueue, rawMine]);
  const sendTransfer = useCallback(() => enqueue(rawSend), [enqueue, rawSend]);
  const audit = useCallback(() => enqueue(rawAudit), [enqueue, rawAudit]);

  /** Wipe storage and grow a brand-new chain from genesis. */
  const resetChain = useCallback(
    () =>
      enqueue(async () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        envRef.current = null;
        setRestored(false);
        setBooting(true);
        setBlocks([]);
        setStats(null);
        await freshBoot();
        setBooting(false);
      }),
    [enqueue, freshBoot],
  );

  const handlePrompt = useCallback(
    (text: string): Promise<string> =>
      enqueue(async () => {
        const env = envRef.current;
        if (!env) {
          return "The chain is still booting — wallets are being minted and the first blocks mined. Give it a second and try again.";
        }
        const { chain, wallet, peer } = env;
        const prompt = text.toLowerCase();

        if (/balance|wallet|holding|supply|rich/.test(prompt)) {
          return (
            `Your agent wallet ${shortAddress(wallet.address)} holds ${chain.getBalance(wallet.address)} ATB; ` +
            `the counterparty agent ${shortAddress(peer.address)} holds ${chain.getBalance(peer.address)} ATB. ` +
            `Total supply is ${chain.totalSupply()} ATB across ${chain.height} blocks — every unit traceable to a coinbase.`
          );
        }

        if (/valid|verify|audit|check|tamper|secure/.test(prompt)) {
          const result = await rawAudit();
          return result.valid
            ? `Re-verified the whole chain from genesis: ${chain.height + 1} blocks — every hash, proof-of-work, ` +
                `ECDSA signature, nonce and balance checked. Verdict: valid ✓. Cumulative work 2^${Math.log2(chain.work()).toFixed(1)}.`
            : `Audit failed: ${result.error}`;
        }

        if (/send|pay|transfer|transaction|tx\b/.test(prompt)) {
          return rawSend();
        }

        const mined = await rawMine();
        if (!mined) return "Mining was interrupted — try again.";
        return (
          `Sealed block #${mined.block.index} in ${fmtSecs(mined.durationMs)} — ${fmtHash(mined.block.hash)} at ` +
          `${mined.block.difficulty}-bit difficulty, ${mined.attempts.toLocaleString()} hashes. ` +
          `Reward ${mined.block.transactions[0].amount} ATB → ${shortAddress(wallet.address)}. ` +
          `Height ${chain.height}, supply ${chain.totalSupply()} ATB, ledger valid ✓`
        );
      }),
    [enqueue, rawAudit, rawMine, rawSend],
  );

  return (
    <ChainContext.Provider
      value={{
        booting,
        mining,
        restored,
        progress,
        blocks,
        stats,
        mineOne,
        sendTransfer,
        audit,
        handlePrompt,
        resetChain,
      }}
    >
      {children}
    </ChainContext.Provider>
  );
}
