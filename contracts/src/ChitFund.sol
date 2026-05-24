// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IChitFund } from "./interfaces/IChitFund.sol";

/**
 * @title ChitFund
 * @author Dhruv (ChitFund3)
 * @notice Decentralized chit fund protocol — one contract instance per group.
 *         Replaces the traditional foreman with immutable smart contract logic.
 *         Uses commit-reveal auction for MEV-protected bidding.
 * @dev Deployed via ChitFundFactory. All USDC interactions use SafeERC20.
 */
contract ChitFund is IChitFund, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ───────────────────────────────────────────────────────────────────

    GroupState public state;
    RoundPhase public phase;
    uint256 public roundNumber;
    uint256 public phaseDeadline;

    // ─── Config (immutable after deploy) ─────────────────────────────────────────

    IERC20 public immutable token;
    uint256 public immutable contributionAmount;
    uint256 public immutable maxMemberCount;
    uint256 public immutable roundDuration;
    uint256 public immutable maxDiscountBps;
    address public immutable organizer;

    // Phase durations (each 25% of roundDuration)
    uint256 public immutable contributionPhaseDuration;
    uint256 public immutable commitPhaseDuration;
    uint256 public immutable revealPhaseDuration;
    uint256 public immutable distributionPhaseDuration;

    // ─── Members ─────────────────────────────────────────────────────────────────

    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => bool) public hasWon;
    mapping(address => bool) public isDelinquent;
    mapping(address => uint256) public missedRounds;

    // ─── Per-round state (reset each round) ──────────────────────────────────────

    mapping(address => bool) public hasContributed;
    mapping(address => bytes32) public commitments;
    mapping(address => uint256) public revealedDiscount;
    mapping(address => bool) public hasRevealed;
    uint256 public revealCount;

    // ─── Balances ────────────────────────────────────────────────────────────────

    mapping(address => uint256) public dividendBalance;
    uint256 public potBalance;

    // ─── Governance ──────────────────────────────────────────────────────────────

    address public guardian; // Gnosis Safe or any authorized address

    // ─── Round history ───────────────────────────────────────────────────────────

    mapping(uint256 => RoundResult) public roundHistory;

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyMember() {
        require(isMember[msg.sender], "Not a member");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Not guardian");
        _;
    }

    modifier inState(GroupState _state) {
        require(state == _state, "Invalid group state");
        _;
    }

    modifier inPhase(RoundPhase _phase) {
        require(phase == _phase, "Invalid round phase");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(
        address _token,
        uint256 _contributionAmount,
        uint256 _memberCount,
        uint256 _roundDuration,
        uint256 _maxDiscountBps,
        address _organizer,
        address _guardian
    ) {
        require(_token != address(0), "Invalid token");
        require(_contributionAmount > 0, "Contribution must be > 0");
        require(_memberCount >= 2, "Need at least 2 members");
        require(_roundDuration >= 4, "Round too short"); // min 4 seconds (1 per phase)
        require(_maxDiscountBps > 0 && _maxDiscountBps <= 5000, "Discount 1-5000 bps");

        token = IERC20(_token);
        contributionAmount = _contributionAmount;
        maxMemberCount = _memberCount;
        roundDuration = _roundDuration;
        maxDiscountBps = _maxDiscountBps;
        organizer = _organizer;
        guardian = _guardian;

        // Each phase gets 25% of the round duration
        uint256 phaseDur = _roundDuration / 4;
        contributionPhaseDuration = phaseDur;
        commitPhaseDuration = phaseDur;
        revealPhaseDuration = phaseDur;
        distributionPhaseDuration = _roundDuration - (phaseDur * 3); // remainder to last phase

        state = GroupState.OPEN;
        phase = RoundPhase.CONTRIBUTION;
        roundNumber = 0;
    }

    // ─── Join / Ragequit ─────────────────────────────────────────────────────────

    /**
     * @notice Join an open chit fund group. Transfers first contribution.
     */
    function join() external nonReentrant inState(GroupState.OPEN) {
        require(!isMember[msg.sender], "Already a member");
        require(members.length < maxMemberCount, "Group is full");

        // Transfer first contribution
        token.safeTransferFrom(msg.sender, address(this), contributionAmount);
        potBalance += contributionAmount;

        isMember[msg.sender] = true;
        members.push(msg.sender);
        hasContributed[msg.sender] = true;

        emit MemberJoined(msg.sender, members.length - 1);

        // Auto-activate when full
        if (members.length == maxMemberCount) {
            state = GroupState.ACTIVE;
            roundNumber = 1;
            phase = RoundPhase.CONTRIBUTION;
            // All members already contributed for round 1 via join()
            // Mark all as contributed
            for (uint256 i = 0; i < members.length; i++) {
                hasContributed[members[i]] = true;
            }
            phaseDeadline = block.timestamp + contributionPhaseDuration;
            emit GroupActivated(block.timestamp);
        }
    }

    /**
     * @notice Leave before the group activates. Refunds first contribution.
     */
    function ragequit() external nonReentrant onlyMember inState(GroupState.OPEN) {
        isMember[msg.sender] = false;

        // Remove from members array
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == msg.sender) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }

        // Refund contribution
        potBalance -= contributionAmount;
        hasContributed[msg.sender] = false;
        token.safeTransfer(msg.sender, contributionAmount);

        emit MemberRagequit(msg.sender, contributionAmount);
    }

    // ─── Round Participation ─────────────────────────────────────────────────────

    /**
     * @notice Deposit contribution for the current round.
     */
    function contribute() external nonReentrant onlyMember inState(GroupState.ACTIVE) inPhase(RoundPhase.CONTRIBUTION) {
        require(!hasContributed[msg.sender], "Already contributed");

        token.safeTransferFrom(msg.sender, address(this), contributionAmount);
        potBalance += contributionAmount;
        hasContributed[msg.sender] = true;

        emit ContributionMade(msg.sender, roundNumber, contributionAmount);
    }

    /**
     * @notice Submit a sealed bid commitment.
     * @param commitment keccak256(abi.encodePacked(discountBps, salt))
     */
    function commitBid(bytes32 commitment) external onlyMember inState(GroupState.ACTIVE) inPhase(RoundPhase.COMMIT) {
        require(!hasWon[msg.sender], "Already won in a previous round");
        require(!isDelinquent[msg.sender], "Delinquent members cannot bid");
        require(hasContributed[msg.sender], "Must contribute first");
        require(commitments[msg.sender] == bytes32(0), "Already committed");
        require(commitment != bytes32(0), "Empty commitment");

        commitments[msg.sender] = commitment;

        emit BidCommitted(msg.sender, roundNumber);
    }

    /**
     * @notice Reveal a previously committed bid.
     * @param discountBps Discount in basis points (e.g., 2000 = 20%)
     * @param salt Random secret used in commitment
     */
    function revealBid(
        uint256 discountBps,
        bytes32 salt
    ) external onlyMember inState(GroupState.ACTIVE) inPhase(RoundPhase.REVEAL) {
        require(commitments[msg.sender] != bytes32(0), "No commitment");
        require(!hasRevealed[msg.sender], "Already revealed");
        require(discountBps <= maxDiscountBps, "Discount too high");

        bytes32 check = keccak256(abi.encodePacked(discountBps, salt));
        require(check == commitments[msg.sender], "Commitment mismatch");

        revealedDiscount[msg.sender] = discountBps;
        hasRevealed[msg.sender] = true;
        revealCount++;

        emit BidRevealed(msg.sender, roundNumber, discountBps);
    }

    /**
     * @notice Withdraw accumulated dividends.
     */
    function withdrawDividend() external nonReentrant onlyMember {
        uint256 amount = dividendBalance[msg.sender];
        require(amount > 0, "No dividend to withdraw");

        dividendBalance[msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);

        emit DividendWithdrawn(msg.sender, amount);
    }

    // ─── Phase Advancement ───────────────────────────────────────────────────────

    /**
     * @notice Advance to the next phase. Callable by anyone once the deadline passes.
     * @dev Handles distribution logic when advancing from REVEAL to DISTRIBUTION.
     */
    function advancePhase() external nonReentrant inState(GroupState.ACTIVE) {
        require(block.timestamp >= phaseDeadline, "Phase not ended yet");

        if (phase == RoundPhase.CONTRIBUTION) {
            // Check for delinquent members
            _checkDelinquencies();

            phase = RoundPhase.COMMIT;
            phaseDeadline = block.timestamp + commitPhaseDuration;
        } else if (phase == RoundPhase.COMMIT) {
            phase = RoundPhase.REVEAL;
            phaseDeadline = block.timestamp + revealPhaseDuration;
        } else if (phase == RoundPhase.REVEAL) {
            // Determine winner and distribute
            _distributeRound();

            phase = RoundPhase.DISTRIBUTION;
            phaseDeadline = block.timestamp + distributionPhaseDuration;
        } else if (phase == RoundPhase.DISTRIBUTION) {
            // Check if group is complete
            if (roundNumber >= maxMemberCount) {
                state = GroupState.COMPLETE;
                return;
            }

            // Start next round
            roundNumber++;
            _resetRoundState();
            phase = RoundPhase.CONTRIBUTION;
            phaseDeadline = block.timestamp + contributionPhaseDuration;
        }

        emit PhaseAdvanced(phase, phaseDeadline);
    }

    // ─── Governance ──────────────────────────────────────────────────────────────

    /**
     * @notice Pause the group. Freezes all deposits and auctions.
     */
    function pause() external onlyGuardian {
        require(state == GroupState.ACTIVE, "Not active");
        state = GroupState.PAUSED;
        emit GroupPaused(msg.sender);
    }

    /**
     * @notice Unpause the group. Resumes normal operation.
     */
    function unpause() external onlyGuardian {
        require(state == GroupState.PAUSED, "Not paused");
        state = GroupState.ACTIVE;
        emit GroupUnpaused(msg.sender);
    }

    /**
     * @notice Emergency exit — returns all deposits pro-rata to members.
     */
    function emergencyExit() external nonReentrant onlyGuardian {
        require(state == GroupState.ACTIVE || state == GroupState.PAUSED, "Cannot exit");

        uint256 totalBalance = token.balanceOf(address(this));
        uint256 perMember = totalBalance / members.length;
        uint256 distributed = 0;

        for (uint256 i = 0; i < members.length; i++) {
            if (i == members.length - 1) {
                // Last member gets remainder to avoid dust
                uint256 remainder = totalBalance - distributed;
                token.safeTransfer(members[i], remainder);
                distributed += remainder;
            } else {
                token.safeTransfer(members[i], perMember);
                distributed += perMember;
            }
        }

        state = GroupState.COMPLETE;
        emit EmergencyExit(totalBalance);
    }

    // ─── Internal Functions ──────────────────────────────────────────────────────

    /**
     * @dev Check which members missed contributions and update delinquency status.
     */
    function _checkDelinquencies() internal {
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (!hasContributed[member] && !hasWon[member]) {
                missedRounds[member]++;
                if (missedRounds[member] >= 2) {
                    isDelinquent[member] = true;
                }
            }
        }
    }

    /**
     * @dev Determine the round winner and distribute funds.
     *      Winner = member with highest discount bid (willing to take the biggest discount).
     *      If no valid reveals, lowest-index eligible member wins by default (0% discount).
     */
    function _distributeRound() internal {
        address winner = address(0);
        uint256 highestDiscount = 0;

        // Find highest discount bidder
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (hasRevealed[member] && revealedDiscount[member] >= highestDiscount) {
                // On tie, later index wins (last revealed with highest discount)
                if (revealedDiscount[member] > highestDiscount || winner == address(0)) {
                    highestDiscount = revealedDiscount[member];
                    winner = member;
                }
            }
        }

        // Fallback: lowest-index eligible member wins with 0% discount
        if (winner == address(0)) {
            for (uint256 i = 0; i < members.length; i++) {
                if (!hasWon[members[i]] && !isDelinquent[members[i]]) {
                    winner = members[i];
                    break;
                }
            }
            highestDiscount = 0;
        }

        require(winner != address(0), "No eligible winner");

        // Calculate payout and dividends
        uint256 totalPot = potBalance;
        uint256 discountAmount = (totalPot * highestDiscount) / 10000;
        uint256 payout = totalPot - discountAmount;

        // Winner gets payout
        hasWon[winner] = true;
        potBalance = 0;

        // Transfer payout to winner
        if (payout > 0) {
            token.safeTransfer(winner, payout);
        }

        // Distribute dividend among non-delinquent members
        uint256 dividendPerMember = 0;
        if (discountAmount > 0) {
            uint256 eligibleCount = 0;
            for (uint256 i = 0; i < members.length; i++) {
                if (!isDelinquent[members[i]]) {
                    eligibleCount++;
                }
            }
            if (eligibleCount > 0) {
                dividendPerMember = discountAmount / eligibleCount;
                uint256 totalDividends = 0;
                for (uint256 i = 0; i < members.length; i++) {
                    if (!isDelinquent[members[i]]) {
                        dividendBalance[members[i]] += dividendPerMember;
                        totalDividends += dividendPerMember;
                    }
                }
                // Any dust from division stays in contract
            }
        }

        // Store round history
        roundHistory[roundNumber] = RoundResult({
            winner: winner,
            discountBps: highestDiscount,
            payout: payout,
            dividendPerMember: dividendPerMember,
            totalContributed: totalPot
        });

        emit RoundComplete(roundNumber, winner, payout, dividendPerMember);
    }

    /**
     * @dev Reset per-round state for the next round.
     */
    function _resetRoundState() internal {
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            hasContributed[member] = false;
            commitments[member] = bytes32(0);
            revealedDiscount[member] = 0;
            hasRevealed[member] = false;
        }
        revealCount = 0;
        potBalance = 0;
    }

    // ─── View Functions ──────────────────────────────────────────────────────────

    /**
     * @notice Get the current leading bidder and their discount.
     */
    function getCurrentWinner() external view returns (address winner, uint256 discountBps) {
        uint256 highest = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (hasRevealed[members[i]] && revealedDiscount[members[i]] > highest) {
                highest = revealedDiscount[members[i]];
                winner = members[i];
            }
        }
        return (winner, highest);
    }

    /**
     * @notice Get detailed status for a specific member.
     */
    function getMemberStatus(address member) external view returns (MemberStatus memory) {
        return MemberStatus({
            member: member,
            hasContributed: hasContributed[member],
            hasWon: hasWon[member],
            isDelinquent: isDelinquent[member],
            missedRounds: missedRounds[member],
            dividendBalance: dividendBalance[member]
        });
    }

    /**
     * @notice Get group configuration and current state.
     */
    function getGroupInfo() external view returns (GroupInfo memory) {
        return GroupInfo({
            state: state,
            phase: phase,
            roundNumber: roundNumber,
            phaseDeadline: phaseDeadline,
            contributionAmount: contributionAmount,
            memberCount: maxMemberCount,
            currentMemberCount: members.length,
            roundDuration: roundDuration,
            maxDiscountBps: maxDiscountBps,
            potBalance: potBalance,
            token: address(token),
            organizer: organizer
        });
    }

    /**
     * @notice Get historical result for a completed round.
     */
    function getRoundHistory(uint256 round) external view returns (RoundResult memory) {
        return roundHistory[round];
    }

    /**
     * @notice Get all member addresses.
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    /**
     * @notice Get the total number of members in the group.
     */
    function memberCount() external view returns (uint256) {
        return members.length;
    }
}
