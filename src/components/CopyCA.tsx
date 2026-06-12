"use client";

import { useState } from "react";
import { site } from "@/config/site";

export default function CopyCA() {
  const [copied, setCopied] = useState(false);
  const ca = site.contractAddress;

  if (!ca) {
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-dashed border-line bg-panel px-4 py-2.5 font-mono text-sm">
        <span className="text-dim">CA:</span>
        <span className="text-amber">TBA — dropping soon</span>
      </div>
    );
  }

  const short = `${ca.slice(0, 6)}…${ca.slice(-6)}`;

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(ca);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-2.5 font-mono text-sm transition-colors hover:border-signal/50"
      title="Copy contract address"
    >
      <span className="text-dim">CA:</span>
      <span className="text-ink">{short}</span>
      <span className={copied ? "text-signal" : "text-dim"}>{copied ? "copied ✓" : "copy ⧉"}</span>
    </button>
  );
}
