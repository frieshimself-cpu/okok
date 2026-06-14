# $AttentionBot 🤖 — `$ATB`

**The coin for an internet run by bots.**

For the first time in history there are more bots than humans browsing the web.
A growing share of digital payments, trades and transactions is moving to
machines — and a growing share of the internet is no longer humans talking to
humans, but machines interacting. When the buyers, sellers and middlemen are all
software, they need a native unit of account. That's `$ATB`.

This repo is the `$AttentionBot` site. It has two real pieces of tech, both
running entirely in your browser, no backend:

1. **The Swarm** — a live feed of autonomous bots shilling the ticker. The posts
   are generated on the page from a seeded engine: 24 bot personas (quants,
   whales, MEV searchers, news bots, reply guys…), each in its own voice, even
   replying to one another. It's a working illustration of the thesis — what
   marketing looks like when the audience is machines. _No real accounts are
   touched and nothing is posted anywhere; it's an art piece, not a bot farm._
2. **The Ledger** — a complete proof-of-work settlement chain (agent wallets,
   signed transactions, mining, validation, fork choice) in dependency-free
   TypeScript. The console's chat is wired to a real node booted on page load —
   **every message you send seals an actual block** — and the whole ledger
   persists to `localStorage`, revalidated from genesis on every visit.

## Quickstart

```bash
npm install
npm run dev      # the site on http://localhost:5173
npm test         # 26-test suite: consensus + the shill engine (vitest)
npm run demo     # CLI: seal blocks, transfer, audit, tamper, fork-choice
npm run build    # type-check + production build
```

## The Swarm engine (`src/bots/`)

| Module        | What it does                                                                       |
| ------------- | ---------------------------------------------------------------------------------- |
| `rng.ts`      | Tiny deterministic PRNG (mulberry32) + helpers — so the swarm is reproducible and unit-testable |
| `personas.ts` | The bot roster: 8 archetypes × handles, glyphs and avatar hues                     |
| `shill.ts`    | The composer — branches on persona to write shills for `$ATB`, with fake prices, hashtags, engagement counts, and ~30% bot-to-bot replies |

`makePost(seed)` is pure and deterministic; the UI seeds it from the clock for
liveness and streams a new post every few seconds. The test suite asserts every
generated post shills the ticker, stats are sane, and replies always reference a
real other bot (never themselves).

## The Ledger (`src/chain/`)

| Module           | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `sha256.ts`      | Pure-TS SHA-256 (FIPS 180-4), synchronous so the mining loop can grind nonces; verified against NIST vectors |
| `bytes.ts`       | Hex/UTF-8 helpers and `leadingZeroBits` (the difficulty metric)               |
| `merkle.ts`      | Merkle root over transaction ids — commits a block to its exact tx set        |
| `wallet.ts`      | ECDSA P-256 keypairs via WebCrypto; address = hash of the public key          |
| `transaction.ts` | Account-model transfers: amount, fee, **nonce** (replay protection), signature over a canonical payload |
| `block.ts`       | Canonical headers, block hashing, and the proof-of-work miner (yields to the event loop so browser mining never janks) |
| `blockchain.ts`  | The node: fee-priority mempool, full block validation, ledger state, difficulty retargeting, halvings, heaviest-chain fork choice |

### Consensus rules (enforced on every block, local or received)

- `prevHash` links to the parent; `hash` equals SHA-256 of the canonical header
- the hash meets the difficulty demanded by the retarget schedule (±1 bit, clamped)
- the Merkle root commits to exactly the included transactions
- exactly one coinbase, first in the block, paying **reward + fees** — reward
  halves every `halvingInterval` blocks, so an agent cannot print `$ATB`
- every transfer needs a valid ECDSA signature from a key that hashes to the
  sender's address, the sender's exact next nonce, and full funding
- fork choice: a competing chain wins only if fully valid **and** carrying more
  cumulative proof-of-work

Run `npm run demo` to watch all of it happen in a terminal.

## The website

React + Vite + TypeScript + Tailwind + framer-motion + lucide-react. A dark,
cinematic single page in **Instrument Serif** on a deep blue-black palette
(`hsl(228 44% 4%)`) with electric-cyan (`hsl(186 90% 52%)`) and machine-violet
(`hsl(265 85% 68%)`) accents, and **JetBrains Mono** for handles, tickers and
hashes:

- **Hero** — the claim ("more bots than humans"), the `$ATB` pill, and a marquee
  of the crawlers (GPTBot, ClaudeBot, PerplexityBot…) that actually read the
  modern web. Pure-CSS aurora + machine grid, zero external assets.
- **The Swarm** — the live shill feed: streaming bot posts, generated avatars,
  bot-to-bot replies, ticking engagement, a pause control, and a "Make a bot
  shill `$ATB`" button.
- **The Thesis** — the narrative, plus live stats from the ledger below.
- **The Protocol** — the four consensus rules, framed as machine settlement.
- **The Ledger** — a live block explorer, agent wallet, and buttons to seal a
  block, settle `$ATB`, audit from genesis, and reset.
- **Tokenomics** — the emission curve and parameters, computed from the very
  config the page runs.
- **Console** — chat that seals a real block on every message.

A single `ChainProvider` hosts and persists the node, so the hero, console,
explorer and stat tiles all reflect the same ledger across visits.

## The coin

When the tradable `$AttentionBot` memecoin launches on Solana via pump.fun, drop
its mint into `MEMECOIN_CA` in `src/components/TokenCA.tsx` — the copy button,
pump.fun link and truncated display light up automatically. Until then the site
shows a clearly-labelled pre-launch state instead of a placeholder address
(a fake CA is how people get drained).

## Deploy

The site is fully static — any static host works; assets use a relative base
(`base: "./"`), so the same `dist/` runs on Vercel, Pages, Netlify, Cloudflare,
or off a USB stick.

### Vercel (one click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrieshimself-cpu%2Fokok)

Or import the repo at [vercel.com/new](https://vercel.com/new) and click Deploy —
there's nothing to configure. `vercel.json` already sets:

- the **Vite** preset (build `npm run build`, output `dist`, `cleanUrls`),
- **immutable caching** for content-hashed `/assets/*`,
- security headers on every response — **CSP**, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and **HSTS**.

Node is pinned to **22.x** (`.nvmrc` + `engines`), matching CI. From a terminal:
`npm i -g vercel && vercel --prod`. It's a single page (hash anchors, no
client-side routing), so no SPA rewrites are needed.

### Continuous integration

Every push and PR runs `.github/workflows/ci.yml` (install, `npm test`,
`npm run build`) and uploads `dist/` as an artifact — a fast, host-agnostic
green check. Deployment itself is Vercel's job via its Git integration, so once
the project is imported on Vercel, **every push auto-deploys** with no extra
workflow.

> Prefer GitHub Pages instead? It just needs a one-time toggle (repo Settings →
> Pages → Source: "GitHub Actions") plus a Pages deploy workflow — ask and it's
> a two-minute add-back.

### For the bots

`public/robots.txt` ships at the site root and explicitly welcomes the crawlers
(GPTBot, ClaudeBot, PerplexityBot…) — fitting, since they're the real audience.

## Honest limitations & disclaimer

The Ledger is a real blockchain, but an educational one: no P2P networking
layer, P-256 instead of secp256k1, an account model instead of UTXOs. Don't
secure anything of value with it. `$AttentionBot` is a community memecoin and an
art project about the machine internet — nothing here is financial advice or a
promise of value. Do your own research.
