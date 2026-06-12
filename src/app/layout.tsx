import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jet" });

export const metadata: Metadata = {
  title: `${site.name} — Claude-powered Polymarket alpha`,
  description: site.description,
  openGraph: {
    title: `${site.name} — Claude-powered Polymarket alpha`,
    description: site.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Claude-powered Polymarket alpha`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${jet.variable}`}>
      <body>{children}</body>
    </html>
  );
}
