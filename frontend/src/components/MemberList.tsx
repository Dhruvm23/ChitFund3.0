"use client";

import { useEnsName } from "wagmi";
import { useMembers, useMemberStatus } from "@/hooks/useChitFund";
import { truncateAddress } from "@/lib/utils";

interface MemberListProps {
  groupAddress: `0x${string}`;
}

export function MemberList({ groupAddress }: MemberListProps) {
  const { data: members, isLoading } = useMembers(groupAddress);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg shimmer" />
        ))}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member, index) => (
        <MemberRow
          key={member}
          groupAddress={groupAddress}
          memberAddress={member}
          index={index}
        />
      ))}
    </div>
  );
}

function MemberRow({
  groupAddress,
  memberAddress,
  index,
}: {
  groupAddress: `0x${string}`;
  memberAddress: `0x${string}`;
  index: number;
}) {
  const { data: status } = useMemberStatus(groupAddress, memberAddress);
  const { data: ensName } = useEnsName({ address: memberAddress, chainId: 1 });

  const displayName = ensName || truncateAddress(memberAddress);

  return (
    <div className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-3 transition-colors">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300 truncate">{displayName}</p>
        {ensName && (
          <p className="text-xs text-gray-500 font-mono truncate">
            {truncateAddress(memberAddress)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {status?.hasContributed && (
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full" title="Contributed">
            ✓
          </span>
        )}
        {status?.hasWon && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full" title="Won a round">
            🏆
          </span>
        )}
        {status?.isDelinquent && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full" title="Delinquent">
            ⚠
          </span>
        )}
      </div>
    </div>
  );
}
