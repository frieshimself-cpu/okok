import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { AnimatedText } from "./AnimatedText";
import { SecondaryButton } from "./Buttons";
import { MIcon } from "./MIcon";
import { Sheet } from "./Sheet";

const navItems = [
  { name: "About", href: "#about" },
  { name: "Protocol", href: "#protocol" },
  { name: "Mining", href: "#mining" },
  { name: "Tokenomics", href: "#tokenomics" },
];

const hoverDriver = {
  initial: "rest" as const,
  whileHover: "hover" as const,
  animate: "rest" as const,
};

function smoothScroll(href: string) {
  return (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById(href.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
  };
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
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300 ${
        scrolled ? "bg-[#08020e]/70 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6 lg:px-0">
        <a
          href="#hero"
          onClick={smoothScroll("#hero")}
          className="flex items-center gap-2 text-foreground"
        >
          <MIcon name="eco" size={20} />
          <span className="text-base font-semibold tracking-tight">Verdant</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <motion.a
              key={item.name}
              href={item.href}
              onClick={smoothScroll(item.href)}
              {...hoverDriver}
              className="text-sm text-landing-text hover:text-foreground transition-colors"
            >
              <AnimatedText>{item.name}</AnimatedText>
            </motion.a>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <motion.a
            href="#console"
            onClick={smoothScroll("#console")}
            {...hoverDriver}
            className="text-sm text-landing-text hover:text-foreground transition-colors"
          >
            <AnimatedText>Console</AnimatedText>
          </motion.a>
          <SecondaryButton href="#mining" onClick={smoothScroll("#mining")} size="sm">
            Start mining
          </SecondaryButton>
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
              className="text-lg text-landing-text transition-colors hover:text-foreground"
            >
              {item.name}
            </a>
          ))}
          <div className="mt-2 h-px bg-white/10" />
          <a
            href="#console"
            onClick={(e) => {
              smoothScroll("#console")(e);
              setMenuOpen(false);
            }}
            className="text-lg text-landing-text transition-colors hover:text-foreground"
          >
            Console
          </a>
          <SecondaryButton
            href="#mining"
            size="md"
            className="w-full"
            onClick={(e) => {
              smoothScroll("#mining")(e);
              setMenuOpen(false);
            }}
          >
            Start mining
          </SecondaryButton>
        </div>
      </Sheet>
    </nav>
  );
}
