/**
 * Byte/hex/utf8 helpers shared by the whole chain.
 * Pure TypeScript so the chain runs identically in Node and the browser.
 */

const HEX = "0123456789abcdef";
const ENCODER = new TextEncoder();

export function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0x0f];
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("hex string must have even length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error(`invalid hex at offset ${i * 2}`);
    out[i] = byte;
  }
  return out;
}

export function utf8(text: string): Uint8Array {
  return ENCODER.encode(text);
}

export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/** Number of leading zero bits — this is how proof-of-work difficulty is measured. */
export function leadingZeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0) {
      bits += 8;
      continue;
    }
    let v = byte;
    while ((v & 0x80) === 0) {
      bits++;
      v = (v << 1) & 0xff;
    }
    break;
  }
  return bits;
}
