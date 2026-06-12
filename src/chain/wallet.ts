/**
 * Wallets are ECDSA P-256 key pairs (WebCrypto, available in both Node ≥ 18
 * and every modern browser). An address is the SHA-256 of the SPKI-encoded
 * public key, truncated to 20 bytes and prefixed with "leaf".
 */

import { bytesToHex, hexToBytes, utf8 } from "./bytes";
import { sha256Bytes } from "./sha256";
import { txSigningPayload, type Transaction } from "./transaction";

const subtle = globalThis.crypto.subtle;

export const ADDRESS_PREFIX = "leaf";

export function addressFromPublicKey(publicKeyHex: string): string {
  return ADDRESS_PREFIX + bytesToHex(sha256Bytes(hexToBytes(publicKeyHex))).slice(0, 40);
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 8)}…${address.slice(-4)}`;
}

export class Wallet {
  private constructor(
    private readonly privateKey: CryptoKey,
    readonly publicKeyHex: string,
    readonly address: string,
  ) {}

  static async create(): Promise<Wallet> {
    const pair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ]);
    const spki = new Uint8Array(await subtle.exportKey("spki", pair.publicKey));
    const publicKeyHex = bytesToHex(spki);
    return new Wallet(pair.privateKey, publicKeyHex, addressFromPublicKey(publicKeyHex));
  }

  /** Build and sign a transfer. The caller supplies the account's next nonce. */
  async createTransaction(to: string, amount: number, fee: number, nonce: number): Promise<Transaction> {
    const tx: Transaction = {
      from: this.address,
      to,
      amount,
      fee,
      nonce,
      timestamp: Date.now(),
      publicKey: this.publicKeyHex,
      signature: "",
    };
    const signature = await subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      this.privateKey,
      utf8(txSigningPayload(tx)),
    );
    tx.signature = bytesToHex(new Uint8Array(signature));
    return tx;
  }
}
