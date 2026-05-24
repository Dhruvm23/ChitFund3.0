// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console } from "forge-std/Test.sol";
import { ChitFund } from "../src/ChitFund.sol";
import { ChitFundFactory } from "../src/ChitFundFactory.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { IChitFund } from "../src/interfaces/IChitFund.sol";

/**
 * @title ChitFundTest
 * @notice Comprehensive test suite for the ChitFund protocol.
 */
contract ChitFundTest is Test {
    ChitFund public chitFund;
    ChitFundFactory public factory;
    MockUSDC public usdc;

    // Test accounts
    address public organizer = makeAddr("organizer");
    address public guardian = makeAddr("guardian");
    address[] public memberAddrs;

    // Config
    uint256 public constant CONTRIBUTION = 100e6; // 100 USDC
    uint256 public constant MEMBER_COUNT = 5;
    uint256 public constant ROUND_DURATION = 28 days;
    uint256 public constant MAX_DISCOUNT_BPS = 3000; // 30%
    uint256 public constant PHASE_DURATION = 7 days; // 28/4

    function setUp() public {
        // Deploy MockUSDC
        usdc = new MockUSDC();

        // Deploy ChitFund directly (not via factory) for unit tests
        chitFund = new ChitFund(
            address(usdc),
            CONTRIBUTION,
            MEMBER_COUNT,
            ROUND_DURATION,
            MAX_DISCOUNT_BPS,
            organizer,
            guardian
        );

        // Setup test members
        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            address member = makeAddr(string(abi.encodePacked("member", vm.toString(i))));
            memberAddrs.push(member);
            // Give each member USDC
            usdc.faucet(member, 100_000e6);
        }

        // Give organizer USDC too
        usdc.faucet(organizer, 100_000e6);
    }

    // ─── Helper Functions ────────────────────────────────────────────────────────

    function _approveAndJoin(address member) internal {
        vm.startPrank(member);
        usdc.approve(address(chitFund), type(uint256).max);
        chitFund.join();
        vm.stopPrank();
    }

    function _fillGroup() internal {
        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            _approveAndJoin(memberAddrs[i]);
        }
    }

    function _contributeAll() internal {
        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            vm.prank(memberAddrs[i]);
            chitFund.contribute();
        }
    }

    function _commitBid(address member, uint256 discountBps, bytes32 salt) internal {
        bytes32 commitment = keccak256(abi.encodePacked(discountBps, salt));
        vm.prank(member);
        chitFund.commitBid(commitment);
    }

    function _revealBid(address member, uint256 discountBps, bytes32 salt) internal {
        vm.prank(member);
        chitFund.revealBid(discountBps, salt);
    }

    // ─── Join Tests ──────────────────────────────────────────────────────────────

    function test_JoinGroup_Success() public {
        uint256 balanceBefore = usdc.balanceOf(memberAddrs[0]);

        _approveAndJoin(memberAddrs[0]);

        assertTrue(chitFund.isMember(memberAddrs[0]));
        assertEq(usdc.balanceOf(memberAddrs[0]), balanceBefore - CONTRIBUTION);
        assertEq(chitFund.potBalance(), CONTRIBUTION);
    }

    function test_JoinGroup_EmitsMemberJoined() public {
        vm.startPrank(memberAddrs[0]);
        usdc.approve(address(chitFund), type(uint256).max);

        vm.expectEmit(true, false, false, true);
        emit IChitFund.MemberJoined(memberAddrs[0], 0);
        chitFund.join();
        vm.stopPrank();
    }

    function test_JoinGroup_AutoActivatesWhenFull() public {
        _fillGroup();

        assertEq(uint256(chitFund.state()), uint256(IChitFund.GroupState.ACTIVE));
        assertEq(chitFund.roundNumber(), 1);
    }

    function test_JoinGroup_Reverts_WhenFull() public {
        _fillGroup();

        address extraMember = makeAddr("extra");
        usdc.faucet(extraMember, 100_000e6);

        vm.startPrank(extraMember);
        usdc.approve(address(chitFund), type(uint256).max);
        vm.expectRevert("Invalid group state");
        chitFund.join();
        vm.stopPrank();
    }

    function test_JoinGroup_Reverts_WhenAlreadyMember() public {
        _approveAndJoin(memberAddrs[0]);

        vm.startPrank(memberAddrs[0]);
        vm.expectRevert("Already a member");
        chitFund.join();
        vm.stopPrank();
    }

    function test_JoinGroup_Reverts_WhenActive() public {
        _fillGroup();

        address newMember = makeAddr("new");
        usdc.faucet(newMember, 100_000e6);
        vm.startPrank(newMember);
        usdc.approve(address(chitFund), type(uint256).max);
        vm.expectRevert("Invalid group state");
        chitFund.join();
        vm.stopPrank();
    }

    // ─── Ragequit Tests ─────────────────────────────────────────────────────────

    function test_Ragequit_Success() public {
        _approveAndJoin(memberAddrs[0]);
        uint256 balanceBefore = usdc.balanceOf(memberAddrs[0]);

        vm.prank(memberAddrs[0]);
        chitFund.ragequit();

        assertFalse(chitFund.isMember(memberAddrs[0]));
        assertEq(usdc.balanceOf(memberAddrs[0]), balanceBefore + CONTRIBUTION);
    }

    function test_Ragequit_Reverts_WhenActive() public {
        _fillGroup();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Invalid group state");
        chitFund.ragequit();
    }

    // ─── Contribute Tests ────────────────────────────────────────────────────────

    function test_Contribute_Success() public {
        _fillGroup();

        // Advance to next round (skip first round phases to get to round 2)
        // In round 1, all members already contributed via join()
        // Advance through all 4 phases to start round 2
        vm.warp(block.timestamp + PHASE_DURATION); // end contribution
        chitFund.advancePhase(); // -> COMMIT

        vm.warp(block.timestamp + PHASE_DURATION); // end commit
        chitFund.advancePhase(); // -> REVEAL

        vm.warp(block.timestamp + PHASE_DURATION); // end reveal (distribution happens)
        chitFund.advancePhase(); // -> DISTRIBUTION

        vm.warp(block.timestamp + PHASE_DURATION); // end distribution
        chitFund.advancePhase(); // -> CONTRIBUTION (round 2)

        // Now contribute in round 2
        vm.prank(memberAddrs[0]);
        chitFund.contribute();

        assertTrue(chitFund.hasContributed(memberAddrs[0]));
    }

    function test_Contribute_Reverts_WhenAlreadyContributed() public {
        _fillGroup();

        // Round 1: all already contributed via join(), advance to round 2
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        vm.prank(memberAddrs[0]);
        chitFund.contribute();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Already contributed");
        chitFund.contribute();
    }

    function test_Contribute_Reverts_WrongPhase() public {
        _fillGroup();

        // Advance to COMMIT phase
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Invalid round phase");
        chitFund.contribute();
    }

    // ─── Commit Bid Tests ────────────────────────────────────────────────────────

    function test_CommitBid_Success() public {
        _fillGroup();

        // Advance to COMMIT phase
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("salt1");
        uint256 discount = 2000; // 20%
        _commitBid(memberAddrs[0], discount, salt);

        assertTrue(chitFund.commitments(memberAddrs[0]) != bytes32(0));
    }

    function test_CommitBid_Reverts_IfAlreadyWon() public {
        _fillGroup();

        // Run round 1 with member0 winning
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT

        bytes32 salt = keccak256("salt1");
        _commitBid(memberAddrs[0], 2000, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL

        _revealBid(memberAddrs[0], 2000, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> DISTRIBUTION (member0 wins)

        // Start round 2
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> CONTRIBUTION

        // Contribute for round 2
        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            vm.prank(memberAddrs[i]);
            chitFund.contribute();
        }

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT

        // member0 already won, should not be able to commit
        bytes32 salt2 = keccak256("salt2");
        bytes32 commitment = keccak256(abi.encodePacked(uint256(1000), salt2));
        vm.prank(memberAddrs[0]);
        vm.expectRevert("Already won in a previous round");
        chitFund.commitBid(commitment);
    }

    function test_CommitBid_Reverts_WrongPhase() public {
        _fillGroup();

        bytes32 salt = keccak256("salt1");
        bytes32 commitment = keccak256(abi.encodePacked(uint256(2000), salt));

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Invalid round phase");
        chitFund.commitBid(commitment);
    }

    // ─── Reveal Bid Tests ────────────────────────────────────────────────────────

    function test_RevealBid_Success() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT

        bytes32 salt = keccak256("mySalt");
        uint256 discount = 1500; // 15%
        _commitBid(memberAddrs[0], discount, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL

        _revealBid(memberAddrs[0], discount, salt);

        assertTrue(chitFund.hasRevealed(memberAddrs[0]));
        assertEq(chitFund.revealedDiscount(memberAddrs[0]), discount);
    }

    function test_RevealBid_Reverts_BadSalt() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("mySalt");
        _commitBid(memberAddrs[0], 1500, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 wrongSalt = keccak256("wrongSalt");
        vm.prank(memberAddrs[0]);
        vm.expectRevert("Commitment mismatch");
        chitFund.revealBid(1500, wrongSalt);
    }

    function test_RevealBid_Reverts_ExceedsMaxDiscount() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("salt");
        uint256 tooHigh = MAX_DISCOUNT_BPS + 1;
        bytes32 commitment = keccak256(abi.encodePacked(tooHigh, salt));

        vm.prank(memberAddrs[0]);
        chitFund.commitBid(commitment);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Discount too high");
        chitFund.revealBid(tooHigh, salt);
    }

    // ─── Phase Advancement Tests ─────────────────────────────────────────────────

    function test_AdvancePhase_Contribution_To_Commit() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        assertEq(uint256(chitFund.phase()), uint256(IChitFund.RoundPhase.COMMIT));
    }

    function test_AdvancePhase_Commit_To_Reveal() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        assertEq(uint256(chitFund.phase()), uint256(IChitFund.RoundPhase.REVEAL));
    }

    function test_AdvancePhase_Reveal_To_Distribution() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        assertEq(uint256(chitFund.phase()), uint256(IChitFund.RoundPhase.DISTRIBUTION));
    }

    function test_AdvancePhase_Reverts_BeforeDeadline() public {
        _fillGroup();

        vm.expectRevert("Phase not ended yet");
        chitFund.advancePhase();
    }

    // ─── Distribution Tests ──────────────────────────────────────────────────────

    function test_Distribution_CorrectWinner() public {
        _fillGroup();

        // Advance to COMMIT
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        // Member 0 bids 20%, Member 1 bids 25%
        bytes32 salt0 = keccak256("salt0");
        bytes32 salt1 = keccak256("salt1");
        _commitBid(memberAddrs[0], 2000, salt0);
        _commitBid(memberAddrs[1], 2500, salt1);

        // Advance to REVEAL
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        _revealBid(memberAddrs[0], 2000, salt0);
        _revealBid(memberAddrs[1], 2500, salt1);

        // Advance to DISTRIBUTION
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        // Member 1 should win (higher discount = more willing to sacrifice)
        IChitFund.RoundResult memory result = chitFund.getRoundHistory(1);
        assertEq(result.winner, memberAddrs[1]);
        assertEq(result.discountBps, 2500);
    }

    function test_Distribution_CorrectDividend() public {
        _fillGroup();

        uint256 totalPot = CONTRIBUTION * MEMBER_COUNT;

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("salt");
        _commitBid(memberAddrs[0], 2000, salt); // 20% discount

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        _revealBid(memberAddrs[0], 2000, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        IChitFund.RoundResult memory result = chitFund.getRoundHistory(1);

        // Payout = totalPot - (totalPot * 2000 / 10000) = totalPot * 80%
        uint256 expectedPayout = totalPot - (totalPot * 2000 / 10000);
        assertEq(result.payout, expectedPayout);

        // Dividend = discount / memberCount
        uint256 discountAmount = totalPot * 2000 / 10000;
        uint256 expectedDividend = discountAmount / MEMBER_COUNT;
        assertEq(result.dividendPerMember, expectedDividend);
    }

    function test_Distribution_FallbackWinner_NoReveals() public {
        _fillGroup();

        // No one bids — advance through all phases
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> DISTRIBUTION

        IChitFund.RoundResult memory result = chitFund.getRoundHistory(1);

        // Fallback: first eligible member wins with 0% discount
        assertEq(result.winner, memberAddrs[0]);
        assertEq(result.discountBps, 0);
        assertEq(result.payout, CONTRIBUTION * MEMBER_COUNT); // full pot
    }

    // ─── Withdraw Tests ──────────────────────────────────────────────────────────

    function test_WithdrawDividend_Success() public {
        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("salt");
        _commitBid(memberAddrs[0], 2000, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        _revealBid(memberAddrs[0], 2000, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        // Non-winner members should have dividends
        uint256 dividendBal = chitFund.dividendBalance(memberAddrs[1]);
        assertTrue(dividendBal > 0);

        uint256 usdcBefore = usdc.balanceOf(memberAddrs[1]);

        vm.prank(memberAddrs[1]);
        chitFund.withdrawDividend();

        assertEq(usdc.balanceOf(memberAddrs[1]), usdcBefore + dividendBal);
        assertEq(chitFund.dividendBalance(memberAddrs[1]), 0);
    }

    function test_WithdrawDividend_Reverts_NoDividend() public {
        _fillGroup();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("No dividend to withdraw");
        chitFund.withdrawDividend();
    }

    // ─── Governance Tests ────────────────────────────────────────────────────────

    function test_Pause_Success() public {
        _fillGroup();

        vm.prank(guardian);
        chitFund.pause();

        assertEq(uint256(chitFund.state()), uint256(IChitFund.GroupState.PAUSED));
    }

    function test_Pause_Reverts_NotGuardian() public {
        _fillGroup();

        vm.prank(memberAddrs[0]);
        vm.expectRevert("Not guardian");
        chitFund.pause();
    }

    function test_Unpause_Success() public {
        _fillGroup();

        vm.prank(guardian);
        chitFund.pause();

        vm.prank(guardian);
        chitFund.unpause();

        assertEq(uint256(chitFund.state()), uint256(IChitFund.GroupState.ACTIVE));
    }

    function test_EmergencyExit_ReturnsProRata() public {
        _fillGroup();

        uint256 totalBalance = usdc.balanceOf(address(chitFund));
        uint256 perMember = totalBalance / MEMBER_COUNT;

        uint256[] memory balancesBefore = new uint256[](MEMBER_COUNT);
        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            balancesBefore[i] = usdc.balanceOf(memberAddrs[i]);
        }

        vm.prank(guardian);
        chitFund.emergencyExit();

        for (uint256 i = 0; i < MEMBER_COUNT; i++) {
            uint256 received = usdc.balanceOf(memberAddrs[i]) - balancesBefore[i];
            assertGe(received, perMember - 1); // allow 1 wei dust
            assertLe(received, perMember + 1);
        }

        assertEq(uint256(chitFund.state()), uint256(IChitFund.GroupState.COMPLETE));
    }

    // ─── Full Round E2E Test ─────────────────────────────────────────────────────

    function test_FullRound_E2E() public {
        _fillGroup();

        // Round 1: Member 2 bids 25% and wins
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT

        bytes32 salt0 = keccak256("salt0");
        bytes32 salt2 = keccak256("salt2");
        _commitBid(memberAddrs[0], 1000, salt0); // 10%
        _commitBid(memberAddrs[2], 2500, salt2); // 25%

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL

        _revealBid(memberAddrs[0], 1000, salt0);
        _revealBid(memberAddrs[2], 2500, salt2);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> DISTRIBUTION

        // Verify winner
        IChitFund.RoundResult memory r1 = chitFund.getRoundHistory(1);
        assertEq(r1.winner, memberAddrs[2]);
        assertTrue(chitFund.hasWon(memberAddrs[2]));

        // Verify round number advanced
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> CONTRIBUTION round 2
        assertEq(chitFund.roundNumber(), 2);
    }

    // ─── Fuzz Tests ──────────────────────────────────────────────────────────────

    function testFuzz_CommitReveal(uint256 discountBps, bytes32 salt) public {
        discountBps = bound(discountBps, 0, MAX_DISCOUNT_BPS);
        vm.assume(salt != bytes32(0));

        _fillGroup();

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 commitment = keccak256(abi.encodePacked(discountBps, salt));
        vm.prank(memberAddrs[0]);
        chitFund.commitBid(commitment);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        vm.prank(memberAddrs[0]);
        chitFund.revealBid(discountBps, salt);

        assertTrue(chitFund.hasRevealed(memberAddrs[0]));
        assertEq(chitFund.revealedDiscount(memberAddrs[0]), discountBps);
    }

    function testFuzz_PayoutPlusDividendEqualsPot(uint256 discountBps) public {
        discountBps = bound(discountBps, 1, MAX_DISCOUNT_BPS);

        _fillGroup();

        uint256 totalPot = CONTRIBUTION * MEMBER_COUNT;

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        bytes32 salt = keccak256("fuzzSalt");
        _commitBid(memberAddrs[0], discountBps, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        _revealBid(memberAddrs[0], discountBps, salt);

        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        IChitFund.RoundResult memory result = chitFund.getRoundHistory(1);

        // payout + (dividend * memberCount) should be <= totalPot (dust allowed)
        uint256 totalDistributed = result.payout + (result.dividendPerMember * MEMBER_COUNT);
        assertLe(totalDistributed, totalPot);
        // Should be very close (within MEMBER_COUNT dust from integer division)
        assertGe(totalDistributed, totalPot - MEMBER_COUNT);
    }

    // ─── Delinquency Test ────────────────────────────────────────────────────────

    function test_CommitBid_Reverts_IfDelinquent() public {
        _fillGroup();

        // Round 1: member[1] wins so member[0] remains eligible for delinquency tracking
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        bytes32 salt1 = keccak256("r1");
        _commitBid(memberAddrs[1], 2000, salt1);
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        _revealBid(memberAddrs[1], 2000, salt1);
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        // Round 2: member[0] skips contribution
        for (uint256 i = 1; i < MEMBER_COUNT; i++) {
            vm.prank(memberAddrs[i]);
            chitFund.contribute();
        }
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // missedRounds[0] = 1

        // Round 2 auction: member[2] wins (avoid fallback giving member[0] the pot)
        bytes32 salt2 = keccak256("r2");
        _commitBid(memberAddrs[2], 2500, salt2);
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        _revealBid(memberAddrs[2], 2500, salt2);
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase();

        // Round 3: member[0] skips again
        for (uint256 i = 1; i < MEMBER_COUNT; i++) {
            if (!chitFund.hasWon(memberAddrs[i])) {
                vm.prank(memberAddrs[i]);
                chitFund.contribute();
            }
        }
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // missedRounds[0] = 2, delinquent

        assertTrue(chitFund.isDelinquent(memberAddrs[0]));

        bytes32 salt = keccak256("delinquentSalt");
        bytes32 commitment = keccak256(abi.encodePacked(uint256(1000), salt));
        vm.prank(memberAddrs[0]);
        vm.expectRevert("Delinquent members cannot bid");
        chitFund.commitBid(commitment);
    }

    // ─── Full Group E2E ──────────────────────────────────────────────────────────

    function test_FullGroup_AllRounds_E2E() public {
        _fillGroup();

        for (uint256 r = 0; r < MEMBER_COUNT; r++) {
            uint256 winnerIdx = r;

            if (r > 0) {
                // Contribute for rounds 2+
                for (uint256 i = 0; i < MEMBER_COUNT; i++) {
                    if (!chitFund.hasWon(memberAddrs[i])) {
                        vm.prank(memberAddrs[i]);
                        chitFund.contribute();
                    }
                }
            }

            vm.warp(block.timestamp + PHASE_DURATION);
            chitFund.advancePhase(); // -> COMMIT

            // Winner bids highest discount among those who haven't won
            bytes32 salt = keccak256(abi.encodePacked("round", r));
            _commitBid(memberAddrs[winnerIdx], 2000 + uint256(r * 100), salt);

            vm.warp(block.timestamp + PHASE_DURATION);
            chitFund.advancePhase(); // -> REVEAL

            _revealBid(memberAddrs[winnerIdx], 2000 + uint256(r * 100), salt);

            vm.warp(block.timestamp + PHASE_DURATION);
            chitFund.advancePhase(); // -> DISTRIBUTION

            assertTrue(chitFund.hasWon(memberAddrs[winnerIdx]));

            vm.warp(block.timestamp + PHASE_DURATION);
            chitFund.advancePhase(); // -> next round or COMPLETE
        }

        assertEq(uint256(chitFund.state()), uint256(IChitFund.GroupState.COMPLETE));
        assertEq(chitFund.roundNumber(), MEMBER_COUNT);
    }

    // ─── Internal Helpers for E2E ────────────────────────────────────────────────

    function _advanceFullRound() internal {
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> COMMIT
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> DISTRIBUTION
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> CONTRIBUTION next round
    }

    function _advanceFullRoundFromCommit() internal {
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> REVEAL
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> DISTRIBUTION
        vm.warp(block.timestamp + PHASE_DURATION);
        chitFund.advancePhase(); // -> CONTRIBUTION next round
    }
}
