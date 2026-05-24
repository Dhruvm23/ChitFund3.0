"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  formatUSDC,
  bpsToPercent,
  calculatePayout,
  calculateDividend,
} from "@/lib/utils";
import { useCommitBid, generateSalt } from "@/hooks/useChitFund";
import { useSaltStorage } from "@/hooks/useSaltStorage";

interface BidSliderProps {
  groupAddress: `0x${string}`;
  maxDiscountBps: number;
  totalPot: bigint;
  memberCount: number;
  roundNumber: number;
}

export function BidSlider({
  groupAddress,
  maxDiscountBps,
  totalPot,
  memberCount,
  roundNumber,
}: BidSliderProps) {
  const { address } = useAccount();
  const [discountBps, setDiscountBps] = useState(0);
  const { saveSalt, hasSalt, discountBps: savedDiscount } = useSaltStorage(
    groupAddress,
    roundNumber,
    address
  );
  const { commitBid, isPending, isConfirming, error } = useCommitBid();

  const estimatedPayout = calculatePayout(totalPot, discountBps);
  const estimatedDividend = calculateDividend(totalPot, discountBps, memberCount);

  const handleCommit = useCallback(() => {
    const newSalt = generateSalt();
    saveSalt(newSalt, discountBps);
    commitBid(groupAddress, discountBps, newSalt);
  }, [groupAddress, discountBps, saveSalt, commitBid]);

  if (hasSalt) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-sm font-medium text-emerald-400">
              Bid Committed
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Your bid of {bpsToPercent(savedDiscount || 0)} discount has been
            sealed. You can switch wallets in this browser — each account keeps its own salt.
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-xs text-amber-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Do not clear your browser data before revealing!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">
            Discount Offer
          </label>
          <span className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
            {bpsToPercent(discountBps)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={maxDiscountBps}
          step={100}
          value={discountBps}
          onChange={(e) => setDiscountBps(Number(e.target.value))}
          className="w-full"
          id="discount-slider"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0%</span>
          <span>{bpsToPercent(maxDiscountBps)}</span>
        </div>
      </div>

      {/* Payout Preview */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Your Payout (if you win)
          </p>
          <p className="text-xl font-bold text-emerald-400">
            {formatUSDC(estimatedPayout)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Member Dividend
          </p>
          <p className="text-xl font-bold text-blue-400">
            {formatUSDC(estimatedDividend)}
          </p>
        </div>
      </div>

      {/* Strategy hint */}
      <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
        <p className="text-xs text-gray-400">
          💡 <strong>Strategy:</strong> Higher discount = more likely to win but
          lower payout. The member offering the highest discount wins the pot.
        </p>
      </div>

      {/* Commit Button */}
      <button
        onClick={handleCommit}
        disabled={isPending || isConfirming || discountBps === 0}
        className="btn-glow w-full text-center"
        id="commit-bid-button"
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
          ? "Committing..."
          : `Lock in Bid at ${bpsToPercent(discountBps)}`}
      </button>

      {error && (
        <p className="text-xs text-red-400 text-center">
          {(error as Error).message?.slice(0, 100)}
        </p>
      )}
    </div>
  );
}
