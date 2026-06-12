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

export const SNAPSHOT = {
  generatedAt: "2026-06-12T18:30:00Z",
  model: "claude",
  marketsScanned: 12,
  analyses: [
    {
      id: "2270330",
      question: "US x Iran permanent peace deal by June 15, 2026?",
      url: "https://polymarket.com/event/us-x-iran-permanent-peace-deal-by",
      endDate: "2026-06-15T00:00:00Z",
      modelProb: 0.06,
      side: "NO",
      confidence: "HIGH",
      rationale:
        "Three days to produce a deal with explicit permanent-end-to-hostilities language. Diplomacy looks live, but this same market prices a mere ceasefire extension at ~74% by month-end — a permanent treaty inside 72 hours is a far higher bar than 18% implies.",
      riskNote:
        "The model can't see this week's news — a finished deal text awaiting signature would flip this instantly.",
      marketProb: 0.177,
      volume24h: 5_807_049,
      liquidity: 473_930,
    },
    {
      id: "2270338",
      question: "US x Iran permanent peace deal by July 31, 2026?",
      url: "https://polymarket.com/event/us-x-iran-permanent-peace-deal-by",
      endDate: "2026-07-31T00:00:00Z",
      modelProb: 0.4,
      side: "NO",
      confidence: "MEDIUM",
      rationale:
        "55% for explicit 'permanent peace deal' wording inside seven weeks is rich. Ceasefire extensions and frameworks come first — the market itself gives those only ~74% by June 30 — and diplomatic language upgrades from 'ceasefire' to 'permanent' historically take months.",
      riskNote:
        "A scheduled signing ceremony or leaked treaty text since the model's cutoff kills this thesis.",
      marketProb: 0.545,
      volume24h: 750_605,
      liquidity: 182_232,
    },
    {
      id: "2002564",
      question: "Israel x Iran permanent peace deal by June 30, 2026?",
      url: "https://polymarket.com/event/israel-x-iran-permanent-peace-deal-by",
      endDate: "2026-06-30T00:00:00Z",
      modelProb: 0.04,
      side: "NO",
      confidence: "HIGH",
      rationale:
        "Israel and Iran have no diplomatic relations; an agreement with explicit permanent-peace language inside 18 days would be historically unprecedented even mid-thaw. The 12% price is mostly longshot bias and event-risk premium, not a real path to Yes.",
      riskNote:
        "A US-brokered regional grand bargain could bundle exactly this language with little warning.",
      marketProb: 0.118,
      volume24h: 1_074_326,
      liquidity: 146_491,
    },
    {
      id: "2354003",
      question: "US announces new Iran agreement/ceasefire extension by June 30?",
      url: "https://polymarket.com/event/us-announces-new-iran-agreementceasefire-extension-by",
      endDate: "2026-06-30T00:00:00Z",
      modelProb: 0.82,
      side: "YES",
      confidence: "MEDIUM",
      rationale:
        "Consistency trade: the narrow US-Iran nuclear-deal market alone trades at ~51%, yet this one — which also resolves Yes on a plain ceasefire extension or any framework that keeps the ceasefire — sits only ~23 points higher. The union of paths is worth more than 74%.",
      riskNote:
        "Paths are correlated — one collapse in talks sinks extension, framework and deal together.",
      marketProb: 0.745,
      volume24h: 597_844,
      liquidity: 60_825,
    },
  ] satisfies SnapshotAnalysis[],
};
