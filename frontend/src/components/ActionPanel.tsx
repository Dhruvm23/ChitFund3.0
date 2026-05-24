"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBlock } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGroupInfo,
  useMemberStatus,
  useContribute,
  useRevealBid,
  useWithdrawDividend,
  useAdvancePhase,
  useJoinGroup,
  useIsMember,
  useDividendBalance,
} from "@/hooks/useChitFund";
import { useSaltStorage } from "@/hooks/useSaltStorage";
import { ERC20_ABI } from "@/lib/abi/MockUSDC";
import { BidSlider } from "./BidSlider";
import {
  formatUSDC,
  getRoundPhaseName,
  getPhaseColor,
  bpsToPercent,
} from "@/lib/utils";

interface ActionPanelProps {
  groupAddress: `0x${string}`;
}

export function ActionPanel({ groupAddress }: ActionPanelProps) {
  const { address: userAddress } = useAccount();
  const { data: info } = useGroupInfo(groupAddress);
  const { data: memberCheck } = useIsMember(
    groupAddress,
    userAddress || "0x0000000000000000000000000000000000000000"
  );
  const { data: memberStatus } = useMemberStatus(
    groupAddress,
    userAddress || "0x0000000000000000000000000000000000000000"
  );

  if (!info || !userAddress) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-gray-400">Connect your wallet to interact</p>
      </div>
    );
  }

  const state = Number(info.state);
  const phase = Number(info.phase);
  const isMemberOfGroup = memberCheck === true;

  // OPEN state — show join button
  if (state === 0) {
    return (
      <JoinPanel
        groupAddress={groupAddress}
        tokenAddress={info.token as `0x${string}`}
        contributionAmount={info.contributionAmount}
        isMember={isMemberOfGroup}
      />
    );
  }

  // COMPLETE state
  if (state === 3) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-xl font-bold text-gray-300 mb-2">🏁 Group Complete</p>
        <p className="text-sm text-gray-500">All rounds have been completed.</p>
        <DividendClaim groupAddress={groupAddress} userAddress={userAddress} />
      </div>
    );
  }

  // PAUSED state
  if (state === 2) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⏸</span>
        </div>
        <p className="text-lg font-semibold text-amber-400">Group Paused</p>
        <p className="text-sm text-gray-500 mt-1">
          Governance action required to resume.
        </p>
      </div>
    );
  }

  // ACTIVE state — show phase-specific panel
  return (
    <div className="glass-card overflow-hidden">
      {/* Phase Header */}
      <div
        className={`bg-gradient-to-r ${getPhaseColor(phase)} p-4 text-center`}
      >
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          Current Phase
        </p>
        <p className="text-xl font-bold">{getRoundPhaseName(phase)}</p>
      </div>

      <div className="p-6">
        {!isMemberOfGroup ? (
          <p className="text-center text-gray-400 text-sm">
            You are not a member of this group.
          </p>
        ) : (
          <>
            {phase === 0 && (
              <ContributionPanel
                groupAddress={groupAddress}
                tokenAddress={info.token as `0x${string}`}
                contributionAmount={info.contributionAmount}
                hasContributed={memberStatus?.hasContributed || false}
              />
            )}
            {phase === 1 && (
              <BidSlider
                groupAddress={groupAddress}
                maxDiscountBps={Number(info.maxDiscountBps)}
                totalPot={info.potBalance}
                memberCount={Number(info.memberCount)}
                roundNumber={Number(info.roundNumber)}
              />
            )}
            {phase === 2 && (
              <RevealPanel
                groupAddress={groupAddress}
                roundNumber={Number(info.roundNumber)}
              />
            )}
            {phase === 3 && (
              <DistributionPanel
                groupAddress={groupAddress}
                userAddress={userAddress}
              />
            )}

            {/* Advance Phase Button */}
            <AdvancePhaseButton
              groupAddress={groupAddress}
              deadline={Number(info.phaseDeadline)}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Panels ────────────────────────────────────────────────────────────────

function JoinPanel({
  groupAddress,
  tokenAddress,
  contributionAmount,
  isMember,
}: {
  groupAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  contributionAmount: bigint;
  isMember: boolean;
}) {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: userAddress ? [userAddress, groupAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  const {
    writeContract: faucet,
    data: faucetHash,
    isPending: isFauceting,
    error: faucetWriteError,
  } = useWriteContract();
  const {
    isLoading: isFaucetConfirming,
    isSuccess: isFauceted,
    isError: isFaucetFailed,
    error: faucetReceiptError,
  } = useWaitForTransactionReceipt({ hash: faucetHash });

  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
    error: approveWriteError,
  } = useWriteContract();
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApprovedTx,
    isError: isApproveFailed,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    join,
    isPending: isJoining,
    isConfirming: isJoinConfirming,
    isSuccess: isJoined,
    isReceiptError: isJoinFailed,
    error: joinError,
  } = useJoinGroup();

  const hasBalance = (balance ?? 0n) >= contributionAmount;
  const hasAllowance = (allowance ?? 0n) >= contributionAmount;
  const canApprove = hasBalance && !hasAllowance;

  useEffect(() => {
    if (isFauceted) refetchBalance();
  }, [isFauceted, refetchBalance]);

  useEffect(() => {
    if (isApprovedTx) refetchAllowance();
  }, [isApprovedTx, refetchAllowance]);

  useEffect(() => {
    if (isJoined) {
      queryClient.invalidateQueries();
    }
  }, [isJoined, queryClient]);

  const txError =
    faucetWriteError ??
    faucetReceiptError ??
    approveWriteError ??
    approveReceiptError ??
    joinError;

  if (isMember || isJoined) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-emerald-400 font-medium">✓ You are a member</p>
        <p className="text-xs text-gray-500 mt-1">
          Waiting for group to fill and activate.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Join This Group</h3>
      <p className="text-sm text-gray-400">
        Deposit {formatUSDC(contributionAmount)} to join. This is your first
        round contribution.
      </p>

      <p className="text-xs text-gray-500">
        Your mUSDC balance: {formatUSDC(balance ?? 0n)}
      </p>

      <div className="flex flex-col gap-3">
        {!hasBalance && (
          <button
            onClick={() =>
              faucet({
                address: tokenAddress,
                abi: ERC20_ABI,
                functionName: "faucet",
              })
            }
            disabled={isFauceting || isFaucetConfirming}
            className="btn-secondary"
            id="faucet-button"
          >
            {isFauceting
              ? "Confirm in Wallet..."
              : isFaucetConfirming
              ? "Minting..."
              : isFauceted
              ? "✓ Got Test USDC"
              : "1. Get Test USDC (Faucet)"}
          </button>
        )}

        <button
          onClick={() =>
            approve({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [groupAddress, contributionAmount],
            })
          }
          disabled={!canApprove || isApproving || isApproveConfirming || hasAllowance}
          className="btn-secondary"
          id="approve-button"
        >
          {isApproving
            ? "Confirm in Wallet..."
            : isApproveConfirming
            ? "Approving..."
            : hasAllowance
            ? "✓ Approved"
            : `${hasBalance ? "2" : "—"}. Approve ${formatUSDC(contributionAmount)}`}
        </button>

        <button
          onClick={() => join(groupAddress)}
          disabled={!hasBalance || !hasAllowance || isJoining || isJoinConfirming}
          className="btn-glow text-center"
          id="join-button"
        >
          {isJoining
            ? "Confirm in Wallet..."
            : isJoinConfirming
            ? "Joining..."
            : `${hasBalance && hasAllowance ? "3" : "—"}. Join Group`}
        </button>
      </div>

      {!hasBalance && !isFauceting && !isFaucetConfirming && (
        <p className="text-xs text-amber-400">
          You need test mUSDC first. Only the deployer wallet gets tokens automatically — use
          the faucet above (10,000 mUSDC).
        </p>
      )}

      {(txError || isJoinFailed || isApproveFailed || isFaucetFailed) && (
        <p className="text-xs text-red-400">{formatTxError(txError)}</p>
      )}
    </div>
  );
}

function formatTxError(error: Error | null | undefined): string {
  if (!error) return "Transaction failed. Check your wallet and try again.";
  const msg = error.message.toLowerCase();
  if (msg.includes("insufficient") || msg.includes("exceeds balance")) {
    return "Insufficient mUSDC. Use the faucet to mint test tokens first.";
  }
  if (msg.includes("group is full")) return "This group is full.";
  if (msg.includes("already a member")) return "You are already a member.";
  return error.message.slice(0, 160);
}

function ContributionPanel({
  groupAddress,
  tokenAddress,
  contributionAmount,
  hasContributed,
}: {
  groupAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  contributionAmount: bigint;
  hasContributed: boolean;
}) {
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproved } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const { contribute, isPending, isConfirming, isSuccess } = useContribute();

  if (hasContributed) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
        <p className="text-emerald-400 font-medium">
          ✓ Contribution Complete
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatUSDC(contributionAmount)} deposited for this round.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Deposit your contribution for this round.
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() =>
            approve({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [groupAddress, contributionAmount],
            })
          }
          disabled={isApproving || isApproveConfirming || isApproved}
          className="btn-secondary"
          id="approve-contribute-button"
        >
          {isApproved ? "✓ Approved" : `Approve ${formatUSDC(contributionAmount)}`}
        </button>
        <button
          onClick={() => contribute(groupAddress)}
          disabled={!isApproved || isPending || isConfirming}
          className="btn-glow text-center"
          id="contribute-button"
        >
          {isPending
            ? "Confirm..."
            : isConfirming
            ? "Contributing..."
            : isSuccess
            ? "✓ Done!"
            : `Contribute ${formatUSDC(contributionAmount)}`}
        </button>
      </div>
    </div>
  );
}

function RevealPanel({
  groupAddress,
  roundNumber,
}: {
  groupAddress: `0x${string}`;
  roundNumber: number;
}) {
  const { address } = useAccount();
  const { salt, discountBps, hasSalt } = useSaltStorage(groupAddress, roundNumber, address);
  const { revealBid, isPending, isConfirming, isSuccess, error } = useRevealBid();

  if (!hasSalt) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
        <p className="text-amber-400 font-medium">⚠ No bid to reveal</p>
        <p className="text-xs text-gray-400 mt-1">
          Either you didn&apos;t commit a bid, or your browser storage was
          cleared.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.03] rounded-lg p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Your Committed Bid
        </p>
        <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
          {bpsToPercent(discountBps || 0)} discount
        </p>
      </div>

      <button
        onClick={() =>
          revealBid(groupAddress, discountBps!, salt! as `0x${string}`)
        }
        disabled={isPending || isConfirming || isSuccess}
        className="btn-glow w-full text-center"
        id="reveal-bid-button"
      >
        {isPending
          ? "Confirm in Wallet..."
          : isConfirming
          ? "Revealing..."
          : isSuccess
          ? "✓ Bid Revealed!"
          : "Reveal My Bid"}
      </button>

      {error && (
        <p className="text-xs text-red-400 text-center">
          {(error as Error).message?.slice(0, 100)}
        </p>
      )}
    </div>
  );
}

function DistributionPanel({
  groupAddress,
  userAddress,
}: {
  groupAddress: `0x${string}`;
  userAddress: `0x${string}`;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
        <p className="text-indigo-400 font-medium text-lg">
          🎉 Round Complete!
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Winners have been determined. Claim your dividends below.
        </p>
      </div>

      <DividendClaim groupAddress={groupAddress} userAddress={userAddress} />
    </div>
  );
}

function DividendClaim({
  groupAddress,
  userAddress,
}: {
  groupAddress: `0x${string}`;
  userAddress: `0x${string}`;
}) {
  const { data: dividend } = useDividendBalance(groupAddress, userAddress);
  const { withdraw, isPending, isConfirming, isSuccess } = useWithdrawDividend();

  const hasDividend = (dividend as bigint) && (dividend as bigint) > 0n;

  return (
    <div className="mt-4">
      {hasDividend ? (
        <div className="space-y-3">
          <div className="bg-white/[0.03] rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Claimable Dividend</p>
            <p className="text-2xl font-bold text-emerald-400">
              {formatUSDC(dividend as bigint)}
            </p>
          </div>
          <button
            onClick={() => withdraw(groupAddress)}
            disabled={isPending || isConfirming || isSuccess}
            className="btn-glow w-full text-center"
            id="claim-dividend-button"
          >
            {isPending
              ? "Confirm..."
              : isConfirming
              ? "Claiming..."
              : isSuccess
              ? "✓ Claimed!"
              : "Claim Dividend"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          No dividends to claim.
        </p>
      )}
    </div>
  );
}

function AdvancePhaseButton({
  groupAddress,
  deadline,
}: {
  groupAddress: `0x${string}`;
  deadline: number;
}) {
  const { advance, isPending, isConfirming } = useAdvancePhase();
  const { data: block } = useBlock({ watch: true });
  const chainNow = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);

  const canAdvance = chainNow >= deadline && deadline > 0;

  if (!canAdvance) return null;

  return (
    <div className="mt-6 pt-4 border-t border-white/5">
      <button
        onClick={() => advance(groupAddress)}
        disabled={isPending || isConfirming}
        className="btn-secondary w-full text-center text-sm"
        id="advance-phase-button"
      >
        {isPending || isConfirming
          ? "Advancing..."
          : "⏭ Advance to Next Phase"}
      </button>
    </div>
  );
}
