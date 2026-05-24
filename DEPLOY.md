# ChitFund3.0 — Deploy & Test Guide

## Production testnet — Ethereum Sepolia

**Live deployment (your wallet `0x2F96...1AfC`):**

| Contract | Address |
|----------|---------|
| MockUSDC | `0xc22eabfbe2da302b8b161e0c0b86299d6ce91003` |
| ChitFundFactory | `0x31a8abfc1d3fad5e4d48c34e86eaa7762bad41e3` |

Explorer: [sepolia.etherscan.io](https://sepolia.etherscan.io)

### Run the app

```bash
cd frontend && npm run dev
```

MetaMask → **Ethereum Sepolia** (chain ID **11155111**).

`frontend/.env.local` is already configured from deploy.

### Redeploy (if needed)

```bash
cp contracts/.env.example contracts/.env   # PRIVATE_KEY + ETHERSCAN_API_KEY
./scripts/deploy-sepolia.sh
```

Needs ~0.02 Sepolia ETH. Faucets: [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia) · [Google Cloud](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)

---

## Local development — Anvil

For fast testing with `./scripts/skip-phase.sh` (no waiting for phase timers):

```bash
./scripts/deploy-local.sh
cd frontend && npm run dev
```

MetaMask → **Anvil Local** (chain ID **31337**).

---

## Host frontend (Vercel)

1. Push to GitHub
2. [vercel.com](https://vercel.com) → import repo → root directory **`frontend`**
3. Env vars from `frontend/.env.local.example`
4. Users connect MetaMask to **Sepolia**

---

## E2E test flow (Sepolia)

| Step | Action |
|------|--------|
| 1 | Connect deployer wallet |
| 2 | `/create` → deploy group |
| 3 | Other wallets: Sepolia ETH + **Get Test USDC (Faucet)** on join page |
| 4 | Approve → Join → Commit → Reveal → Claim dividend |
| 5 | Wait for phase timers (no skip on public testnet) |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `deploy-sepolia.sh` | Deploy to Sepolia (public demo) |
| `deploy-local.sh` | Deploy to Anvil (local dev) |
| `skip-phase.sh` | Fast-forward time (Anvil only) |
| `bid.sh` | CLI commit/reveal (optional) |
