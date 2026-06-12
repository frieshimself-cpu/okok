/**
 * Merkle tree over transaction ids. The root commits a block to its exact
 * transaction set: change any transaction and the root (and therefore the
 * block hash and its proof-of-work) no longer matches.
 */

import { concatBytes, hexToBytes } from "./bytes";
import { sha256Hex } from "./sha256";

const EMPTY_ROOT = sha256Hex("verdant:empty-merkle-root");

export function merkleRoot(txIds: string[]): string {
  if (txIds.length === 0) return EMPTY_ROOT;

  let level = [...txIds];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : level[i];
      next.push(sha256Hex(concatBytes(hexToBytes(left), hexToBytes(right))));
    }
    level = next;
  }
  return level[0];
}
