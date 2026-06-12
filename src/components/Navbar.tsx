import { site } from "@/config/site";

const links = [
  { href: "#picks", label: "Picks" },
  { href: "#how", label: "How it works" },
  { href: "#token", label: "Token" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-night/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2 font-bold tracking-tight">
          <LogoMark />
          <span className="text-lg">
            <span className="text-signal">$</span>PREDICTIONS
          </span>
        </a>

        <div className="hidden items-center gap-7 text-sm text-dim md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>

        <a
          href={site.pumpFunUrl || "https://pump.fun"}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-signal px-4 py-2 text-sm font-bold text-[#04130c] transition-transform hover:scale-105"
        >
          Buy {site.name}
        </a>
      </nav>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" fill="#0b0f12" stroke="#1c272e" />
      <path
        d="M14 44 26 30l8 7 12-16"
        stroke="#00ff9d"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="21" r="5" fill="#00ff9d" />
    </svg>
  );
}
