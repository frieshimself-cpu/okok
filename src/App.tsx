import { FadeUp } from "./components/FadeUp";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <div className="landing-root font-inter min-h-screen relative overflow-x-hidden">
      <Navbar />
      <Hero />
      {/* Breathing room below the hero so the parallax can complete; the
          grass drifts down into this dark field as you scroll. */}
      <footer className="relative flex h-[50vh] items-end justify-center pb-12">
        <FadeUp>
          <p className="max-w-[560px] px-6 text-center text-sm text-landing-text-muted">
            Verdant is a complete proof-of-work blockchain — mined, signed and verified in your
            browser. <span className="text-landing-text">Open source. No servers. Since block 0.</span>
          </p>
        </FadeUp>
      </footer>
    </div>
  );
}
