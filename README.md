# ChitFund3.0

**On-chain chit fund protocol — trustless rotating savings with sealed-bid auctions.**

Built for **ETHGlobal New Delhi 2026** · Live on **Ethereum Sepolia**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](./contracts)
[![Foundry](https://img.shields.io/badge/Foundry-41%20tests%20passing-brightgreen)](./contracts)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](./frontend)
[![Sepolia](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?logo=ethereum)](https://sepolia.etherscan.io)

---

## Live contracts (Sepolia)

| Contract | Address |
|----------|---------|
| MockUSDC | [`0xc22e...1003`](https://sepolia.etherscan.io/address/0xc22eabfbe2da302b8b161e0c0b86299d6ce91003) |
| ChitFundFactory | [`0x31a8...41e3`](https://sepolia.etherscan.io/address/0x31a8abfc1d3fad5e4d48c34e86eaa7762bad41e3) |

## What it is

**ChitFund3.0** is a Web3 protocol that digitizes the chit fund — community savings where members pool USDC, bid in **commit–reveal auctions**, and share the winner's discount as **dividends**.

No foreman. Rules enforced by smart contract.

## How a round works

```
CONTRIBUTION → COMMIT → REVEAL → DISTRIBUTION
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Frontend | Next.js 16, Tailwind, Wagmi v2, RainbowKit |
| Network | Ethereum Sepolia · Anvil local for dev |

## Quick start

```bash
# Tests
cd contracts && forge test -vvv

# Run against live Sepolia deployment
cd frontend && npm install && npm run dev
# MetaMask → Sepolia, connect 0x2F96...1AfC

# Local dev (optional)
./scripts/deploy-local.sh
```

Full guide: **[DEPLOY.md](./DEPLOY.md)** · Portfolio copy: **[PORTFOLIO.md](./PORTFOLIO.md)**

## Project structure

```
ChitFund3.0/
├── contracts/     # Solidity
├── frontend/      # Next.js dApp
└── scripts/       # deploy-sepolia, deploy-local, skip-phase
```

## License

MIT
