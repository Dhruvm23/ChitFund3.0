"use client";

import Link from "next/link";
import { useGroupInfo } from "@/hooks/useChitFund";
import {
  formatUSDC,
  getGroupStateName,
  getRoundPhaseName,
  getStateBadgeClass,
  getPhaseColor,
  formatRoundDuration,
  bpsToPercent,
} from "@/lib/utils";
import { PhaseTimer } from "./PhaseTimer";

interface GroupCardProps {
  address: `0x${string}`;
}

export function GroupCard({ address }: GroupCardProps) {
  const { data: info, isLoading } = useGroupInfo(address);

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="h-5 w-32 rounded shimmer" />
        <div className="h-4 w-48 rounded shimmer" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-16 rounded-lg shimmer" />
          <div className="h-16 rounded-lg shimmer" />
        </div>
        <div className="h-10 rounded-lg shimmer mt-2" />
      </div>
    );
  }

  if (!info) return null;

  const spotsLeft =
    Number(info.memberCount) - Number(info.currentMemberCount);
  const isOpen = Number(info.state) === 0;
  const isActive = Number(info.state) === 1;

  return (
    <Link href={`/group/${address}`}>
      <div className="glass-card gradient-border p-6 cursor-pointer group h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
              Chit Fund Group
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">
              {address.slice(0, 10)}...{address.slice(-6)}
            </p>
          </div>
          <span
            className={`phase-badge ${getStateBadgeClass(Number(info.state))}`}
          >
            {getGroupStateName(Number(info.state))}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
          <div className="bg-white/[0.03] rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Contribution
            </p>
            <p className="text-lg font-bold text-white">
              {formatUSDC(info.contributionAmount)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Members
            </p>
            <p className="text-lg font-bold text-white">
              {Number(info.currentMemberCount)}/{Number(info.memberCount)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Max Discount
            </p>
            <p className="text-lg font-bold text-white">
              {bpsToPercent(info.maxDiscountBps)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Round Duration
            </p>
            <p className="text-lg font-bold text-white">
              {formatRoundDuration(Number(info.roundDuration))}
            </p>
          </div>
        </div>

        {/* Phase Info (only for active groups) */}
        {isActive && (
          <div className="mt-auto">
            <div
              className={`bg-gradient-to-r ${getPhaseColor(
                Number(info.phase)
              )} rounded-lg p-3 text-center`}
            >
              <p className="text-xs font-medium opacity-80">
                Round {Number(info.roundNumber)} —{" "}
                {getRoundPhaseName(Number(info.phase))} Phase
              </p>
              <PhaseTimer deadline={Number(info.phaseDeadline)} compact />
            </div>
          </div>
        )}

        {/* Open badge */}
        {isOpen && (
          <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-emerald-400">
              🟢 {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
