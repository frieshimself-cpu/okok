import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { MIcon } from "./MIcon";
import { Sheet } from "./Sheet";
import { GlowButton } from "./GlowButton";

const navItems = [
  { name: "Swarm", href: "#swarm" },
  { name: "Thesis", href: "#about" },
  { name: "Protocol", href: "#protocol" },
  { name: "Ledger", href: "#mining" },
  { name: "Tokenomics", href: "#tokenomics" },
];

function smoothScroll(href: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById(href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
  };
}

/** Stroke-based bot mark — a square head with two antennae and signal eyes. */
function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path d="M14 8V12M26 8V12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <rect
        x="9"
        y="12"
        width="22"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="21" r="2" fill="currentColor" />
      <circle cx="24" cy="21" r="2" fill="currentColor" />
    </svg>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? "border-b border-foreground/5 bg-background/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-8 py-6 md:px-16">
        <div className="flex items-center gap-8">
          <a
            href="#hero"
            onClick={smoothScroll("#hero")}
            className="flex items-center gap-3 text-foreground"
          >
            <Logo />
            <span className="text-2xl tracking-wide">AttentionBot</span>
            <span className="hidden font-mono text-sm text-accent sm:inline">$ATB</span>
          </a>
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={smoothScroll(item.href)}
                className="text-base tracking-wide text-foreground transition-opacity hover:opacity-80"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center text-foreground lg:hidden"
        >
          <MIcon name="menu" size={24} />
        </button>
      </div>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="mt-10 flex flex-col gap-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                smoothScroll(item.href)(e);
                setMenuOpen(false);
              }}
              className="text-xl tracking-wide text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.name}
            </a>
          ))}
          <div className="mt-2 h-px bg-foreground/10" />
          <GlowButton
            className="w-full !text-lg"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("swarm")?.scrollIntoView({ behavior: "smooth" });
              setMenuOpen(false);
            }}
          >
            Enter the swarm
          </GlowButton>
        </div>
      </Sheet>
    </nav>
  );
}
