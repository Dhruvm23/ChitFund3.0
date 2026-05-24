"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { FACTORY_ABI } from "@/lib/abi/ChitFundFactory";
import { CONTRACTS, contractsDeployed } from "@/lib/addresses";
import { useMounted } from "@/hooks/useMounted";
import { formatUSDC, bpsToPercent } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CreateGroupPage() {
  const mounted = useMounted();
  const { isConnected } = useAccount();
  const [contribution, setContribution] = useState(100);
  const [memberCount, setMemberCount] = useState(10);
  const [roundDays, setRoundDays] = useState(28);
  const [maxDiscount, setMaxDiscount] = useState(3000);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const totalPot = contribution * memberCount;
  const roundDurationSeconds = roundDays * 86400;
  const deployed = contractsDeployed();

  const handleCreate = () => {
    writeContract({
      address: CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: "createGroup",
      args: [
        CONTRACTS.mockUSDC,
        BigInt(contribution * 1e6),
        BigInt(memberCount),
        BigInt(roundDurationSeconds),
        BigInt(maxDiscount),
      ],
    });
  };

  return (
    <div className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Create a Chit Fund Group
            </span>
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Deploy a new on-chain chit fund. Set the rules once — the smart
            contract enforces them forever.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {mounted && !deployed && (
            <div className="lg:col-span-5 glass-card p-4 border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm">
              Contracts not deployed yet. Run{" "}
              <code className="text-amber-100">./scripts/deploy-local.sh</code> and restart{" "}
              <code className="text-amber-100">npm run dev</code>.
            </div>
          )}
          {/* ─── Form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-3 glass-card p-8 space-y-8">
            {/* Contribution Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contribution per Round (USDC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={contribution}
                  onChange={(e) =>
                    setContribution(Math.max(1, Number(e.target.value)))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  min={1}
                  id="contribution-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  USDC
                </span>
              </div>
            </div>

            {/* Member Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Number of Members
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMemberCount(count)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      memberCount === count
                        ? "bg-purple-500/20 border-2 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Round Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Round Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { days: 7, label: "7 days" },
                  { days: 14, label: "14 days" },
                  { days: 28, label: "28 days" },
                ].map(({ days, label }) => (
                  <button
                    key={days}
                    onClick={() => setRoundDays(days)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      roundDays === days
                        ? "bg-purple-500/20 border-2 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Discount */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Maximum Discount
                </label>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
                  {bpsToPercent(maxDiscount)}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={5000}
                step={500}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full"
                id="max-discount-slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Deploy Button */}
            <div className="pt-4">
              {!isConnected ? (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    Connect your wallet to deploy
                  </p>
                  <ConnectButton />
                </div>
              ) : isSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-emerald-400 font-semibold text-lg mb-1">
                    ✓ Group Created!
                  </p>
                  <p className="text-xs text-gray-400">
                    Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!deployed || isPending || isConfirming}
                  className="btn-glow w-full text-center text-lg py-4"
                  id="deploy-button"
                >
                  {isPending
                    ? "Confirm in Wallet..."
                    : isConfirming
                    ? "Deploying Contract..."
                    : "Deploy Chit Fund Group"}
                </button>
              )}

              {error && (
                <p className="text-xs text-red-400 text-center mt-3">
                  {(error as Error).message?.slice(0, 120)}
                </p>
              )}
            </div>
          </div>

          {/* ─── Live Preview ─────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="glass-card gradient-border p-6 sticky top-24 space-y-5">
              <h3 className="text-lg font-semibold text-white mb-4">
                Group Preview
              </h3>

              <div className="space-y-4">
                <PreviewRow
                  label="Contribution"
                  value={formatUSDC(BigInt(contribution * 1e6))}
                />
                <PreviewRow
                  label="Members"
                  value={`${memberCount} participants`}
                />
                <PreviewRow
                  label="Round Duration"
                  value={`${roundDays} days`}
                />
                <PreviewRow
                  label="Max Discount"
                  value={bpsToPercent(maxDiscount)}
                />

                <div className="border-t border-white/5 pt-4 space-y-3">
                  <PreviewRow
                    label="Total Pot / Round"
                    value={formatUSDC(BigInt(totalPot * 1e6))}
                    highlight
                  />
                  <PreviewRow
                    label="Total Rounds"
                    value={`${memberCount} rounds`}
                  />
                  <PreviewRow
                    label="Group Duration"
                    value={`${(memberCount * roundDays / 30).toFixed(0)} months`}
                  />
                  <PreviewRow
                    label="Max Dividend / Round"
                    value={formatUSDC(
                      BigInt(
                        Math.floor(
                          (totalPot * maxDiscount) / 10000 / memberCount
                        ) * 1e6
                      )
                    )}
                  />
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-300">
                  🔒 Once deployed, these parameters cannot be changed. The
                  smart contract enforces all rules.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight
            ? "bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent text-base"
            : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
