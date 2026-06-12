/**
 * Blocks and proof-of-work mining.
 *
 * A block's hash is the SHA-256 of its canonical header JSON. Mining grinds
 * the nonce until the hash has at least `difficulty` leading zero bits. The
 * header commits to the Merkle root of the transactions, so the proof-of-work
 * seals the entire transaction set.
 */

import { bytesToHex, leadingZeroBits } from "./bytes";
import { sha256Bytes } from "./sha256";
import type { Transaction } from "./transaction";

export interface BlockHeader {
  index: number;
  prevHash: string;
  merkleRoot: string;
  timestamp: number;
  difficulty: number;
  nonce: number;
}

export interface Block extends BlockHeader {
  transactions: Transaction[];
  hash: string;
}

/** Canonical header serialization — key order matters and is locked here. */
export function headerPayload(h: BlockHeader): string {
  return JSON.stringify({
    index: h.index,
    prevHash: h.prevHash,
    merkleRoot: h.merkleRoot,
    timestamp: h.timestamp,
    difficulty: h.difficulty,
    nonce: h.nonce,
  });
}

export function computeBlockHash(header: BlockHeader): string {
  return bytesToHex(sha256Bytes(headerPayload(header)));
}

export function meetsDifficulty(hashBytes: Uint8Array, difficulty: number): boolean {
  return leadingZeroBits(hashBytes) >= difficulty;
}

export interface MineOptions {
  /**
   * Yield to the event loop every N hashes — keeps browser mining from
   * blocking the UI thread. Omit for a tight synchronous grind (CLI/tests).
   */
  yieldEvery?: number;
  /** Called every `yieldEvery` hashes with the running attempt count. */
  onProgress?: (attempts: number, elapsedMs: number) => void;
}

export interface MinedHeader {
  header: BlockHeader;
  hash: string;
  attempts: number;
  durationMs: number;
}

const now = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export async function mineHeader(template: BlockHeader, opts: MineOptions = {}): Promise<MinedHeader> {
  const started = now();
  // The nonce is the last field of the canonical JSON, so we can grind by
  // string concatenation instead of re-serializing the whole header per hash.
  // Must stay byte-identical to headerPayload() — covered by tests.
  const prefix =
    `{"index":${template.index},"prevHash":"${template.prevHash}",` +
    `"merkleRoot":"${template.merkleRoot}","timestamp":${template.timestamp},` +
    `"difficulty":${template.difficulty},"nonce":`;

  let nonce = template.nonce >>> 0;
  let attempts = 0;
  for (;;) {
    const hashBytes = sha256Bytes(prefix + nonce + "}");
    attempts++;
    if (meetsDifficulty(hashBytes, template.difficulty)) {
      return {
        header: { ...template, nonce },
        hash: bytesToHex(hashBytes),
        attempts,
        durationMs: now() - started,
      };
    }
    nonce++;
    if (opts.yieldEvery && attempts % opts.yieldEvery === 0) {
      opts.onProgress?.(attempts, now() - started);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
