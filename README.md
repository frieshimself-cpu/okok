# Verdant 🌱

**An entire blockchain, alive in your browser** — a complete proof-of-work chain
(wallets, signed transactions, mining, validation, fork choice) written in
dependency-free TypeScript, plus the cinematic landing page that runs it live.

There is no backend. The same consensus code runs in Node for the CLI demo and
tests, and inside the landing page itself: the dashboard's chat console is wired
to a real node booted on page load — **every message you send mines an actual
block** and replies with the receipt (hash, difficulty, attempts, reward,
post-block audit).

**The chain persists.** Blocks, wallets and balances are saved to
`localStorage` after every operation and restored on the next visit — with the
entire chain revalidated from genesis first, so corrupted or hand-edited
storage is discarded rather than trusted. Reload the page and you resume at
the same height with the same balance; the "Reset chain & wallet" control in
the mining lab starts a fresh genesis era on purpose.

## Quickstart

```bash
npm install
npm run dev      # landing page on http://localhost:5173
npm test         # 18-test consensus suite (vitest)
npm run demo     # CLI: mine, transfer, audit, tamper, fork-choice — end to end
npm run build    # type-check + production build
```

## The chain (`src/chain/`)

| Module           | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `sha256.ts`      | Pure-TS SHA-256 (FIPS 180-4) — synchronous so the mining loop can grind nonces; verified against NIST vectors |
| `bytes.ts`       | Hex/UTF-8 helpers and `leadingZeroBits` (the difficulty metric)               |
| `merkle.ts`      | Merkle root over transaction ids — commits a block to its exact tx set        |
| `wallet.ts`      | ECDSA P-256 key pairs via WebCrypto; address = `leaf` + SHA-256(pubkey)[0..20] |
| `transaction.ts` | Account-model transfers: amount, fee, **nonce** (replay protection), signature over a canonical payload |
| `block.ts`       | Canonical headers, block hashing, and the proof-of-work miner (optionally yielding to the event loop so browser mining never janks) |
| `blockchain.ts`  | The node: mempool with fee-priority selection, full block validation, ledger state, difficulty retargeting, halvings, heaviest-chain fork choice |

### Consensus rules (enforced on every block, local or received)

- `prevHash` must link to the parent; `hash` must equal SHA-256 of the canonical header
- the hash must meet the difficulty demanded by the retarget schedule
  (±1 bit when blocks solve in under half / over double the target time, clamped)
- the Merkle root must commit to exactly the included transactions
- exactly one coinbase, first in the block, paying **reward + fees** — reward
  halves every `halvingInterval` blocks, so you cannot print money
- every transfer needs a valid ECDSA signature from a key that hashes to the
  sender's address, the sender's exact next nonce, and full funding
- fork choice: a competing chain wins only if fully valid **and** carrying more
  cumulative proof-of-work

The test suite covers NIST hash vectors, signature forgery, replay, overspends
(including across the mempool), coinbase inflation, history tampering (both
crude and "recompute-everything" variants), halvings, retarget bounds, and
fork choice. Run `npm run demo` to watch all of it happen in a terminal.

## The website

React + Vite + TypeScript + Tailwind + framer-motion + lucide-react. A dark,
cinematic single page set in **Instrument Serif** on a deep green-black
palette (`hsl(150 20% 5%)`) with warm amber accents (`hsl(45 70% 75%)`):

- **Hero** — full-screen background video over an animated aurora fallback
  (a dead CDN can never leave the page black), a 7rem serif headline with a
  directional neon glow on "assets.", an amber GlowButton with a gold halo,
  a live block-height status line, and an infinite "Trusted by top builders"
  logo marquee pinned to the bottom.
- **Console** — the liquid-glass dashboard holds the Verdant console (chat)
  and a miniature site preview with a JS-managed fade-in/out video loop.
  Every chat message mines a real block; on phones the console stacks below
  the preview.
- **About** — live stat tiles (height, supply, cumulative work, difficulty).
- **Protocol** — the four consensus rules, explained.
- **Mining** — a live block explorer plus wallet card and buttons to mine
  (with hashes/sec progress), send a signed transfer, audit from genesis,
  and reset the persisted chain.
- **Tokenomics** — the emission curve and consensus parameters, computed from
  the very config the page runs.

A single `ChainProvider` hosts the node — and persists it — so the hero
status line, console, explorer and stat tiles all reflect the same chain
across visits. Serif for display and prose; Inter for dense data UI; mono
for hashes.

## Deploy

The site is fully static — any static host works.

**Vercel (recommended):** go to [vercel.com/new](https://vercel.com/new),
import this repo, click Deploy. `vercel.json` pins the Vite preset (build
`npm run build`, output `dist`), so there is nothing to configure. From a
terminal it's `npx vercel --prod`.

**GitHub Pages (already wired):** every push runs
`.github/workflows/deploy.yml`, which tests, builds and publishes `dist/` to
Pages. If the first run didn't enable Pages automatically, flip it once in
repo Settings → Pages → Source: "GitHub Actions".

The build uses a relative asset base (`base: "./"`), so the same `dist/`
works on Vercel, Pages, Netlify, Cloudflare — or opened off a USB stick.

### Talk to the chain

Open the page and type into the console (the chat panel of the dashboard):

- *anything* → mines a block and reports hash, attempts, time, reward
- "send 5 to the peer" → signs a transfer, mines it in, shows balances
- "what's my balance" → wallet + peer balances and total supply
- "audit the chain" → full revalidation from genesis with cumulative work

## Honest limitations

Verdant is a real blockchain, but an educational one: no peer-to-peer
networking layer (nodes sync via `receiveBlock`/`replaceChain`), P-256 instead
of secp256k1, an account model instead of UTXOs, and in-memory state with no
persistence. Do not secure anything of value with it — grow it instead.
