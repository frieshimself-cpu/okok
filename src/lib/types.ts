export type Side = "YES" | "NO" | "PASS";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

/** A normalized binary Polymarket market, ready for analysis. */
export interface MarketSnapshot {
  id: string;
  question: string;
  /** Resolution criteria, truncated — wording drives the analysis. */
  description: string;
  url: string;
  eventTitle: string | null;
  /** Market-implied probability of YES, 0..1. */
  yesPrice: number;
  volume24h: number;
  liquidity: number;
  endDate: string;
}

/** One model analysis of one market (the shape Claude returns). */
export interface Analysis {
  id: string;
  probabilityYes: number;
  side: Side;
  confidence: Confidence;
  rationale: string;
  riskNote: string;
}

/** A surfaced pick: an analysis with a non-PASS side and positive edge. */
export interface Prediction {
  id: string;
  question: string;
  url: string;
  endDate: string;
  volume24h: number;
  liquidity: number;
  /** Market-implied probability of YES, 0..1. */
  marketProb: number;
  /** Model's estimated probability of YES, 0..1. */
  modelProb: number;
  side: Exclude<Side, "PASS">;
  /** Edge on the recommended side, 0..1 (0.07 = +7 pts). */
  edge: number;
  confidence: Confidence;
  rationale: string;
  riskNote: string;
}

export interface PredictionsPayload {
  engine: "claude" | "demo";
  model: string | null;
  generatedAt: string;
  nextRefreshAt: string;
  marketsScanned: number;
  /** Markets analyzed but not surfaced (no claimed edge). */
  passed: number;
  picks: Prediction[];
  note?: string;
}
