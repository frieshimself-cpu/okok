import type { MarketSnapshot } from "./types";

const GAMMA_MARKETS = "https://gamma-api.polymarket.com/markets";

/** Raw Gamma API market — only the fields we read. */
interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  description?: string;
  /** JSON-encoded array, e.g. '["Yes", "No"]'. */
  outcomes: string;
  /** JSON-encoded array of decimal strings, e.g. '["0.62", "0.38"]'. */
  outcomePrices: string;
  volume24hr?: number;
  liquidity?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  events?: { slug?: string; title?: string }[];
}

const MIN_LIQUIDITY = 10_000;
const MIN_VOLUME_24H = 5_000;
const MIN_HOURS_TO_RESOLUTION = 12;
/** Skip near-settled markets — no tradable edge at 1¢ or 99¢. */
const PRICE_FLOOR = 0.02;
const PRICE_CEIL = 0.98;
/** Don't let a single event (e.g. "World Cup Winner") fill the whole board. */
const MAX_PER_EVENT = 2;

/**
 * Top-volume, liquid, binary Yes/No markets from Polymarket's public Gamma
 * API, normalized for analysis. No auth required.
 */
export async function fetchTopMarkets(limit: number): Promise<MarketSnapshot[]> {
  const params = new URLSearchParams({
    closed: "false",
    active: "true",
    order: "volume24hr",
    ascending: "false",
    limit: "75",
  });
  const res = await fetch(`${GAMMA_MARKETS}?${params}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Polymarket Gamma API responded ${res.status}`);
  const raw = (await res.json()) as GammaMarket[];

  const now = Date.now();
  const perEvent = new Map<string, number>();
  const markets: MarketSnapshot[] = [];

  for (const m of raw) {
    let outcomes: unknown;
    let prices: number[];
    try {
      outcomes = JSON.parse(m.outcomes);
      prices = (JSON.parse(m.outcomePrices) as string[]).map(Number);
    } catch {
      continue;
    }
    if (!Array.isArray(outcomes) || outcomes.length !== 2 || outcomes[0] !== "Yes") continue;

    const yesPrice = prices[0];
    if (!Number.isFinite(yesPrice) || yesPrice < PRICE_FLOOR || yesPrice > PRICE_CEIL) continue;

    const end = m.endDate ? Date.parse(m.endDate) : NaN;
    if (!Number.isFinite(end) || end < now + MIN_HOURS_TO_RESOLUTION * 3_600_000) continue;

    const liquidity = Number(m.liquidity ?? 0);
    const volume24h = Number(m.volume24hr ?? 0);
    if (liquidity < MIN_LIQUIDITY || volume24h < MIN_VOLUME_24H) continue;

    const event = m.events?.[0];
    const eventKey = event?.slug ?? m.id;
    const seen = perEvent.get(eventKey) ?? 0;
    if (seen >= MAX_PER_EVENT) continue;
    perEvent.set(eventKey, seen + 1);

    markets.push({
      id: m.id,
      question: m.question,
      description: (m.description ?? "").replace(/\s+/g, " ").trim().slice(0, 500),
      url: event?.slug
        ? `https://polymarket.com/event/${event.slug}`
        : `https://polymarket.com/market/${m.slug}`,
      eventTitle: event?.title?.trim() || null,
      yesPrice,
      volume24h,
      liquidity,
      endDate: m.endDate as string,
    });
    if (markets.length >= limit) break;
  }

  if (markets.length === 0) throw new Error("No eligible markets returned by Polymarket");
  return markets;
}

export interface LiveQuote {
  id: string;
  yesPrice: number;
  volume24h: number;
  liquidity: number;
  closed: boolean;
}

/**
 * Current prices for specific markets (used to re-price the baked snapshot on
 * every load, so the board moves with the market even without an API key).
 */
export async function fetchQuotesByIds(ids: string[]): Promise<Map<string, LiveQuote>> {
  const params = new URLSearchParams();
  for (const id of ids) params.append("id", id);
  const res = await fetch(`${GAMMA_MARKETS}?${params}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Polymarket Gamma API responded ${res.status}`);
  const raw = (await res.json()) as GammaMarket[];

  const quotes = new Map<string, LiveQuote>();
  for (const m of raw) {
    let yesPrice: number;
    try {
      yesPrice = Number((JSON.parse(m.outcomePrices) as string[])[0]);
    } catch {
      continue;
    }
    if (!Number.isFinite(yesPrice)) continue;
    quotes.set(m.id, {
      id: m.id,
      yesPrice,
      volume24h: Number(m.volume24hr ?? 0),
      liquidity: Number(m.liquidity ?? 0),
      closed: m.closed || !m.active,
    });
  }
  return quotes;
}
