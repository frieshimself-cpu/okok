import { site } from "@/config/site";
import { SNAPSHOT } from "@/data/snapshot";
import { analyzeMarkets, DEFAULT_MODEL } from "./claude";
import { fetchQuotesByIds, fetchTopMarkets } from "./polymarket";
import type { Analysis, MarketSnapshot, Prediction, PredictionsPayload } from "./types";

const TTL_MS = site.refreshMinutes * 60_000;
const MAX_PICKS = 9;
/** Edges this small are noise/fees — count them as a pass. */
const MIN_EDGE = 0.015;
const CONFIDENCE_WEIGHT = { LOW: 0.5, MEDIUM: 0.75, HIGH: 1 } as const;

let cache: PredictionsPayload | null = null;
let inFlight: Promise<PredictionsPayload> | null = null;

/**
 * Lazily-refreshed predictions. Fallback chain:
 *   1. live Claude analysis (when ANTHROPIC_API_KEY is set)
 *   2. baked Claude snapshot, re-priced against live Polymarket quotes
 *   3. labelled heuristics (only if both of the above fail)
 * The Claude call happens at most once per TTL and only when someone loads
 * the site, so API spend scales with traffic — and on a key-less Vercel
 * deploy the snapshot path serves a full board at zero model cost.
 */
export async function getPredictions(): Promise<PredictionsPayload> {
  if (cache && Date.now() < Date.parse(cache.nextRefreshAt)) return cache;
  if (inFlight) return inFlight;

  inFlight = generate()
    .then((payload) => {
      cache = payload;
      return payload;
    })
    .catch((err) => {
      if (cache) return cache; // serve stale rather than erroring
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

async function generate(): Promise<PredictionsPayload> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateLive();
    } catch {
      // fall through to the snapshot
    }
  }
  try {
    const fromSnapshot = await generateFromSnapshot();
    if (fromSnapshot.picks.length > 0) return fromSnapshot;
  } catch {
    // fall through to heuristics
  }
  return generateHeuristic();
}

/* ── 1. Live Claude engine ───────────────────────────────────────────────── */

async function generateLive(): Promise<PredictionsPayload> {
  const markets = await fetchTopMarkets(site.marketsPerScan);
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  const analyses = await analyzeMarkets(markets, model);
  return assemble(markets, analyses, { engine: "claude", model });
}

/* ── 2. Baked snapshot, re-priced live ───────────────────────────────────── */

async function generateFromSnapshot(): Promise<PredictionsPayload> {
  let quotes: Awaited<ReturnType<typeof fetchQuotesByIds>> | null = null;
  try {
    quotes = await fetchQuotesByIds(SNAPSHOT.analyses.map((a) => a.id));
  } catch {
    quotes = null; // offline — fall back to the baked figures
  }

  const picks: Prediction[] = [];
  for (const a of SNAPSHOT.analyses) {
    const quote = quotes?.get(a.id);
    if (quotes && (!quote || quote.closed)) continue; // market resolved or gone
    const marketProb = quote ? quote.yesPrice : a.marketProb;
    const edge = a.side === "YES" ? a.modelProb - marketProb : marketProb - a.modelProb;
    if (edge < MIN_EDGE) continue; // price converged to the model — no edge left
    picks.push({
      id: a.id,
      question: a.question,
      url: a.url,
      endDate: a.endDate,
      volume24h: quote?.volume24h || a.volume24h,
      liquidity: quote?.liquidity || a.liquidity,
      marketProb,
      modelProb: a.modelProb,
      side: a.side,
      edge,
      confidence: a.confidence,
      rationale: a.rationale,
      riskNote: a.riskNote,
    });
  }

  sortPicks(picks);
  const now = Date.now();
  return {
    engine: "claude",
    model: SNAPSHOT.model,
    generatedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + TTL_MS).toISOString(),
    marketsScanned: SNAPSHOT.marketsScanned,
    passed: SNAPSHOT.marketsScanned - picks.length,
    picks: picks.slice(0, MAX_PICKS),
  };
}

/* ── 3. Last-ditch heuristics ────────────────────────────────────────────── */

async function generateHeuristic(): Promise<PredictionsPayload> {
  const markets = await fetchTopMarkets(site.marketsPerScan);
  return assemble(markets, heuristicAnalyses(markets), {
    engine: "demo",
    model: null,
    note: "Fallback mode: these are heuristic picks, not Claude. Set ANTHROPIC_API_KEY for the live engine.",
  });
}

/* ── Shared assembly ─────────────────────────────────────────────────────── */

function assemble(
  markets: MarketSnapshot[],
  analyses: Analysis[],
  meta: { engine: PredictionsPayload["engine"]; model: string | null; note?: string },
): PredictionsPayload {
  const byId = new Map(markets.map((m) => [m.id, m]));
  const picks: Prediction[] = [];
  let passed = 0;

  for (const a of analyses) {
    const market = byId.get(a.id);
    if (!market) continue;
    const modelProb = clamp01(a.probabilityYes);
    const edge =
      a.side === "YES" ? modelProb - market.yesPrice : market.yesPrice - modelProb;
    if (a.side === "PASS" || edge < MIN_EDGE) {
      passed++;
      continue;
    }
    picks.push({
      id: market.id,
      question: market.question,
      url: market.url,
      endDate: market.endDate,
      volume24h: market.volume24h,
      liquidity: market.liquidity,
      marketProb: market.yesPrice,
      modelProb,
      side: a.side,
      edge,
      confidence: a.confidence,
      rationale: a.rationale,
      riskNote: a.riskNote,
    });
  }

  sortPicks(picks);
  const now = Date.now();
  return {
    engine: meta.engine,
    model: meta.model,
    generatedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + TTL_MS).toISOString(),
    marketsScanned: markets.length,
    passed,
    picks: picks.slice(0, MAX_PICKS),
    note: meta.note,
  };
}

function sortPicks(picks: Prediction[]): void {
  picks.sort(
    (a, b) =>
      b.edge * CONFIDENCE_WEIGHT[b.confidence] - a.edge * CONFIDENCE_WEIGHT[a.confidence],
  );
}

/**
 * Honest last-ditch fallback: simple structural heuristics, labelled as such
 * in every rationale and via `engine: "demo"`.
 */
function heuristicAnalyses(markets: MarketSnapshot[]): Analysis[] {
  return markets.map((m) => {
    const p = m.yesPrice;
    const daysLeft = (Date.parse(m.endDate) - Date.now()) / 86_400_000;

    if (p >= 0.03 && p <= 0.15 && daysLeft <= 45) {
      return {
        id: m.id,
        probabilityYes: Math.max(0.005, p - 0.05),
        side: "NO" as const,
        confidence: "MEDIUM" as const,
        rationale:
          "Heuristic (not Claude): longshot bias — low-probability outcomes near a deadline tend to trade above their true odds, making NO the value side.",
        riskNote: "Heuristic only — a single headline can flip a longshot.",
      };
    }

    if (p >= 0.85 && p <= 0.96 && daysLeft <= 30) {
      return {
        id: m.id,
        probabilityYes: Math.min(0.995, p + 0.04),
        side: "YES" as const,
        confidence: "LOW" as const,
        rationale:
          "Heuristic (not Claude): heavy favorites near resolution are often slightly underpriced while longshot buyers chase the other side.",
        riskNote: "Thin edge — fees and slippage can eat it entirely.",
      };
    }

    return {
      id: m.id,
      probabilityYes: p,
      side: "PASS" as const,
      confidence: "LOW" as const,
      rationale: "Heuristic (not Claude): market looks efficient, no edge claimed.",
      riskNote: "",
    };
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
