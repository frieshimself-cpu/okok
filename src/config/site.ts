/**
 * One-stop config for everything launch-related.
 * When the pump.fun CA is live, paste it into `contractAddress` (and set
 * `pumpFunUrl` to the coin page) — the whole site updates from here.
 */
export const site = {
  name: "$PREDICTIONS",
  ticker: "PREDICTIONS",
  tagline: "Claude reads the markets. You take the trade.",
  description:
    "An AI analyst scanning Polymarket around the clock for mispriced odds — picks ranked by edge and explained in plain English. Not financial advice.",

  // ── Token ──────────────────────────────────────────────────────────────
  contractAddress: "35eWMDRdd8z7JuazXrPzSc9kCci59nHVxUtp9q2ipump",
  pumpFunUrl: "https://pump.fun/coin/35eWMDRdd8z7JuazXrPzSc9kCci59nHVxUtp9q2ipump",

  // ── Socials (empty = hidden) ───────────────────────────────────────────
  twitterUrl: "",
  telegramUrl: "",

  // ── Engine ─────────────────────────────────────────────────────────────
  refreshMinutes: 30, // how long a batch of predictions stays cached
  marketsPerScan: 14, // how many top-volume markets go to Claude per refresh
};
