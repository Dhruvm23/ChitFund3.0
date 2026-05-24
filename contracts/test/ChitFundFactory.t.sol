// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test, console } from "forge-std/Test.sol";
import { ChitFundFactory } from "../src/ChitFundFactory.sol";
import { ChitFund } from "../src/ChitFund.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { IChitFund } from "../src/interfaces/IChitFund.sol";

contract ChitFundFactoryTest is Test {
    ChitFundFactory public factory;
    MockUSDC public usdc;

    address public organizer = makeAddr("organizer");

    function setUp() public {
        factory = new ChitFundFactory();
        usdc = new MockUSDC();
    }

    function test_CreateGroup_Success() public {
        vm.prank(organizer);
        address group = factory.createGroup(
            address(usdc),
            100e6,     // 100 USDC
            5,         // 5 members
            28 days,   // 28 day rounds
            3000       // 30% max discount
        );

        assertTrue(group != address(0));
        assertTrue(factory.isRegisteredGroup(group));
        assertEq(factory.getGroupCount(), 1);
    }

    function test_CreateGroup_EmitsEvent() public {
        vm.prank(organizer);
        vm.expectEmit(false, true, false, true);
        emit ChitFundFactory.GroupCreated(
            address(0), // we don't know the address yet
            organizer,
            address(usdc),
            100e6,
            5,
            28 days,
            3000
        );
        factory.createGroup(address(usdc), 100e6, 5, 28 days, 3000);
    }

    function test_GetAllGroups() public {
        vm.startPrank(organizer);
        factory.createGroup(address(usdc), 100e6, 5, 28 days, 3000);
        factory.createGroup(address(usdc), 200e6, 10, 30 days, 2000);
        vm.stopPrank();

        address[] memory groups = factory.getAllGroups();
        assertEq(groups.length, 2);
    }

    function test_GetActiveGroups() public {
        vm.prank(organizer);
        address group = factory.createGroup(address(usdc), 100e6, 5, 28 days, 3000);

        address[] memory active = factory.getActiveGroups();
        assertEq(active.length, 1);
        assertEq(active[0], group);
    }

    function test_GetGroupsByOrganizer() public {
        address org1 = makeAddr("org1");
        address org2 = makeAddr("org2");

        vm.prank(org1);
        factory.createGroup(address(usdc), 100e6, 5, 28 days, 3000);

        vm.prank(org2);
        factory.createGroup(address(usdc), 200e6, 10, 30 days, 2000);

        vm.prank(org1);
        factory.createGroup(address(usdc), 50e6, 3, 14 days, 1500);

        address[] memory org1Groups = factory.getGroupsByOrganizer(org1);
        address[] memory org2Groups = factory.getGroupsByOrganizer(org2);

        assertEq(org1Groups.length, 2);
        assertEq(org2Groups.length, 1);
    }

    function test_DeployedGroup_HasCorrectConfig() public {
        vm.prank(organizer);
        address group = factory.createGroup(address(usdc), 100e6, 5, 28 days, 3000);

        ChitFund cf = ChitFund(group);
        assertEq(address(cf.token()), address(usdc));
        assertEq(cf.contributionAmount(), 100e6);
        assertEq(cf.maxMemberCount(), 5);
        assertEq(cf.roundDuration(), 28 days);
        assertEq(cf.maxDiscountBps(), 3000);
        assertEq(cf.organizer(), organizer);
        assertEq(uint256(cf.state()), uint256(IChitFund.GroupState.OPEN));
    }
}
