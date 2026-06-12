"use client";

import { useCallback, useEffect, useState } from "react";
import type { Prediction, PredictionsPayload } from "@/lib/types";

const REFETCH_MS = 60_000;

export default function LiveDashboard() {
  const [data, setData] = useState<PredictionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions");
      if (!res.ok) throw new Error(`API ${res.status}`);
      setData((await res.json()) as PredictionsPayload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load predictions");
    }
  }, []);

  useEffect(() => {
    void load();
    const fetcher = setInterval(() => void load(), REFETCH_MS);
    const ticker = setInterval(() => forceTick((n) => n + 1), 30_000); // refresh "x min ago"
    return () => {
      clearInterval(fetcher);
      clearInterval(ticker);
    };
  }, [load]);

  return (
    <section id="picks" className="relative border-t border-line">
      <Ticker picks={data?.picks ?? []} />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Today&apos;s <span className="text-signal">edge board</span>
            </h2>
            <p className="mt-2 max-w-xl text-dim">
              Markets where the model&apos;s estimate disagrees with the price, ranked by edge ×
              confidence.
            </p>
          </div>
          <StatsRow data={data} />
        </div>

        {data?.note && (
          <div className="mt-6 rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber">
            {data.note}
          </div>
        )}

        {error && !data && (
          <div className="mt-10 rounded-xl border border-blood/40 bg-blood/5 px-4 py-6 text-center text-blood">
            Couldn&apos;t reach the prediction engine ({error}). Refresh to retry.
          </div>
        )}

        {!data && !error && <SkeletonGrid />}

        {data && data.picks.length === 0 && (
          <div className="card mt-10 px-4 py-10 text-center text-dim">
            No edges right now — the model passed on all {data.marketsScanned} scanned markets.
            Patience is also alpha.
          </div>
        )}

        {data && data.picks.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.picks.map((p, i) => (
              <PredictionCard key={p.id} pick={p} rank={i + 1} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center font-mono text-xs text-dim/70">
          Estimates from an AI model with a training cutoff — verify the news before trading.
          Not financial advice.
        </p>
      </div>
    </section>
  );
}

/* ── Ticker ──────────────────────────────────────────────────────────────── */

function Ticker({ picks }: { picks: Prediction[] }) {
  const items = picks.length
    ? picks
    : ([{ id: "x", question: "Scanning Polymarket for mispriced odds…", side: "YES", marketProb: 0, modelProb: 0, edge: 0 }] as unknown as Prediction[]);

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((p) => (
        <span key={`${key}-${p.id}`} className="mx-6 inline-flex items-center gap-2 font-mono text-xs">
          <span className={p.side === "YES" ? "text-signal" : "text-blood"}>
            {p.edge > 0 ? `${p.side} +${(p.edge * 100).toFixed(1)}pts` : "···"}
          </span>
          <span className="text-dim">{p.question}</span>
          {p.edge > 0 && (
            <span className="text-dim/60">
              mkt {(p.marketProb * 100).toFixed(0)}% / claude {(p.modelProb * 100).toFixed(0)}%
            </span>
          )}
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-b border-line bg-panel/60 py-2.5">
      <div className="animate-marquee flex w-max">{[row("a"), row("b")]}</div>
    </div>
  );
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

function StatsRow({ data }: { data: PredictionsPayload | null }) {
  const updated = data ? minutesAgo(data.generatedAt) : null;
  const stats: [string, string][] = [
    ["Scanned", data ? String(data.marketsScanned) : "—"],
    ["Live picks", data ? String(data.picks.length) : "—"],
    ["Passed", data ? String(data.passed) : "—"],
    ["Engine", data ? (data.engine === "claude" ? (data.model ?? "claude") : "demo") : "—"],
    ["Updated", updated ?? "—"],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(([label, value]) => (
        <div key={label} className="card px-3.5 py-2 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-dim">{label}</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-signal">{value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────────── */

function PredictionCard({ pick, rank }: { pick: Prediction; rank: number }) {
  const yes = pick.side === "YES";
  return (
    <article className="card card-hover flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={`chip ${yes ? "border-signal/50 text-signal" : "border-blood/50 text-blood"}`}>
          {yes ? "BUY YES" : "BUY NO"}
        </span>
        <span className="chip border-amber/50 text-amber">+{(pick.edge * 100).toFixed(1)} pts</span>
      </div>

      <a
        href={pick.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 font-bold leading-snug transition-colors hover:text-signal"
      >
        <span className="mr-2 font-mono text-xs text-dim">#{rank}</span>
        {pick.question}
      </a>

      <div className="mt-4 space-y-2.5 font-mono text-xs">
        <ProbBar label="MARKET" value={pick.marketProb} color="rgba(139,151,157,0.9)" />
        <ProbBar label="CLAUDE" value={pick.modelProb} color="var(--color-signal)" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-dim">{pick.rationale}</p>
      {pick.riskNote && (
        <p className="mt-2 text-xs text-amber/80">⚠ {pick.riskNote}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-4 font-mono text-[11px] text-dim/80">
        <span>
          conf <ConfidenceDots level={pick.confidence} /> · vol ${compact(pick.volume24h)}/24h
        </span>
        <a
          href={pick.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-signal transition-opacity hover:opacity-75"
        >
          trade ↗
        </a>
      </div>
    </article>
  );
}

function ProbBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-dim">{label}</span>
      <div className="bar-track flex-1">
        <div className="bar-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="w-11 shrink-0 text-right" style={{ color }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function ConfidenceDots({ level }: { level: Prediction["confidence"] }) {
  const n = level === "HIGH" ? 3 : level === "MEDIUM" ? 2 : 1;
  return (
    <span className="tracking-widest text-signal" title={`${level} confidence`}>
      {"●".repeat(n)}
      <span className="text-dim/40">{"●".repeat(3 - n)}</span>
    </span>
  );
}

/* ── Bits ────────────────────────────────────────────────────────────────── */

function SkeletonGrid() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-64 animate-pulse bg-panel" />
      ))}
    </div>
  );
}

function compact(n: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function minutesAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins === 0) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}
