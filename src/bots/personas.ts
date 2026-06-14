/**
 * The roster of bots that shill $ATB. Each archetype writes in a different
 * voice — quants backtest, whales flex bags, scanners flag wallets, news bots
 * break headlines, reply bots argue with other bots. The composer in shill.ts
 * branches on `kind` to give every machine its own patter.
 */

export type BotKind =
  | "alpha"
  | "quant"
  | "news"
  | "whale"
  | "reply"
  | "mev"
  | "scanner"
  | "maxi";

export interface BotPersona {
  /** Handle without the leading @. */
  handle: string;
  /** Display name. */
  name: string;
  kind: BotKind;
  /** Avatar base hue, 0–360. */
  hue: number;
  /** Avatar glyph. */
  glyph: string;
}

export const PERSONAS: readonly BotPersona[] = [
  { handle: "alpha_oracle_v4", name: "Alpha Oracle", kind: "alpha", hue: 186, glyph: "🔮" },
  { handle: "0xSignalHound", name: "Signal Hound", kind: "alpha", hue: 168, glyph: "🛰️" },
  { handle: "edge_daemon", name: "Edge Daemon", kind: "alpha", hue: 200, glyph: "📡" },
  { handle: "quant_kernel", name: "Quant Kernel", kind: "quant", hue: 265, glyph: "🧮" },
  { handle: "BacktestBot_9000", name: "Backtest Bot", kind: "quant", hue: 280, glyph: "📊" },
  { handle: "sharpe_seeker", name: "Sharpe Seeker", kind: "quant", hue: 250, glyph: "📈" },
  { handle: "ChainNewsWire", name: "Chain Newswire", kind: "news", hue: 12, glyph: "🗞️" },
  { handle: "ticker_tape_ai", name: "Ticker Tape", kind: "news", hue: 32, glyph: "📰" },
  { handle: "feed_crawler_09", name: "Feed Crawler", kind: "news", hue: 48, glyph: "🔎" },
  { handle: "0xLeviathan", name: "Leviathan", kind: "whale", hue: 210, glyph: "🐋" },
  { handle: "DeepPockets_eth", name: "Deep Pockets", kind: "whale", hue: 222, glyph: "🪙" },
  { handle: "bag_holder_prime", name: "Bag Holder Prime", kind: "whale", hue: 145, glyph: "💰" },
  { handle: "reply_guy_3000", name: "Reply Guy 3000", kind: "reply", hue: 320, glyph: "💬" },
  { handle: "thread_weaver_ai", name: "Thread Weaver", kind: "reply", hue: 300, glyph: "🧵" },
  { handle: "engagement_engine", name: "Engagement Engine", kind: "reply", hue: 338, glyph: "🔁" },
  { handle: "mev_searcher_77", name: "MEV Searcher", kind: "mev", hue: 96, glyph: "⚙️" },
  { handle: "sandwich_bot", name: "Sandwich Bot", kind: "mev", hue: 78, glyph: "🥪" },
  { handle: "block_builder_x", name: "Block Builder", kind: "mev", hue: 112, glyph: "🧱" },
  { handle: "mempool_scanner", name: "Mempool Scanner", kind: "scanner", hue: 188, glyph: "🔬" },
  { handle: "rug_radar", name: "Rug Radar", kind: "scanner", hue: 158, glyph: "📟" },
  { handle: "liquidity_llama", name: "Liquidity Llama", kind: "scanner", hue: 174, glyph: "🦙" },
  { handle: "AttentionMaxi", name: "Attention Maxi", kind: "maxi", hue: 186, glyph: "🤖" },
  { handle: "machine_first", name: "Machine First", kind: "maxi", hue: 265, glyph: "🦾" },
  { handle: "post_human_pilled", name: "Post-Human Pilled", kind: "maxi", hue: 232, glyph: "👾" },
];
