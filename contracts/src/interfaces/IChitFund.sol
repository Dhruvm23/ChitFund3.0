// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IChitFund
 * @notice Interface for the ChitFund protocol — one contract per chit fund group.
 */
interface IChitFund {
    // ─── Enums ───────────────────────────────────────────────────────────────────

    enum GroupState {
        OPEN,
        ACTIVE,
        PAUSED,
        COMPLETE
    }

    enum RoundPhase {
        CONTRIBUTION,
        COMMIT,
        REVEAL,
        DISTRIBUTION
    }

    // ─── Structs ─────────────────────────────────────────────────────────────────

    struct MemberStatus {
        address member;
        bool hasContributed;
        bool hasWon;
        bool isDelinquent;
        uint256 missedRounds;
        uint256 dividendBalance;
    }

    struct GroupInfo {
        GroupState state;
        RoundPhase phase;
        uint256 roundNumber;
        uint256 phaseDeadline;
        uint256 contributionAmount;
        uint256 memberCount;
        uint256 currentMemberCount;
        uint256 roundDuration;
        uint256 maxDiscountBps;
        uint256 potBalance;
        address token;
        address organizer;
    }

    struct RoundResult {
        address winner;
        uint256 discountBps;
        uint256 payout;
        uint256 dividendPerMember;
        uint256 totalContributed;
    }

    // ─── Events ──────────────────────────────────────────────────────────────────

    event MemberJoined(address indexed member, uint256 memberIndex);
    event GroupActivated(uint256 timestamp);
    event ContributionMade(address indexed member, uint256 round, uint256 amount);
    event BidCommitted(address indexed member, uint256 round);
    event BidRevealed(address indexed member, uint256 round, uint256 discountBps);
    event RoundComplete(uint256 indexed round, address winner, uint256 payout, uint256 dividend);
    event DividendWithdrawn(address indexed member, uint256 amount);
    event GroupPaused(address indexed by);
    event GroupUnpaused(address indexed by);
    event EmergencyExit(uint256 totalReturned);
    event PhaseAdvanced(RoundPhase newPhase, uint256 deadline);
    event MemberRagequit(address indexed member, uint256 refund);

    // ─── Functions ───────────────────────────────────────────────────────────────

    // Joining
    function join() external;
    function ragequit() external;

    // Round participation
    function contribute() external;
    function commitBid(bytes32 commitment) external;
    function revealBid(uint256 discountBps, bytes32 salt) external;
    function withdrawDividend() external;

    // Phase advancement
    function advancePhase() external;

    // Governance (guardian only)
    function pause() external;
    function unpause() external;
    function emergencyExit() external;

    // Views
    function getCurrentWinner() external view returns (address winner, uint256 discountBps);
    function getMemberStatus(address member) external view returns (MemberStatus memory);
    function getGroupInfo() external view returns (GroupInfo memory);
    function getRoundHistory(uint256 round) external view returns (RoundResult memory);
    function getMembers() external view returns (address[] memory);
}
