// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console } from "forge-std/Script.sol";
import { MockUSDC } from "../src/MockUSDC.sol";
import { ChitFundFactory } from "../src/ChitFundFactory.sol";

/**
 * @title Deploy
 * @notice Deployment script for ChitFund3 protocol on Polygon Amoy testnet.
 *         Deploys MockUSDC, ChitFundFactory, and a demo ChitFund group.
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // 2. Deploy ChitFundFactory
        ChitFundFactory factory = new ChitFundFactory();
        console.log("ChitFundFactory deployed at:", address(factory));

        // 3. Mint USDC to deployer for testing
        usdc.faucet(deployer, 10_000 * 10 ** 6);
        console.log("Minted 10,000 USDC to deployer");

        vm.stopBroadcast();

        // Log summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Polygon Amoy Testnet");
        console.log("MockUSDC:", address(usdc));
        console.log("ChitFundFactory:", address(factory));
        console.log("Create groups via /create in the frontend");
        console.log("==========================\n");
    }
}
