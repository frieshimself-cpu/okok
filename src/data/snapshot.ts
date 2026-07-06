import type { Confidence, Side } from "@/lib/types";

/**
 * Baked-in Claude analysis so the board is fully populated with zero API key
 * and zero per-request cost — this is what Vercel serves out of the box.
 *
 * These are genuine Claude analyses of the top-volume Polymarket markets as of
 * the date below (not random numbers): structural reads on resolution wording,
 * deadline math and cross-market consistency. At request time the server
 * re-fetches each market's LIVE price and recomputes the edge, drops anything
 * that has closed or converged, and shows current volume — so the board keeps
 * moving with the market even in snapshot mode.
 *
 * When ANTHROPIC_API_KEY is set, the live engine replaces this entirely.
 */
export interface SnapshotAnalysis {
  id: string;
  question: string;
  url: string;
  endDate: string;
  /** Claude's estimated probability of YES at snapshot time. */
  modelProb: number;
  side: Exclude<Side, "PASS">;
  confidence: Confidence;
  rationale: string;
  riskNote: string;
  /** Fallback figures used only if the live re-price fetch fails. */
  marketProb: number;
  volume24h: number;
  liquidity: number;
}

export const SNAPSHOT: {
  generatedAt: string;
  model: string;
  marketsScanned: number;
  analyses: SnapshotAnalysis[];
} = {
  generatedAt: "2026-07-06T00:00:00Z",
  model: "claude",
  marketsScanned: 9,
  analyses: [
    {
      id: "1654959",
      question: "Will the Fed increase interest rates by 25 bps after the July 2026 meeting?",
      url: "https://polymarket.com/event/fed-decision-in-july-181",
      endDate: "2026-07-29T00:00:00Z",
      modelProb: 0.07,
      side: "NO",
      confidence: "MEDIUM",
      rationale:
        "The Fed hasn't hiked since 2023 and has never hiked without telegraphing it for months. Three weeks out, 15% on a tail move is the kind of insurance premium that historically decays into a hold — the modal outcome of any FOMC meeting by a wide margin.",
      riskNote:
        "If recent inflation prints ran hot (after the model's cutoff), a telegraphed hike could already be live.",
      marketProb: 0.151,
      volume24h: 400_028,
      liquidity: 341_528,
    },
    {
      id: "2744616",
      question: "Will Samuel Alito announce his retirement by July 15, 2026?",
      url: "https://polymarket.com/event/will-samuel-alito-announce-his-retirement-by",
      endDate: "2026-12-31T23:59:00Z",
      modelProb: 0.02,
      side: "NO",
      confidence: "HIGH",
      rationale:
        "The traditional window for justice retirement announcements — the end of the Supreme Court term in late June — just passed quietly. Nine remaining days is a narrow slot for an event class that almost never lands mid-July, whatever the long-running rumors say.",
      riskNote:
        "Retirement chatter around Alito has persisted for two years; a surprise announcement needs no schedule.",
      marketProb: 0.051,
      volume24h: 300_319,
      liquidity: 139_834,
    },
    {
      id: "2793738",
      question: "Will Argentina win on 2026-07-07?",
      url: "https://polymarket.com/event/fifwc-arg-egy-2026-07-07",
      endDate: "2026-07-07T16:00:00Z",
      modelProb: 0.67,
      side: "NO",
      confidence: "LOW",
      rationale:
        "Knockout favorites get overpriced in regulation: this market is 90 minutes only, and heavy favorites' win rate caps near two-thirds because underdogs park the bus and draw mass is fat. At 71% on Argentina, NO pays on any Egypt stalemate through full time.",
      riskNote:
        "Resolves within a day on team news the model can't see — a weakened Egypt side makes 71% fair.",
      marketProb: 0.715,
      volume24h: 283_410,
      liquidity: 1_297_995,
    },
  ],
};
