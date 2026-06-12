import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import LiveDashboard from "@/components/LiveDashboard";
import Navbar from "@/components/Navbar";
import TokenSection from "@/components/TokenSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LiveDashboard />
        <HowItWorks />
        <TokenSection />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
