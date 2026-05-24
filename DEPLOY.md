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

**Live:** [https://chitfund3-0.vercel.app](https://chitfund3-0.vercel.app)

Project: `dhruvm23s-projects/chitfund3-0` on [vercel.com](https://vercel.com)

### Already deployed via CLI

If you need to redeploy:

```bash
cd frontend && npx vercel deploy --prod
```

### Connect GitHub (one-time, in dashboard)

1. [vercel.com/dhruvm23s-projects/chitfund3-0/settings/git](https://vercel.com/dhruvm23s-projects/chitfund3-0/settings/git) → Connect **Dhruvm23/ChitFund3.0**
2. **Settings → General → Root Directory** → set to `frontend`
3. Env vars (Production) — should already be set:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | `0x31a8abfc1d3fad5e4d48c34e86eaa7762bad41e3` |
| `NEXT_PUBLIC_MOCK_USDC_ADDRESS` | `0xc22eabfbe2da302b8b161e0c0b86299d6ce91003` |
| `NEXT_PUBLIC_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
| `NEXT_PUBLIC_GITHUB_URL` | `https://github.com/Dhruvm23/ChitFund3.0` |

4. Paste the Vercel URL into GitHub repo **About → Website**
5. Users connect MetaMask to **Sepolia**

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
