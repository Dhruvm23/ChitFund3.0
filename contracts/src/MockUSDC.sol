// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Test ERC-20 token simulating USDC on testnet.
 *         Anyone can call faucet() to mint tokens for testing.
 * @dev Uses 6 decimals to match real USDC.
 */
contract MockUSDC is ERC20 {
    uint8 private constant _DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** _DECIMALS; // 10,000 USDC per faucet call

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Mint test tokens to any address. No restrictions — testnet only.
     * @param to Recipient address
     * @param amount Amount to mint (in 6-decimal units)
     */
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Convenience: mint default faucet amount to caller.
     */
    function faucet() external {
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
