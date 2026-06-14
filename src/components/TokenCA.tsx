import { useState } from "react";
import { MIcon } from "./MIcon";

export const TICKER = "$ATB";

/**
 * The live Solana mint goes here at launch. Until then the component renders a
 * pre-launch state instead of a placeholder address — a fake CA is how people
 * get drained. Paste the real mint into MEMECOIN_CA and everything below lights
 * up automatically (copy button, pump.fun link, truncated display).
 */
export const MEMECOIN_CA = "";
export const PUMP_FUN_URL = MEMECOIN_CA
  ? `https://pump.fun/coin/${MEMECOIN_CA}`
  : "https://pump.fun";

/** Contract-address pill: full CA with one-tap copy once launched, otherwise a
 *  clearly-labelled "dropping at launch" state. */
export function TokenCA({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const launched = MEMECOIN_CA.length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MEMECOIN_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the CA is
      // still selectable text.
    }
  };

  return (
    <div
      className={`liquid-glass inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 font-mono ${className}`}
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-accent/90">
        {launched ? "CA" : TICKER}
      </span>
      <code className="min-w-0 truncate text-xs text-foreground/80">
        {launched ? MEMECOIN_CA : "contract address drops at launch"}
      </code>
      {launched && (
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy contract address"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-foreground/20 hover:text-foreground"
        >
          <MIcon name={copied ? "check" : "content_copy"} size={13} />
        </button>
      )}
      <a
        href={PUMP_FUN_URL}
        target="_blank"
        rel="noreferrer"
        className="flex h-7 shrink-0 items-center rounded-full bg-accent px-3 text-[11px] font-medium text-accent-foreground transition-all hover:brightness-110"
      >
        pump.fun ↗
      </a>
    </div>
  );
}
