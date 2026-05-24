"use client";

import Link from "next/link";
import { useActiveGroups } from "@/hooks/useGroupList";
import { GroupCard } from "@/components/GroupCard";
import { getNetworkName } from "@/lib/network";
import { DEFAULT_CHAIN_ID } from "@/lib/addresses";

export default function HomePage() {
  const { data: groups, isLoading } = useActiveGroups();

  return (
    <div>
      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">
              Live on {getNetworkName(DEFAULT_CHAIN_ID)}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              India&apos;s ₹50,000 Crore
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Savings Institution
            </span>
            <br />
            <span className="text-white">Rebuilt Trustless On-Chain</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-delay">
            ChitFund3.0 replaces the human foreman with an immutable smart
            contract. Commit-reveal auctions. Transparent dividends. Zero trust
            required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay-2">
            <Link href="/create" className="btn-glow text-center px-8 py-4 text-lg">
              Create a Group
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/Dhruvm23/ChitFund3.0"}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-8 py-4 text-lg flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/10 animate-float hidden lg:block" />
        <div className="absolute bottom-20 right-16 w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10 animate-float hidden lg:block" style={{ animationDelay: "2s" }} />
      </section>

      {/* ─── Stats Section ────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Protocol
              </p>
              <p className="stat-value">ChitFund3.0</p>
              <p className="text-sm text-gray-400 mt-1">
                On Ethereum Sepolia
              </p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Auction Type
              </p>
              <p className="stat-value">Commit-Reveal</p>
              <p className="text-sm text-gray-400 mt-1">
                MEV Protected
              </p>
            </div>
            <div className="stat-card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Trust Model
              </p>
              <p className="stat-value">Trustless</p>
              <p className="text-sm text-gray-400 mt-1">
                Smart Contract Enforced
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Join a Group",
                desc: "Browse open groups and deposit your first contribution in USDC.",
                icon: "👥",
              },
              {
                step: "02",
                title: "Contribute Monthly",
                desc: "Each round, all members deposit their fixed contribution to the pot.",
                icon: "💰",
              },
              {
                step: "03",
                title: "Sealed Bid Auction",
                desc: "Commit your bid secretly, then reveal. Highest discount wins the pot.",
                icon: "🔐",
              },
              {
                step: "04",
                title: "Earn Dividends",
                desc: "The winner's discount is split as dividends among all members.",
                icon: "📈",
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-6 text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-2">
                  Step {item.step}
                </p>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Active Groups ────────────────────────────────────────────── */}
      <section className="px-6 pb-20" id="groups">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Active Groups
              </span>
            </h2>
            <Link
              href="/create"
              className="btn-glow text-sm px-5 py-2.5"
            >
              + New Group
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-6 space-y-4">
                  <div className="h-5 w-32 rounded shimmer" />
                  <div className="h-4 w-48 rounded shimmer" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 rounded-lg shimmer" />
                    <div className="h-16 rounded-lg shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group} address={group} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">🏦</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Groups Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Be the first to create a decentralized chit fund group.
              </p>
              <Link href="/create" className="btn-glow inline-block">
                Create First Group
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
