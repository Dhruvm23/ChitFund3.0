# ChitChain — Deploy & Test Guide

## Step 1: Contract tests (local)

```bash
cd contracts
forge test -vvv
forge coverage
```

All **41 tests** should pass.

## Step 2: Deploy to Polygon Amoy

1. Get testnet MATIC: https://faucet.polygon.technology
2. Get Polygonscan API key: https://polygonscan.com/apis
3. Copy env file:

```bash
cp contracts/.env.example contracts/.env
# Edit contracts/.env with your PRIVATE_KEY and POLYGONSCAN_API_KEY
```

4. Deploy:

```bash
chmod +x scripts/deploy-amoy.sh
./scripts/deploy-amoy.sh
```

This writes `frontend/.env.local` with contract addresses.

5. Add WalletConnect project ID to `frontend/.env.local`:

```bash
# https://cloud.walletconnect.com
NEXT_PUBLIC_WC_PROJECT_ID=your_project_id
```

## Step 3: Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — connect MetaMask to **Polygon Amoy** (chain ID 80002).

## Step 4: Manual E2E testnet walkthrough

Use **two wallets** (or one wallet + a friend):

| Step | Action | Where |
|------|--------|-------|
| 1 | Faucet MockUSDC | Call `faucet(yourAddress, amount)` on MockUSDC via Polygonscan |
| 2 | Create group | `/create` → Deploy |
| 3 | Join group | `/group/[address]` → Approve + Join (wallet 2) |
| 4 | Fill group | Repeat join until members full → group activates |
| 5 | Advance phase | Wait for timer OR warp time on test; click "Advance Phase" after deadline |
| 6 | Commit bid | Commit phase → slider → Lock in Bid |
| 7 | Reveal bid | Reveal phase → Reveal My Bid (salt in localStorage) |
| 8 | Claim dividend | Distribution → Claim Dividend |

## Step 5: Push to GitHub

```bash
git init
git add .
git commit -m "ChitFund3: trustless chit fund on Polygon"
git remote add origin https://github.com/YOUR_USERNAME/ChitFund3.git
git push -u origin main
```

## Step 6: Vercel (optional)

```bash
cd frontend
vercel
# Add all NEXT_PUBLIC_* env vars in Vercel dashboard
```
