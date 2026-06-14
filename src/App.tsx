import { ChainProvider } from "./context/ChainContext";
import { Hero } from "./components/Hero";
import { Navbar } from "./components/Navbar";
import { Swarm } from "./components/sections/Swarm";
import { About } from "./components/sections/About";
import { Protocol } from "./components/sections/Protocol";
import { Mining } from "./components/sections/Mining";
import { Tokenomics } from "./components/sections/Tokenomics";
import { ConsoleSection } from "./components/sections/ConsoleSection";
import { Footer } from "./components/sections/Footer";

export default function App() {
  return (
    <ChainProvider>
      <div className="landing-root relative min-h-screen overflow-x-hidden font-serif">
        <Navbar />
        <Hero />
        <main className="relative">
          <Swarm />
          <About />
          <Protocol />
          <Mining />
          <Tokenomics />
          <ConsoleSection />
        </main>
        <Footer />
      </div>
    </ChainProvider>
  );
}
