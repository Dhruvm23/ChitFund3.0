"use client";

import { useGroupInfo } from "@/hooks/useChitFund";
import { MemberList } from "@/components/MemberList";
import { RoundHistory } from "@/components/RoundHistory";
import { ActionPanel } from "@/components/ActionPanel";
import { PhaseTimer } from "@/components/PhaseTimer";
import {
  formatUSDC,
  getGroupStateName,
  getRoundPhaseName,
  getStateBadgeClass,
  getPhaseColor,
  bpsToPercent,
  formatRoundDuration,
} from "@/lib/utils";
import Link from "next/link";
import { use } from "react";

export default function GroupPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const groupAddress = address as `0x${string}`;

  const { data: info, isLoading } = useGroupInfo(groupAddress);

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-12 md:py-20 flex justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
        <p className="text-gray-400 mb-8">
          The requested chit fund group could not be found or has not been
          deployed yet.
        </p>
        <Link href="/" className="btn-glow inline-block">
          Return Home
        </Link>
      </div>
    );
  }

  const state = Number(info.state);
  const isActive = state === 1;

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* ─── Breadcrumbs & Header ──────────────────────────────────────── */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2 mb-4"
          >
            <span>←</span> Back to Groups
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                Group Dashboard
                <span className={`phase-badge ${getStateBadgeClass(state)}`}>
                  {getGroupStateName(state)}
                </span>
              </h1>
              <p className="text-sm text-gray-500 font-mono mt-2">
                Contract: {groupAddress}
              </p>
            </div>

            {/* Top Stats */}
            <div className="flex items-center gap-6 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Pot Balance</p>
                <p className="text-xl font-bold text-emerald-400">
                  {formatUSDC(info.potBalance)}
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Round</p>
                <p className="text-xl font-bold text-white">
                  {Number(info.roundNumber)} / {Number(info.memberCount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Left Column (Main Info) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Phase Banner */}
            {isActive && (
              <div
                className={`glass-card bg-gradient-to-r ${getPhaseColor(
                  Number(info.phase)
                )} border-none p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}
              >
                {/* Background glow */}
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />

                <div className="relative z-10">
                  <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">
                    Current Phase
                  </p>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {getRoundPhaseName(Number(info.phase))} Phase
                  </h2>
                  <p className="text-sm text-white/80 max-w-md">
                    {Number(info.phase) === 0 &&
                      "Members must deposit their contribution to participate in the upcoming auction."}
                    {Number(info.phase) === 1 &&
                      "Submit your sealed bid offering a discount to win the pot. Only you know your bid."}
                    {Number(info.phase) === 2 &&
                      "Reveal your previously committed bid. The highest valid discount wins."}
                    {Number(info.phase) === 3 &&
                      "The winner has been selected. Dividends are available for claiming."}
                  </p>
                </div>

                <div className="relative z-10 shrink-0 bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
                  <PhaseTimer deadline={Number(info.phaseDeadline)} />
                </div>
              </div>
            )}

            {/* Group Configuration */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Group Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Contribution
                  </p>
                  <p className="text-lg font-medium text-white">
                    {formatUSDC(info.contributionAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Max Discount
                  </p>
                  <p className="text-lg font-medium text-white">
                    {bpsToPercent(info.maxDiscountBps)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Round Duration
                  </p>
                  <p className="text-lg font-medium text-white">
                    {formatRoundDuration(Number(info.roundDuration))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">
                    Members
                  </p>
                  <p className="text-lg font-medium text-white">
                    {Number(info.currentMemberCount)} /{" "}
                    {Number(info.memberCount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Participants
                </h3>
                <span className="text-sm bg-white/5 px-3 py-1 rounded-full text-gray-400">
                  {Number(info.currentMemberCount)} joined
                </span>
              </div>
              <MemberList groupAddress={groupAddress} />
            </div>

            {/* Round History */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Round History
              </h3>
              <RoundHistory
                groupAddress={groupAddress}
                currentRound={Number(info.roundNumber)}
              />
            </div>
          </div>

          {/* ─── Right Column (Action Panel) ─────────────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24">
              <ActionPanel groupAddress={groupAddress} />

              {/* Legend/Help */}
              <div className="mt-6 glass-card p-5 border-white/5">
                <h4 className="text-sm font-semibold text-white mb-3">
                  How it works
                </h4>
                <ul className="space-y-3 text-xs text-gray-400">
                  <li className="flex gap-2">
                    <span className="text-emerald-400">1.</span>
                    <p>
                      <strong>Contribute:</strong> Deposit your monthly share
                      before the deadline.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-400">2.</span>
                    <p>
                      <strong>Commit:</strong> Secretly bid a discount. High
                      discount = higher chance to win, but less payout.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-400">3.</span>
                    <p>
                      <strong>Reveal:</strong> Verify your bid on-chain. Highest
                      revealed discount wins the pot.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400">4.</span>
                    <p>
                      <strong>Claim:</strong> The winner&apos;s discount is split
                      among everyone else as a dividend.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
