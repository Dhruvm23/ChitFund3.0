"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useActiveGroups, useGroupsByOrganizer } from "@/hooks/useGroupList";
import {
  useIsMember,
  useDividendBalance,
  useGroupInfo,
  useMemberStatus,
} from "@/hooks/useChitFund";
import { useSaltStorage } from "@/hooks/useSaltStorage";
import { GroupCard } from "@/components/GroupCard";
import { CHITFUND_ABI } from "@/lib/abi/ChitFund";
import { formatUSDC, getRoundPhaseName } from "@/lib/utils";
import { contractsDeployed } from "@/lib/addresses";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMemo } from "react";
import type { Abi } from "viem";

export default function DashboardPage() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { data: allGroups, isLoading: isLoadingGroups } = useActiveGroups();

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <span className="text-3xl">👛</span>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-white">Wallet Not Connected</h1>
        <p className="text-gray-400 max-w-md mb-8">
          Connect your wallet to view your groups, pending actions, and claimable dividends.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (mounted && !contractsDeployed()) {
    return (
      <div className="min-h-screen px-6 py-20 text-center max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Contracts Not Configured</h1>
        <p className="text-gray-400 mb-6">
          Run <code className="text-purple-300">./scripts/deploy-local.sh</code> and restart{" "}
          <code className="text-purple-300">npm run dev</code>.
        </p>
        <Link href="/" className="btn-glow inline-block">
          Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Member Dashboard
            </span>
          </h1>
          <p className="text-gray-400">Your active chit funds, pending actions, and dividends.</p>
        </div>

        {isLoadingGroups ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
          </div>
        ) : (
          <DashboardContent userAddress={address} allGroups={allGroups || []} />
        )}
      </div>
    </div>
  );
}

function DashboardContent({
  userAddress,
  allGroups,
}: {
  userAddress: `0x${string}`;
  allGroups: readonly `0x${string}`[];
}) {
  const { data: organizerGroups } = useGroupsByOrganizer(userAddress);
  const createdGroups = organizerGroups ?? [];

  const dashboardGroups = useMemo(() => {
    const merged = new Set<`0x${string}`>([...createdGroups, ...allGroups]);
    return Array.from(merged);
  }, [createdGroups, allGroups]);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Groups Created</p>
          <p className="stat-value">{createdGroups.length}</p>
        </div>
        <div className="stat-card md:col-span-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Total Claimable Dividends
          </p>
          <TotalDividends groups={dashboardGroups} userAddress={userAddress} />
        </div>
      </div>

      <PendingActionsSection groups={dashboardGroups} userAddress={userAddress} />

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">My Groups</h2>
        <MyGroupsSection
          createdGroups={createdGroups}
          allGroups={allGroups}
          userAddress={userAddress}
        />
      </div>
    </div>
  );
}

function TotalDividends({
  groups,
  userAddress,
}: {
  groups: readonly `0x${string}`[];
  userAddress: `0x${string}`;
}) {
  const { data, isLoading } = useReadContracts({
    contracts: groups.map((group) => ({
      address: group,
      abi: CHITFUND_ABI as Abi,
      functionName: "dividendBalance",
      args: [userAddress],
    })),
    query: { enabled: groups.length > 0 },
  });

  const total = useMemo(() => {
    if (!data) return 0n;
    return data.reduce((sum, result) => {
      if (result.status === "success" && typeof result.result === "bigint") {
        return sum + result.result;
      }
      return sum;
    }, 0n);
  }, [data]);

  if (isLoading && groups.length > 0) {
    return <div className="h-10 w-48 rounded shimmer" />;
  }

  return (
    <div className="flex items-end justify-between">
      <p className="stat-value text-emerald-400">{formatUSDC(total)}</p>
      {total > 0n && <p className="text-sm text-gray-400 mb-2">Across all groups</p>}
    </div>
  );
}

function PendingActionsSection({
  groups,
  userAddress,
}: {
  groups: readonly `0x${string}`[];
  userAddress: `0x${string}`;
}) {
  if (groups.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">Pending Actions</h2>
      <div className="space-y-3">
        {groups.map((group) => (
          <PendingActionRow key={group} groupAddress={group} userAddress={userAddress} />
        ))}
      </div>
    </div>
  );
}

function PendingActionRow({
  groupAddress,
  userAddress,
}: {
  groupAddress: `0x${string}`;
  userAddress: `0x${string}`;
}) {
  const { data: isMember } = useIsMember(groupAddress, userAddress);
  const { data: info } = useGroupInfo(groupAddress);
  const { data: status } = useMemberStatus(groupAddress, userAddress);
  const roundNumber = info ? Number(info.roundNumber) : 0;
  const { hasSalt } = useSaltStorage(groupAddress, roundNumber, userAddress);
  const { data: dividend } = useDividendBalance(groupAddress, userAddress);

  if (!isMember || !info || Number(info.state) !== 1) return null;

  const phase = Number(info.phase);
  let action: string | null = null;

  if (phase === 0 && !status?.hasContributed) {
    action = "Contribute for this round";
  } else if (phase === 1 && !hasSalt && !status?.hasWon && !status?.isDelinquent) {
    action = "Commit your sealed bid";
  } else if (phase === 2 && hasSalt) {
    action = "Reveal your bid";
  } else if ((dividend ?? 0n) > 0n) {
    action = `Claim ${formatUSDC(dividend!)} dividend`;
  }

  if (!action) return null;

  return (
    <Link
      href={`/group/${groupAddress}`}
      className="glass-card flex items-center justify-between p-4 hover:border-purple-500/30 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-white">{action}</p>
        <p className="text-xs text-gray-500 font-mono mt-1">
          {groupAddress.slice(0, 10)}... — {getRoundPhaseName(phase)} phase
        </p>
      </div>
      <span className="text-purple-400 text-sm">Go →</span>
    </Link>
  );
}

function MyGroupsSection({
  createdGroups,
  allGroups,
  userAddress,
}: {
  createdGroups: readonly `0x${string}`[];
  allGroups: readonly `0x${string}`[];
  userAddress: `0x${string}`;
}) {
  const createdSet = useMemo(() => new Set(createdGroups), [createdGroups]);
  const otherGroups = allGroups.filter((g) => !createdSet.has(g));

  if (createdGroups.length === 0 && allGroups.length === 0) {
    return (
      <div className="glass-card p-12 text-center border-white/5">
        <p className="text-gray-400 mb-6">No active chit fund groups yet.</p>
        <Link href="/create" className="btn-glow inline-block mr-4">
          Create a Group
        </Link>
        <Link href="/#groups" className="text-purple-400 hover:text-purple-300">
          Browse Open Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {createdGroups.map((group) => (
        <div key={group} className="relative">
          <GroupCard address={group} />
          <span className="absolute top-4 right-4 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
            Organizer
          </span>
        </div>
      ))}
      {otherGroups.map((group) => (
        <MemberGroupCard key={group} groupAddress={group} userAddress={userAddress} />
      ))}
    </div>
  );
}

function MemberGroupCard({
  groupAddress,
  userAddress,
}: {
  groupAddress: `0x${string}`;
  userAddress: `0x${string}`;
}) {
  const { data: isMember, isLoading } = useIsMember(groupAddress, userAddress);

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-32 rounded shimmer" />
        <div className="h-24 rounded-lg shimmer" />
      </div>
    );
  }

  if (!isMember) return null;

  return <GroupCard address={groupAddress} />;
}
