/**
 * Tiny deterministic PRNG (mulberry32) plus a few helpers. The whole swarm is
 * generated from these so it is reproducible and unit-testable: feed the same
 * seed, get the same shill. In the UI we seed from the clock for liveness; in
 * the tests we seed from a constant for determinism.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a uniformly random element. */
export const pick = <T>(rng: Rng, items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)];

/** Inclusive integer in [min, max]. */
export const int = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** True with probability p. */
export const chance = (rng: Rng, p: number): boolean => rng() < p;
