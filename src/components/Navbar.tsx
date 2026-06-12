import { motion } from "framer-motion";
import { useState } from "react";
import type { MouseEvent } from "react";
import { AnimatedText } from "./AnimatedText";
import { SecondaryButton } from "./Buttons";
import { MIcon } from "./MIcon";
import { Sheet } from "./Sheet";

const navItems = [
  { name: "About", href: "#about" },
  { name: "Protocol", href: "#protocol" },
  { name: "Mining", href: "#console" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent">
      <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6 lg:px-0">
        <a href="/" className="flex items-center gap-2 text-foreground">
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
            <AnimatedText>Login</AnimatedText>
          </motion.a>
          <SecondaryButton href="#console" onClick={smoothScroll("#console")} size="sm">
            Get started
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
            Login
          </a>
          <SecondaryButton
            href="#console"
            size="md"
            className="w-full"
            onClick={(e) => {
              smoothScroll("#console")(e);
              setMenuOpen(false);
            }}
          >
            Get started
          </SecondaryButton>
        </div>
      </Sheet>
    </nav>
  );
}
