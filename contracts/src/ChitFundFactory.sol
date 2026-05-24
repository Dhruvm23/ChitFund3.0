// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ChitFund } from "./ChitFund.sol";
import { IChitFund } from "./interfaces/IChitFund.sol";

/**
 * @title ChitFundFactory
 * @author Dhruv (ChitFund3)
 * @notice Factory contract for deploying and registering ChitFund groups.
 *         Anyone can create a new chit fund group through this contract.
 */
contract ChitFundFactory {
    // ─── State ───────────────────────────────────────────────────────────────────

    address[] public allGroups;
    mapping(address => address[]) public groupsByOrganizer;
    mapping(address => bool) public isRegisteredGroup;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event GroupCreated(
        address indexed group,
        address indexed organizer,
        address token,
        uint256 contributionAmount,
        uint256 memberCount,
        uint256 roundDuration,
        uint256 maxDiscountBps
    );

    // ─── Functions ───────────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new ChitFund group.
     * @param token ERC-20 token address (e.g., USDC)
     * @param contributionAmount Fixed contribution per member per round
     * @param memberCount Total members in the group
     * @param roundDurationSeconds Duration of each round in seconds
     * @param maxDiscountBps Maximum discount bid in basis points (e.g., 3000 = 30%)
     * @return groupAddress Address of the deployed ChitFund contract
     */
    function createGroup(
        address token,
        uint256 contributionAmount,
        uint256 memberCount,
        uint256 roundDurationSeconds,
        uint256 maxDiscountBps
    ) external returns (address groupAddress) {
        ChitFund group = new ChitFund(
            token,
            contributionAmount,
            memberCount,
            roundDurationSeconds,
            maxDiscountBps,
            msg.sender,     // organizer
            msg.sender      // guardian (organizer is initial guardian)
        );

        groupAddress = address(group);
        allGroups.push(groupAddress);
        groupsByOrganizer[msg.sender].push(groupAddress);
        isRegisteredGroup[groupAddress] = true;

        emit GroupCreated(
            groupAddress,
            msg.sender,
            token,
            contributionAmount,
            memberCount,
            roundDurationSeconds,
            maxDiscountBps
        );
    }

    /**
     * @notice Get all deployed group addresses.
     */
    function getAllGroups() external view returns (address[] memory) {
        return allGroups;
    }

    /**
     * @notice Get active groups (OPEN or ACTIVE state).
     */
    function getActiveGroups() external view returns (address[] memory) {
        uint256 count = 0;

        // First pass: count active groups
        for (uint256 i = 0; i < allGroups.length; i++) {
            IChitFund.GroupState groupState = ChitFund(allGroups[i]).state();
            if (
                groupState == IChitFund.GroupState.OPEN ||
                groupState == IChitFund.GroupState.ACTIVE
            ) {
                count++;
            }
        }

        // Second pass: populate array
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allGroups.length; i++) {
            IChitFund.GroupState groupState = ChitFund(allGroups[i]).state();
            if (
                groupState == IChitFund.GroupState.OPEN ||
                groupState == IChitFund.GroupState.ACTIVE
            ) {
                active[idx] = allGroups[i];
                idx++;
            }
        }

        return active;
    }

    /**
     * @notice Get all groups created by a specific organizer.
     */
    function getGroupsByOrganizer(address organizer) external view returns (address[] memory) {
        return groupsByOrganizer[organizer];
    }

    /**
     * @notice Get total number of deployed groups.
     */
    function getGroupCount() external view returns (uint256) {
        return allGroups.length;
    }
}
