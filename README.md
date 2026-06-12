# $PREDICTIONS 🟢

**Claude reads the markets. You take the trade.**

A single-page site where Claude analyzes Polymarket's highest-volume markets and
surfaces the ones it thinks are mispriced — ranked by edge, each with a
plain-English rationale and a risk note. Built for the $PREDICTIONS token launch
on pump.fun.

## How it works

1. **Scan** — the server pulls top-volume binary markets from Polymarket's public
   [Gamma API](https://gamma-api.polymarket.com) and filters for liquidity, sane
   prices and real time-to-resolution (max 2 markets per event so one topic can't
   flood the board).
2. **Analyze** — one batched Claude API call (`claude-opus-4-8`, adaptive
   thinking, structured JSON output) estimates each market's true probability
   from its exact resolution criteria, and PASSes when breaking news it can't
   see should decide the market.
3. **Rank** — edge = model probability − market probability. Picks are sorted by
   edge × confidence and served from `/api/predictions`.

Results are cached for 30 minutes and regenerated lazily on the next visit, so
API spend scales with traffic (at most ~48 Claude calls/day, only if the site is
visited around the clock).

## Quickstart

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

No `ANTHROPIC_API_KEY`? The board still ships full: it serves a **baked
snapshot of genuine Claude analyses** (`src/data/snapshot.ts`), re-priced
against live Polymarket quotes on every load — prices, edges and volumes keep
moving, resolved markets drop off automatically, and it costs zero API spend.
Add the key whenever you want fresh analyses; the live engine takes over
automatically.

## Configuration

| What | Where |
| --- | --- |
| Contract address (CA), pump.fun link, socials | `src/config/site.ts` |
| Cache TTL, markets per scan | `src/config/site.ts` |
| API key, model override | `.env.local` / Vercel env vars (`ANTHROPIC_API_KEY`, optional `CLAUDE_MODEL`) |

When the pump.fun CA is live, paste it into `contractAddress` in
`src/config/site.ts` — the hero pill, token card and copy button all update from
that single field.

## Deploy (Vercel)

1. Push this repo and import it at [vercel.com/new](https://vercel.com/new) —
   Next.js is auto-detected.
2. Add the `ANTHROPIC_API_KEY` environment variable.
3. Ship. The `/api/predictions` route sets `maxDuration = 60` for the Claude
   call on cache-miss requests.

**Cost note:** each refresh is one batched Opus call (~10–15K tokens total,
≈ $0.10–0.20). With the 30-minute lazy cache that's at most ~$5–10/day under
constant traffic — set `CLAUDE_MODEL=claude-haiku-4-5` if you'd rather trade
pick quality for ~5× lower spend.

## Honesty notes

- The no-key snapshot contains real Claude analyses (structural reads on
  resolution wording, deadline math, cross-market consistency) — not invented
  numbers — and the prices shown next to them are always live.
- If both the live engine and the snapshot fail, heuristic picks are labelled
  as heuristics in the payload (`engine: "demo"`), in a banner, and inside
  every rationale — they are never presented as Claude.
- The model is prompted to stay humble about its training cutoff and to PASS on
  news-driven markets; every pick carries a risk note.
- The site states throughout that nothing here is financial advice and that the
  project is not affiliated with Anthropic or Polymarket.

## Disclaimer

AI-generated probability estimates for information and entertainment only — not
financial advice. Prediction markets and memecoins (including $PREDICTIONS) are
extremely high-risk and can go to zero. Not affiliated with Anthropic or
Polymarket.
