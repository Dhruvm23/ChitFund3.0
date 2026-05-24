/**
 * Format a USDC amount from raw units (6 decimals) to human-readable string.
 */
export function formatUSDC(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) / 1e6 : amount / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a raw USDC amount to a plain number string (no currency symbol).
 */
export function formatUSDCPlain(amount: bigint | number): string {
  const num = typeof amount === "bigint" ? Number(amount) / 1e6 : amount / 1e6;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Truncate an Ethereum address for display.
 */
export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Map GroupState enum to human-readable string.
 */
export const GROUP_STATES = ["Open", "Active", "Paused", "Complete"] as const;
export type GroupState = (typeof GROUP_STATES)[number];

export function getGroupStateName(state: number): GroupState {
  return GROUP_STATES[state] || "Unknown";
}

/**
 * Map RoundPhase enum to human-readable string.
 */
export const ROUND_PHASES = [
  "Contribution",
  "Commit",
  "Reveal",
  "Distribution",
] as const;
export type RoundPhase = (typeof ROUND_PHASES)[number];

export function getRoundPhaseName(phase: number): RoundPhase {
  return ROUND_PHASES[phase] || "Unknown";
}

/**
 * Phase color mapping for UI.
 */
export function getPhaseColor(phase: number): string {
  const colors = [
    "from-emerald-500 to-green-600",  // Contribution — green
    "from-amber-500 to-yellow-600",    // Commit — amber
    "from-orange-500 to-red-500",      // Reveal — orange
    "from-blue-500 to-indigo-600",     // Distribution — blue
  ];
  return colors[phase] || "from-gray-500 to-gray-600";
}

export function getPhaseColorSolid(phase: number): string {
  const colors = [
    "#10b981", // emerald
    "#f59e0b", // amber
    "#f97316", // orange
    "#6366f1", // indigo
  ];
  return colors[phase] || "#6b7280";
}

/**
 * Format seconds into human-readable duration.
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "Ended";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Format a round duration config value to display string.
 */
export function formatRoundDuration(seconds: number): string {
  const days = seconds / 86400;
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""}`;
  const hours = seconds / 3600;
  return `${hours} hour${hours > 1 ? "s" : ""}`;
}

/**
 * Convert basis points to percentage string.
 */
export function bpsToPercent(bps: number | bigint): string {
  const num = typeof bps === "bigint" ? Number(bps) : bps;
  return `${(num / 100).toFixed(1)}%`;
}

/**
 * Calculate estimated payout at a given discount.
 */
export function calculatePayout(
  totalPot: bigint,
  discountBps: number
): bigint {
  return totalPot - (totalPot * BigInt(discountBps)) / 10000n;
}

/**
 * Calculate estimated dividend per member at a given discount.
 */
export function calculateDividend(
  totalPot: bigint,
  discountBps: number,
  memberCount: number
): bigint {
  const discountAmount = (totalPot * BigInt(discountBps)) / 10000n;
  return discountAmount / BigInt(memberCount);
}

/**
 * Group state badge styling.
 */
export function getStateBadgeClass(state: number): string {
  const classes = [
    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", // Open
    "bg-blue-500/20 text-blue-400 border-blue-500/30",          // Active
    "bg-amber-500/20 text-amber-400 border-amber-500/30",       // Paused
    "bg-gray-500/20 text-gray-400 border-gray-500/30",          // Complete
  ];
  return classes[state] || classes[3];
}
