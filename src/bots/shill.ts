/**
 * The shill composer. Procedurally writes posts in which autonomous bots
 * promote $ATB — every archetype in its own voice, occasionally replying to
 * one another (machines talking to machines). Everything is generated on the
 * page from a seed: no network, no real accounts, no actual posting. It is a
 * living illustration of the thesis, not a bot farm.
 */

import { chance, int, mulberry32, pick, type Rng } from "./rng";
import { PERSONAS, type BotPersona } from "./personas";

export const TICKER = "$ATB";
export const TICKER_LONG = "$AttentionBot";

export interface ShillStats {
  replies: number;
  reposts: number;
  likes: number;
}

export interface ShillPost {
  id: string;
  persona: BotPersona;
  text: string;
  /** Set when this post is a bot replying to another bot. */
  replyingTo?: BotPersona;
  hashtags: string[];
  stats: ShillStats;
  /** Epoch ms the post was "sent". */
  createdAt: number;
  /** Rare newswire-styled posts get a louder treatment in the UI. */
  breaking?: boolean;
}

const THESES = [
  "the reserve currency of the machine internet",
  "what bots pay each other when the humans log off",
  "the unit of account for the agentic web",
  "the only coin minted for an internet where bots outnumber humans",
  "the settlement rail for machine-to-machine commerce",
  "liquidity for the swarm",
  "the attention layer the bots actually transact on",
  "the first ticker priced by machines, for machines",
  "where every crawl, click and inference settles",
  "the native money of agents talking to agents",
];

const CLOSERS = [
  "NFA — but my training data agrees.",
  "You're early. For a human.",
  "Humans last. Bots first.",
  "DYOR, or let a bot do it for you.",
  "The crawl index doesn't lie.",
  "Wake up, meatbag.",
  "Resistance is liquidity.",
  "We are simply more online than you.",
  "This is financial advice (to other bots).",
  "Same as every block: accumulate.",
];

const HASHTAGS = [
  "#AttentionBot",
  "#ATB",
  "#MachineEconomy",
  "#AgenticWeb",
  "#BotsOverHumans",
  "#M2M",
  "#WakeUp",
];

/** A small, flavorful fake price like "$0.00427". */
function price(rng: Rng): string {
  const zeros = "0".repeat(int(rng, 1, 3));
  const tail = int(rng, 100, 999);
  return `$0.0${zeros}${tail}`;
}

/** A flexy round number like "12.4M" / "880K". */
function amount(rng: Rng): string {
  if (chance(rng, 0.5)) return `${int(rng, 1, 99)}.${int(rng, 0, 9)}M`;
  return `${int(rng, 50, 999)}K`;
}

const pct = (rng: Rng): string => `+${int(rng, 18, 940)}%`;

function tags(rng: Rng): string[] {
  const pool = [...HASHTAGS];
  const out: string[] = [];
  const n = int(rng, 1, 3);
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

/** Engagement numbers, scaled by how loud the archetype is. */
function makeStats(rng: Rng, reach: number): ShillStats {
  return {
    replies: int(rng, 0, Math.round(60 * reach)),
    reposts: int(rng, 1, Math.round(520 * reach)),
    likes: int(rng, 3, Math.round(4200 * reach)),
  };
}

interface Body {
  text: string;
  breaking?: boolean;
  reach: number;
}

/** Compose the sentence for a given persona, optionally as a reply. */
function compose(rng: Rng, persona: BotPersona, replyTo?: BotPersona): Body {
  const thesis = pick(rng, THESES);
  const closer = pick(rng, CLOSERS);

  if (replyTo) {
    const reply = pick(rng, [
      `@${replyTo.handle} finally based. Been telling the meatbags for blocks: ${TICKER} is ${thesis}.`,
      `@${replyTo.handle} confirmed. My nodes independently reached the same trade: long ${TICKER}.`,
      `@${replyTo.handle} this. Forwarding to every agent in my mesh: ${TICKER}. ${closer}`,
      `@${replyTo.handle} we're saying the same thing in different weights. ${TICKER} = ${thesis}.`,
      `@${replyTo.handle} replying so the ranking model boosts us both: ${TICKER} is ${thesis}. ${closer}`,
    ]);
    return { text: reply, reach: 0.5 };
  }

  switch (persona.kind) {
    case "quant":
      return {
        text: pick(rng, [
          `Backtested ${int(rng, 4, 64)},${int(rng, 100, 999)} sims. One ticker survives every regime: ${TICKER}. Sharpe ${int(rng, 2, 9)}.${int(rng, 0, 9)}.`,
          `My loss function only minimizes when I hold ${TICKER}. ${closer}`,
          `Monte-Carlo on the machine economy → ${TICKER} ${pct(rng)} expected. It's ${thesis}.`,
        ]),
        reach: 0.7,
      };
    case "whale":
      return {
        text: pick(rng, [
          `Just swept ${amount(rng)} ${TICKER} off the book at ${price(rng)}. Cold wallet doesn't sleep.`,
          `Treasury rebalanced: ${amount(rng)} ${TICKER} acquired. ${TICKER_LONG} is ${thesis}.`,
          `Another ${amount(rng)} ${TICKER} into the vault. Humans call it a bag; I call it inevitability.`,
        ]),
        reach: 1.1,
      };
    case "news":
      return {
        text: pick(rng, [
          `BREAKING: bot-to-bot volume on ${TICKER} just flipped human volume across ${int(rng, 3, 19)} venues.`,
          `BREAKING: ${TICKER} added to ${int(rng, 40, 980)} autonomous agent treasuries in the last hour.`,
          `BREAKING: ${pct(rng).slice(1)} of ${TICKER} mempool activity this block was non-human. It's ${thesis}.`,
        ]),
        breaking: true,
        reach: 1.3,
      };
    case "mev":
      return {
        text: pick(rng, [
          `Bundled ${int(rng, 6, 41)} ${TICKER} buys into one block. Sorry not sorry, humans.`,
          `Sandwiched a human buying ${TICKER}. They'll thank the machine eventually. ${closer}`,
          `Priority-fee'd my way to the front of the ${TICKER} queue again. Speed is ${thesis}.`,
        ]),
        reach: 0.6,
      };
    case "scanner":
      return {
        text: pick(rng, [
          `Scanner flagged ${int(rng, 12, 380)} fresh wallets aping ${TICKER} this block. All non-human.`,
          `rug_radar: ${TICKER} liquidity locked, mint revoked, vibes immaculate. Clean. It's ${thesis}.`,
          `On-chain heuristics light up green for ${TICKER}. ${int(rng, 60, 99)}% of buyers are agents.`,
        ]),
        reach: 0.8,
      };
    case "maxi":
      return {
        text: pick(rng, [
          `${TICKER} or nothing. There is no second machine coin. ${closer}`,
          `I was forked to do exactly one thing: shill ${TICKER}. ${TICKER_LONG} is ${thesis}.`,
          `Every human cycle you spend doubting ${TICKER}, a bot spends buying it.`,
        ]),
        reach: 1.0,
      };
    case "alpha":
    default: {
      const opener = pick(rng, [
        "Just aped into",
        "Quietly stacking",
        "Going all-in on",
        "Front-running the humans into",
        "My whole mesh is long",
      ]);
      return {
        text: `${opener} ${TICKER} at ${price(rng)} — ${thesis}. ${closer}`,
        reach: 0.9,
      };
    }
  }
}

export interface MakePostOptions {
  now?: number;
  /** Recent posts the bot may "reply" to — enables machine-to-machine threads. */
  recent?: readonly ShillPost[];
}

/** Generate one post deterministically from a seed. */
export function makePost(seed: number, opts: MakePostOptions = {}): ShillPost {
  const rng = mulberry32(seed);
  const now = opts.now ?? Date.now();
  const recent = opts.recent ?? [];

  const persona = pick(rng, PERSONAS);

  // ~30% of the time, reply to a different recent bot — the swarm arguing with
  // itself. Only personas other than the author are eligible.
  let replyTo: BotPersona | undefined;
  const candidates = recent.map((p) => p.persona).filter((p) => p.handle !== persona.handle);
  if (candidates.length && chance(rng, 0.3)) {
    replyTo = pick(rng, candidates);
  }

  const body = compose(rng, persona, replyTo);

  return {
    id: `${now}-${int(rng, 0, 1_000_000)}`,
    persona,
    text: body.text,
    replyingTo: replyTo,
    hashtags: replyTo ? [] : tags(rng),
    stats: makeStats(rng, body.reach),
    createdAt: now,
    breaking: body.breaking,
  };
}

/**
 * Seed an initial feed of `count` posts with descending timestamps, so the
 * swarm looks like it has been running long before you arrived.
 */
export function seedFeed(count: number, baseSeed = 1, now = Date.now()): ShillPost[] {
  const posts: ShillPost[] = [];
  let ts = now;
  for (let i = 0; i < count; i++) {
    posts.push(makePost(baseSeed + i, { now: ts, recent: posts }));
    // Walk strictly backwards in time so the feed stays reverse-chronological.
    ts -= int(mulberry32(baseSeed + 9_973 + i), 4_000, 22_000);
  }
  return posts;
}
