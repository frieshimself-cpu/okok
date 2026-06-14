/**
 * Transactions. The ledger uses an account model: every address has a balance
 * and a nonce. A transaction spends from `from`, pays `fee` to the miner and
 * must carry the sender's exact next nonce (which is what makes replaying a
 * captured transaction impossible).
 *
 * Coinbase transactions — the block reward — have `from: null`, no signature
 * and must appear exactly once, first in a block.
 */

import { hexToBytes, utf8 } from "./bytes";
import { sha256Hex } from "./sha256";
import { addressFromPublicKey } from "./wallet";

export interface Transaction {
  /** Sender address, or null for the coinbase (block reward) transaction. */
  from: string | null;
  to: string;
  amount: number;
  fee: number;
  nonce: number;
  timestamp: number;
  /** Hex-encoded SPKI public key of the sender ("" for coinbase). */
  publicKey: string;
  /** Hex-encoded ECDSA P-256 signature over the signing payload ("" for coinbase). */
  signature: string;
}

const subtle = globalThis.crypto.subtle;

/** Canonical byte-exact payload covered by the signature. */
export function txSigningPayload(tx: Transaction): string {
  return JSON.stringify({
    from: tx.from,
    to: tx.to,
    amount: tx.amount,
    fee: tx.fee,
    nonce: tx.nonce,
    timestamp: tx.timestamp,
    publicKey: tx.publicKey,
  });
}

export function txId(tx: Transaction): string {
  return sha256Hex(txSigningPayload(tx) + tx.signature);
}

export function isCoinbase(tx: Transaction): boolean {
  return tx.from === null;
}

export async function importPublicKey(publicKeyHex: string): Promise<CryptoKey> {
  return subtle.importKey(
    "spki",
    hexToBytes(publicKeyHex),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
}

/**
 * Structural + cryptographic verification of a non-coinbase transaction:
 * integer amounts, the public key must hash to the claimed sender address,
 * and the ECDSA signature must cover the canonical payload.
 */
export async function verifyTransaction(tx: Transaction): Promise<{ ok: boolean; error?: string }> {
  if (isCoinbase(tx)) return { ok: false, error: "coinbase transactions cannot be submitted directly" };
  if (!Number.isInteger(tx.amount) || tx.amount < 1) return { ok: false, error: "amount must be a positive integer" };
  if (!Number.isInteger(tx.fee) || tx.fee < 0) return { ok: false, error: "fee must be a non-negative integer" };
  if (!Number.isInteger(tx.nonce) || tx.nonce < 0) return { ok: false, error: "nonce must be a non-negative integer" };
  if (!tx.to || typeof tx.to !== "string") return { ok: false, error: "missing recipient" };
  if (!tx.publicKey || !tx.signature) return { ok: false, error: "missing signature material" };
  if (addressFromPublicKey(tx.publicKey) !== tx.from) {
    return { ok: false, error: "public key does not match sender address" };
  }

  let key: CryptoKey;
  try {
    key = await importPublicKey(tx.publicKey);
  } catch {
    return { ok: false, error: "malformed public key" };
  }

  const valid = await subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    hexToBytes(tx.signature),
    utf8(txSigningPayload(tx)),
  );
  if (!valid) return { ok: false, error: "invalid signature" };

  return { ok: true };
}
