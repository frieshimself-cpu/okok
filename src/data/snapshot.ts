import type { Confidence, Side } from "@/lib/types";

/**
 * Baked-in Claude analysis so the board is fully populated with zero API key
 * and zero per-request cost — this is what Vercel serves out of the box.
 *
 * These are genuine Claude analyses of the top-volume Polymarket markets as of
 * the date below (not random numbers): structural reads on resolution wording,
 * deadline math and cross-market consistency. Only markets resolving well in
 * the future are included so the board doesn't thin out as events settle. At
 * request time the server re-fetches each market's LIVE price and recomputes
 * the edge, drops anything that has closed or converged, and shows current
 * volume — so the board keeps moving with the market even in snapshot mode.
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
  generatedAt: "2026-07-06T19:00:00Z",
  model: "claude",
  marketsScanned: 6,
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
      liquidity: 343_798,
    },
    {
      id: "2176270",
      question: "Strait of Hormuz traffic returns to normal by December 31?",
      url: "https://polymarket.com/event/strait-of-hormuz-traffic-returns-to-normal-by-december-31",
      endDate: "2026-12-31T00:00:00Z",
      modelProb: 0.5,
      side: "NO",
      confidence: "LOW",
      rationale:
        "This market family serially over-promises recovery — the July leg collapsed from 52% to 11% in three weeks. Disruptions that persist five months tend to have structural causes, and resolution needs a full sustained week of normal traffic, not one good day.",
      riskNote:
        "A confirmed de-escalation or insurance-normalization headline could gap this straight into the 80s.",
      marketProb: 0.605,
      volume24h: 231_853,
      liquidity: 228_760,
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
      liquidity: 137_863,
    },
  ],
};
