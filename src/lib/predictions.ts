import { site } from "@/config/site";
import { analyzeMarkets, DEFAULT_MODEL } from "./claude";
import { fetchTopMarkets } from "./polymarket";
import type { Analysis, MarketSnapshot, Prediction, PredictionsPayload } from "./types";

const TTL_MS = site.refreshMinutes * 60_000;
const MAX_PICKS = 9;
/** Edges this small are noise/fees — count them as a pass. */
const MIN_EDGE = 0.015;
const CONFIDENCE_WEIGHT = { LOW: 0.5, MEDIUM: 0.75, HIGH: 1 } as const;

let cache: PredictionsPayload | null = null;
let inFlight: Promise<PredictionsPayload> | null = null;

/**
 * Lazily-refreshed predictions: the Claude call happens at most once per TTL,
 * and only when someone actually loads the site — API spend scales with
 * traffic, never with wall-clock time.
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
  const markets = await fetchTopMarkets(site.marketsPerScan);
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;

  let engine: PredictionsPayload["engine"] = "demo";
  let analyses: Analysis[];
  let note: string | undefined;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      analyses = await analyzeMarkets(markets, model);
      engine = "claude";
    } catch (err) {
      analyses = demoAnalyses(markets);
      note = `Claude call failed (${err instanceof Error ? err.message : "unknown error"}) — showing labelled heuristic picks instead.`;
    }
  } else {
    analyses = demoAnalyses(markets);
    note =
      "Demo mode: these are heuristic picks, not Claude. Set ANTHROPIC_API_KEY to turn on the live engine.";
  }

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

  picks.sort(
    (a, b) =>
      b.edge * CONFIDENCE_WEIGHT[b.confidence] - a.edge * CONFIDENCE_WEIGHT[a.confidence],
  );

  const now = Date.now();
  return {
    engine,
    model: engine === "claude" ? model : null,
    generatedAt: new Date(now).toISOString(),
    nextRefreshAt: new Date(now + TTL_MS).toISOString(),
    marketsScanned: markets.length,
    passed,
    picks: picks.slice(0, MAX_PICKS),
    note,
  };
}

/**
 * Honest fallback when no API key is configured: simple structural heuristics,
 * clearly labelled as demo output in every rationale and in the payload.
 */
function demoAnalyses(markets: MarketSnapshot[]): Analysis[] {
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
          "Demo heuristic (not Claude): longshot bias — low-probability outcomes near a deadline tend to trade above their true odds, making NO the value side.",
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
          "Demo heuristic (not Claude): heavy favorites near resolution are often slightly underpriced while longshot buyers chase the other side.",
        riskNote: "Thin edge — fees and slippage can eat it entirely.",
      };
    }

    return {
      id: m.id,
      probabilityYes: p,
      side: "PASS" as const,
      confidence: "LOW" as const,
      rationale: "Demo heuristic (not Claude): market looks efficient, no edge claimed.",
      riskNote: "",
    };
  });
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}
