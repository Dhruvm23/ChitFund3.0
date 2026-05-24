export type GroupState = 0 | 1 | 2 | 3;
export type RoundPhase = 0 | 1 | 2 | 3;

export interface GroupInfo {
  state: GroupState;
  phase: RoundPhase;
  roundNumber: bigint;
  phaseDeadline: bigint;
  contributionAmount: bigint;
  memberCount: bigint;
  currentMemberCount: bigint;
  roundDuration: bigint;
  maxDiscountBps: bigint;
  potBalance: bigint;
  token: `0x${string}`;
  organizer: `0x${string}`;
}

export interface MemberStatus {
  member: `0x${string}`;
  hasContributed: boolean;
  hasWon: boolean;
  isDelinquent: boolean;
  missedRounds: bigint;
  dividendBalance: bigint;
}

export interface RoundResult {
  winner: `0x${string}`;
  discountBps: bigint;
  payout: bigint;
  dividendPerMember: bigint;
  totalContributed: bigint;
}
