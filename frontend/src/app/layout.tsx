import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getExplorerUrl } from "@/lib/network";
import { DEFAULT_CHAIN_ID } from "@/lib/addresses";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ChitFund3.0 — On-Chain Chit Fund Protocol",
  description:
    "Web3 protocol for trustless rotating savings on Ethereum Sepolia. Commit-reveal auctions, USDC pools, and automatic dividend distribution.",
  keywords: [
    "ChitFund3.0",
    "chit fund",
    "Web3",
    "DeFi",
    "Ethereum",
    "Sepolia",
    "USDC",
    "smart contract",
    "commit-reveal",
    "savings",
    "India",
  ],
  openGraph: {
    title: "ChitFund3.0 — On-Chain Chit Fund Protocol",
    description:
      "India's oldest savings institution, rebuilt trustless on-chain with Ethereum Sepolia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0a0b0f] text-white min-h-screen`}
      >
        <Providers>
          <div className="relative min-h-screen">
            {/* Animated background gradient mesh */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse" />
              <div className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse delay-1000" />
              <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-violet-800/10 blur-[100px] animate-pulse delay-500" />
            </div>

            <Navbar />
            <main className="relative">{children}</main>

            {/* Footer */}
            <footer className="relative border-t border-white/5 mt-20">
              <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold">3.0</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      ChitFund3.0 — On-chain savings on Ethereum Sepolia
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <a
                      href={
                        process.env.NEXT_PUBLIC_GITHUB_URL ||
                        "https://github.com/Dhruvm23/ChitFund3.0"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors"
                    >
                      GitHub
                    </a>
                    <a
                      href={getExplorerUrl(DEFAULT_CHAIN_ID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400 transition-colors"
                    >
                      Explorer
                    </a>
                    <span>Built for ETHGlobal India 🇮🇳</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
