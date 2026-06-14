/**
 * The AttentionBot settlement ledger.
 *
 * Consensus rules enforced on every block, whether mined locally or received
 * from a peer:
 *
 *  - the genesis block is fixed by the chain config
 *  - `prevHash` must link to the parent and `hash` must equal the SHA-256 of
 *    the canonical header
 *  - the hash must meet the difficulty demanded by the retarget schedule
 *  - the Merkle root must commit to exactly the included transactions
 *  - exactly one coinbase, first in the block, paying reward + fees — where
 *    the reward halves every `halvingInterval` blocks
 *  - every other transaction must carry a valid ECDSA signature from the
 *    sender's key, the sender's exact next nonce, and be fully funded
 *
 * Fork choice is heaviest-chain: a competing chain replaces ours only if it
 * is fully valid and carries more cumulative proof-of-work.
 */

import { hexToBytes } from "./bytes";
import {
  computeBlockHash,
  meetsDifficulty,
  mineHeader,
  type Block,
  type MineOptions,
} from "./block";
import { merkleRoot } from "./merkle";
import { isCoinbase, txId, verifyTransaction, type Transaction } from "./transaction";

export interface ChainConfig {
  /** Proof-of-work difficulty (leading zero bits) of the first mined block. */
  initialDifficulty: number;
  minDifficulty: number;
  maxDifficulty: number;
  /** Desired solve time per block; the retarget rule steers toward this. */
  targetBlockTimeMs: number;
  /** Coinbase reward at height < halvingInterval. */
  blockReward: number;
  /** Reward halves every this many blocks. */
  halvingInterval: number;
  maxTransactionsPerBlock: number;
}

export const DEFAULT_CONFIG: ChainConfig = {
  initialDifficulty: 14,
  minDifficulty: 8,
  maxDifficulty: 28,
  targetBlockTimeMs: 5_000,
  blockReward: 50,
  halvingInterval: 100,
  maxTransactionsPerBlock: 100,
};

/** 2026-01-01T00:00:00Z — every AttentionBot ledger grows from the same instant. */
export const GENESIS_TIMESTAMP = 1_767_225_600_000;

export interface AccountState {
  balance: number;
  nonce: number;
}

export type LedgerState = Map<string, AccountState>;

export interface ValidationResult {
  valid: boolean;
  error?: string;
  /** Ledger state at the tip — only meaningful when valid. */
  state: LedgerState;
}

export interface MineResult {
  block: Block;
  attempts: number;
  durationMs: number;
}

export function createGenesisBlock(config: ChainConfig): Block {
  const header = {
    index: 0,
    prevHash: "0".repeat(64),
    merkleRoot: merkleRoot([]),
    timestamp: GENESIS_TIMESTAMP,
    difficulty: config.initialDifficulty,
    nonce: 0,
  };
  return { ...header, transactions: [], hash: computeBlockHash(header) };
}

export function blockRewardAt(height: number, config: ChainConfig): number {
  const halvings = Math.floor(height / config.halvingInterval);
  return Math.floor(config.blockReward / 2 ** halvings);
}

/**
 * Difficulty retarget — deterministic from chain data so every validator
 * arrives at the same demand. If the tip was solved in under half the target
 * time, demand one more bit; over double, one less; clamped to config bounds.
 */
export function expectedDifficulty(chainUpToParent: Block[], config: ChainConfig): number {
  const tip = chainUpToParent[chainUpToParent.length - 1];
  if (chainUpToParent.length === 1) return config.initialDifficulty;

  const parent = chainUpToParent[chainUpToParent.length - 2];
  const solveTime = tip.timestamp - parent.timestamp;
  let difficulty = tip.difficulty;
  if (solveTime < config.targetBlockTimeMs / 2) difficulty += 1;
  else if (solveTime > config.targetBlockTimeMs * 2) difficulty -= 1;
  return Math.min(config.maxDifficulty, Math.max(config.minDifficulty, difficulty));
}

/** Total proof-of-work in a chain; the fork-choice metric. */
export function cumulativeWork(chain: Block[]): number {
  return chain.reduce((work, block) => work + 2 ** block.difficulty, 0);
}

function cloneState(state: LedgerState): LedgerState {
  const copy: LedgerState = new Map();
  for (const [address, account] of state) copy.set(address, { ...account });
  return copy;
}

function getAccount(state: LedgerState, address: string): AccountState {
  return state.get(address) ?? { balance: 0, nonce: 0 };
}

function credit(state: LedgerState, address: string, amount: number): void {
  const account = getAccount(state, address);
  state.set(address, { ...account, balance: account.balance + amount });
}

/**
 * Validate `block` as the next block after `prefix`, applying its effects to
 * `state` when valid. Returns an error description, or null when the block
 * is good. `state` must be the ledger at the tip of `prefix` and may be
 * partially mutated when an error is returned — pass a disposable copy.
 */
async function validateNextBlock(
  prefix: Block[],
  block: Block,
  state: LedgerState,
  config: ChainConfig,
): Promise<string | null> {
  const parent = prefix[prefix.length - 1];

  if (block.index !== prefix.length) return `expected index ${prefix.length}, got ${block.index}`;
  if (block.prevHash !== parent.hash) return "prevHash does not link to parent";
  if (!Number.isInteger(block.timestamp) || block.timestamp < parent.timestamp) {
    return "timestamp precedes parent";
  }

  const demanded = expectedDifficulty(prefix, config);
  if (block.difficulty !== demanded) {
    return `difficulty ${block.difficulty} does not match retarget schedule (${demanded})`;
  }
  if (block.hash !== computeBlockHash(block)) return "hash does not match header";
  if (!meetsDifficulty(hexToBytes(block.hash), block.difficulty)) {
    return "hash does not satisfy proof-of-work";
  }

  if (block.transactions.length === 0) return "missing coinbase";
  if (block.transactions.length > config.maxTransactionsPerBlock + 1) return "too many transactions";
  if (block.merkleRoot !== merkleRoot(block.transactions.map(txId))) {
    return "merkle root does not commit to transactions";
  }

  const [coinbase, ...transfers] = block.transactions;
  if (!isCoinbase(coinbase)) return "first transaction must be the coinbase";
  if (coinbase.signature !== "" || coinbase.publicKey !== "" || coinbase.fee !== 0) {
    return "malformed coinbase";
  }

  let fees = 0;
  for (const tx of transfers) {
    if (isCoinbase(tx)) return "duplicate coinbase";
    const verdict = await verifyTransaction(tx);
    if (!verdict.ok) return `bad transaction ${txId(tx).slice(0, 12)}: ${verdict.error}`;

    const sender = getAccount(state, tx.from!);
    if (tx.nonce !== sender.nonce) {
      return `nonce mismatch for ${tx.from}: expected ${sender.nonce}, got ${tx.nonce}`;
    }
    if (sender.balance < tx.amount + tx.fee) {
      return `insufficient funds for ${tx.from}`;
    }

    state.set(tx.from!, {
      balance: sender.balance - tx.amount - tx.fee,
      nonce: sender.nonce + 1,
    });
    credit(state, tx.to, tx.amount);
    fees += tx.fee;
  }

  const dueReward = blockRewardAt(block.index, config) + fees;
  if (!Number.isInteger(coinbase.amount) || coinbase.amount !== dueReward) {
    return `coinbase pays ${coinbase.amount}, consensus allows exactly ${dueReward}`;
  }
  credit(state, coinbase.to, coinbase.amount);

  return null;
}

export class Blockchain {
  readonly config: ChainConfig;
  chain: Block[];
  mempool: Transaction[] = [];
  private state: LedgerState = new Map();

  constructor(config: Partial<ChainConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.chain = [createGenesisBlock(this.config)];
  }

  get tip(): Block {
    return this.chain[this.chain.length - 1];
  }

  /** Height of the tip (genesis is height 0). */
  get height(): number {
    return this.chain.length - 1;
  }

  getBalance(address: string): number {
    return getAccount(this.state, address).balance;
  }

  /** The nonce the account's next transaction must carry (confirmed only). */
  getNonce(address: string): number {
    return getAccount(this.state, address).nonce;
  }

  /** Next valid nonce including transactions waiting in the mempool. */
  getPendingNonce(address: string): number {
    return this.getNonce(address) + this.mempool.filter((tx) => tx.from === address).length;
  }

  totalSupply(): number {
    let supply = 0;
    for (const account of this.state.values()) supply += account.balance;
    return supply;
  }

  work(): number {
    return cumulativeWork(this.chain);
  }

  /** Admit a signed transaction to the mempool (validated against projected state). */
  async addTransaction(tx: Transaction): Promise<void> {
    const verdict = await verifyTransaction(tx);
    if (!verdict.ok) throw new Error(`transaction rejected: ${verdict.error}`);

    const from = tx.from!;
    if (tx.nonce !== this.getPendingNonce(from)) {
      throw new Error(
        `transaction rejected: nonce ${tx.nonce} out of order (expected ${this.getPendingNonce(from)})`,
      );
    }

    const pendingSpend = this.mempool
      .filter((pending) => pending.from === from)
      .reduce((sum, pending) => sum + pending.amount + pending.fee, 0);
    if (this.getBalance(from) - pendingSpend < tx.amount + tx.fee) {
      throw new Error("transaction rejected: insufficient funds (including pending spends)");
    }

    this.mempool.push(tx);
  }

  /**
   * Pick mempool transactions for the next block: highest fee first, while
   * never breaking a sender's nonce ordering.
   */
  private selectTransactions(): Transaction[] {
    const byFee = [...this.mempool].sort((a, b) => b.fee - a.fee);
    const selected = new Set<Transaction>();
    const nextNonce = new Map<string, number>();

    let progressed = true;
    while (progressed && selected.size < this.config.maxTransactionsPerBlock) {
      progressed = false;
      for (const tx of byFee) {
        if (selected.has(tx)) continue;
        const expected = nextNonce.get(tx.from!) ?? this.getNonce(tx.from!);
        if (tx.nonce === expected) {
          selected.add(tx);
          nextNonce.set(tx.from!, expected + 1);
          progressed = true;
          if (selected.size >= this.config.maxTransactionsPerBlock) break;
        }
      }
    }
    return [...selected];
  }

  /** Mine the next block: select transactions, build the coinbase, grind the nonce. */
  async mineBlock(minerAddress: string, opts: MineOptions = {}): Promise<MineResult> {
    const transfers = this.selectTransactions();
    const fees = transfers.reduce((sum, tx) => sum + tx.fee, 0);
    const index = this.chain.length;
    const timestamp = Math.max(Date.now(), this.tip.timestamp);

    const coinbase: Transaction = {
      from: null,
      to: minerAddress,
      amount: blockRewardAt(index, this.config) + fees,
      fee: 0,
      nonce: 0,
      timestamp,
      publicKey: "",
      signature: "",
    };
    const transactions = [coinbase, ...transfers];

    const mined = await mineHeader(
      {
        index,
        prevHash: this.tip.hash,
        merkleRoot: merkleRoot(transactions.map(txId)),
        timestamp,
        difficulty: expectedDifficulty(this.chain, this.config),
        nonce: 0,
      },
      opts,
    );

    const block: Block = { ...mined.header, transactions, hash: mined.hash };
    await this.receiveBlock(block);
    return { block, attempts: mined.attempts, durationMs: mined.durationMs };
  }

  /** Append a block (local or from a peer) after full consensus validation. */
  async receiveBlock(block: Block): Promise<void> {
    const projected = cloneState(this.state);
    const error = await validateNextBlock(this.chain, block, projected, this.config);
    if (error) throw new Error(`block ${block.index} rejected: ${error}`);

    this.chain.push(block);
    this.state = projected;

    const minedIds = new Set(block.transactions.map(txId));
    this.mempool = this.mempool.filter((tx) => !minedIds.has(txId(tx)));
  }

  /** Heaviest-chain fork choice: adopt a competing chain only if valid and heavier. */
  async replaceChain(candidate: Block[]): Promise<void> {
    const result = await Blockchain.validateChain(candidate, this.config);
    if (!result.valid) throw new Error(`candidate chain invalid: ${result.error}`);
    if (cumulativeWork(candidate) <= this.work()) {
      throw new Error("candidate chain does not carry more work");
    }

    this.chain = [...candidate];
    this.state = result.state;
    // Drop mempool entries the new history has confirmed or invalidated.
    this.mempool = this.mempool.filter(
      (tx) => tx.from !== null && tx.nonce >= getAccount(this.state, tx.from).nonce,
    );
  }

  /** Re-validate this node's own chain from genesis. */
  async audit(): Promise<ValidationResult> {
    return Blockchain.validateChain(this.chain, this.config);
  }

  /** Full validation of an arbitrary chain from genesis, rebuilding the ledger. */
  static async validateChain(chain: Block[], config: ChainConfig): Promise<ValidationResult> {
    const state: LedgerState = new Map();
    if (chain.length === 0) return { valid: false, error: "empty chain", state };

    const genesis = createGenesisBlock(config);
    if (JSON.stringify(chain[0]) !== JSON.stringify(genesis)) {
      return { valid: false, error: "genesis block mismatch", state };
    }

    for (let i = 1; i < chain.length; i++) {
      const error = await validateNextBlock(chain.slice(0, i), chain[i], state, config);
      if (error) return { valid: false, error: `block ${i}: ${error}`, state };
    }
    return { valid: true, state };
  }

  /**
   * Rebuild a node from a serialized chain (e.g. persisted to localStorage).
   * The chain is fully revalidated from genesis — corrupted or tampered
   * storage is rejected rather than trusted.
   */
  static async fromChain(chain: Block[], config: Partial<ChainConfig> = {}): Promise<Blockchain> {
    const node = new Blockchain(config);
    const result = await Blockchain.validateChain(chain, node.config);
    if (!result.valid) throw new Error(`cannot restore chain: ${result.error}`);
    node.chain = [...chain];
    node.state = result.state;
    return node;
  }
}
