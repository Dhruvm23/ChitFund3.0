"use client";

import { useRoundHistory } from "@/hooks/useChitFund";
import { formatUSDC, truncateAddress, bpsToPercent } from "@/lib/utils";

interface RoundHistoryProps {
  groupAddress: `0x${string}`;
  currentRound: number;
}

export function RoundHistory({ groupAddress, currentRound }: RoundHistoryProps) {
  // Show past rounds (1 to currentRound - 1)
  const rounds = Array.from({ length: Math.max(0, currentRound - 1) }, (_, i) => i + 1);

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No completed rounds yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rounds
        .slice()
        .reverse()
        .map((round) => (
          <RoundRow
            key={round}
            groupAddress={groupAddress}
            round={round}
          />
        ))}
    </div>
  );
}

function RoundRow({
  groupAddress,
  round,
}: {
  groupAddress: `0x${string}`;
  round: number;
}) {
  const { data: result } = useRoundHistory(groupAddress, round);

  if (!result) {
    return <div className="h-16 rounded-lg shimmer" />;
  }

  const hasWinner = result.winner !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-300">R{round}</span>
          </div>
          <div>
            {hasWinner ? (
              <>
                <p className="text-sm font-medium text-white">
                  Winner: {truncateAddress(result.winner)} 🏆
                </p>
                <p className="text-xs text-gray-500">
                  Discount: {bpsToPercent(result.discountBps)} • Dividend:{" "}
                  {formatUSDC(result.dividendPerMember)}/member
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Round in progress</p>
            )}
          </div>
        </div>

        {hasWinner && (
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-400">
              {formatUSDC(result.payout)}
            </p>
            <p className="text-xs text-gray-500">payout</p>
          </div>
        )}
      </div>
    </div>
  );
}
