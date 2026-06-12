import { useState } from "react";
import { MIcon } from "./MIcon";

export const MEMECOIN_CA = "6i52HGKVzH9uaRFMNaGpUfVnvJUBeqkF2RnNXRnVpump";
export const PUMP_FUN_URL = `https://pump.fun/coin/${MEMECOIN_CA}`;

/** Contract-address pill: full CA, one-tap copy, link to pump.fun. */
export function TokenCA({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

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
      className={`liquid-glass inline-flex max-w-full items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5 font-inter ${className}`}
    >
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-accent/90">
        CA
      </span>
      <code className="min-w-0 truncate text-xs text-foreground/80">{MEMECOIN_CA}</code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label="Copy contract address"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 transition-colors hover:bg-foreground/20 hover:text-foreground"
      >
        <MIcon name={copied ? "check" : "content_copy"} size={13} />
      </button>
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
