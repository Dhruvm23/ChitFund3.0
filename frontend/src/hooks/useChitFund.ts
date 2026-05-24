"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHITFUND_ABI } from "@/lib/abi/ChitFund";
import { keccak256, encodePacked } from "viem";
import type { GroupInfo, MemberStatus, RoundResult } from "@/lib/types";

// ─── Read Hooks ────────────────────────────────────────────────────────────────

export function useGroupInfo(address: `0x${string}`) {
  const result = useReadContract({
    address,
    abi: CHITFUND_ABI,
    functionName: "getGroupInfo",
  });
  return { ...result, data: result.data as GroupInfo | undefined };
}

export function useMembers(address: `0x${string}`) {
  const result = useReadContract({
    address,
    abi: CHITFUND_ABI,
    functionName: "getMembers",
  });
  return { ...result, data: result.data as `0x${string}`[] | undefined };
}

export function useMemberStatus(groupAddress: `0x${string}`, memberAddress: `0x${string}`) {
  const result = useReadContract({
    address: groupAddress,
    abi: CHITFUND_ABI,
    functionName: "getMemberStatus",
    args: [memberAddress],
    query: {
      enabled: !!memberAddress && memberAddress !== "0x0000000000000000000000000000000000000000",
    },
  });
  return { ...result, data: result.data as MemberStatus | undefined };
}

export function usePotBalance(address: `0x${string}`) {
  const result = useReadContract({
    address,
    abi: CHITFUND_ABI,
    functionName: "potBalance",
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useCurrentWinner(address: `0x${string}`) {
  const result = useReadContract({
    address,
    abi: CHITFUND_ABI,
    functionName: "getCurrentWinner",
  });
  return {
    ...result,
    data: result.data as readonly [`0x${string}`, bigint] | undefined,
  };
}

export function useRoundHistory(address: `0x${string}`, round: number) {
  const result = useReadContract({
    address,
    abi: CHITFUND_ABI,
    functionName: "getRoundHistory",
    args: [BigInt(round)],
    query: {
      enabled: round > 0,
    },
  });
  return { ...result, data: result.data as RoundResult | undefined };
}

export function useDividendBalance(groupAddress: `0x${string}`, memberAddress: `0x${string}`) {
  const result = useReadContract({
    address: groupAddress,
    abi: CHITFUND_ABI,
    functionName: "dividendBalance",
    args: [memberAddress],
    query: {
      enabled: !!memberAddress && memberAddress !== "0x0000000000000000000000000000000000000000",
    },
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useIsMember(groupAddress: `0x${string}`, memberAddress: `0x${string}`) {
  const result = useReadContract({
    address: groupAddress,
    abi: CHITFUND_ABI,
    functionName: "isMember",
    args: [memberAddress],
    query: {
      enabled: !!memberAddress && memberAddress !== "0x0000000000000000000000000000000000000000",
    },
  });
  return { ...result, data: result.data as boolean | undefined };
}

// ─── Write Hooks ───────────────────────────────────────────────────────────────

export function useJoinGroup() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  const join = (groupAddress: `0x${string}`) => {
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "join",
    });
  };

  return {
    join,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isReceiptError,
    error: error ?? receiptError,
  };
}

export function useContribute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contribute = (groupAddress: `0x${string}`) => {
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "contribute",
    });
  };

  return { contribute, hash, isPending, isConfirming, isSuccess, error };
}

export function useCommitBid() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const commitBid = (groupAddress: `0x${string}`, discountBps: number, salt: `0x${string}`) => {
    const commitment = keccak256(
      encodePacked(["uint256", "bytes32"], [BigInt(discountBps), salt])
    );
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "commitBid",
      args: [commitment],
    });
  };

  return { commitBid, hash, isPending, isConfirming, isSuccess, error };
}

export function useRevealBid() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revealBid = (groupAddress: `0x${string}`, discountBps: number, salt: `0x${string}`) => {
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "revealBid",
      args: [BigInt(discountBps), salt],
    });
  };

  return { revealBid, hash, isPending, isConfirming, isSuccess, error };
}

export function useWithdrawDividend() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (groupAddress: `0x${string}`) => {
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "withdrawDividend",
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

export function useAdvancePhase() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const advance = (groupAddress: `0x${string}`) => {
    writeContract({
      address: groupAddress,
      abi: CHITFUND_ABI,
      functionName: "advancePhase",
    });
  };

  return { advance, hash, isPending, isConfirming, isSuccess, error };
}

/**
 * Generate a random salt for bid commitment.
 */
export function generateSalt(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}
