import { ChainProvider } from "./context/ChainContext";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { About } from "./components/sections/About";
import { Protocol } from "./components/sections/Protocol";
import { Mining } from "./components/sections/Mining";
import { Tokenomics } from "./components/sections/Tokenomics";
import { Footer } from "./components/sections/Footer";

export default function App() {
  return (
    <ChainProvider>
      <div className="landing-root font-inter min-h-screen relative overflow-x-hidden">
        <Navbar />
        <Hero />
        {/* About carries extra top padding so the hero's foreground grass can
            drift down into the gap without covering the heading. */}
        <main className="relative">
          <About />
          <Protocol />
          <Mining />
          <Tokenomics />
        </main>
        <Footer />
      </div>
    </ChainProvider>
  );
}
