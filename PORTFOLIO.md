# ChitChain — Portfolio Case Study

Use this on your personal website project page.

---

## Title

**ChitChain** — On-Chain Chit Fund Protocol

## Tagline

Trustless rotating savings on Polygon. Sealed-bid auctions. Automatic dividends.

## One-liner

A Web3 smart contract protocol that replaces the human chit-fund foreman with immutable on-chain rules — members pool USDC, bid in commit–reveal auctions, and share the winner's discount as dividends.

---

## Problem

India's chit fund industry moves over **₹50,000 crore** annually. Groups pool savings monthly; one member wins the lump sum via auction; the winner's discount is shared with everyone else.

It works when you trust the organizer. When you don't:

- Organizers abscond with the pot (major fraud cases, e.g. Saradha)
- Auctions are opaque — members can't verify fairness
- One person holds all cash with no accountability
- Diaspora members can't join hometown groups across borders

There was no trustless, transparent on-chain equivalent.

---

## Solution

**ChitChain** deploys each savings group as its own smart contract:

- Members join by depositing **USDC**
- Each round: **contribute → commit → reveal → distribute**
- **Commit–reveal** prevents bid front-running
- Winner receives pot minus discount; discount split equally as **dividends**
- Full history verifiable on Polygonscan

---

## What I built

**Smart contracts (Solidity / Foundry)**

- `ChitFund` — join, contribute, commit/reveal auction, dividend claims, phase machine
- `ChitFundFactory` — one-click group deployment + registry
- `MockUSDC` — testnet faucet token
- 41 tests, ~81% coverage, multi-round E2E

**Frontend (Next.js / Wagmi / RainbowKit)**

- Browse & create groups
- Wallet connect, join flow with faucet + approve
- Bid slider with sealed commit + local salt storage per wallet
- Dashboard, phase timer, round history

**DevOps**

- Local Anvil deploy script, Amoy deploy script, phase skip helper for testing

---

## Demo flow (what to show in a video)

1. Deploy / connect to local or Amoy
2. Create a 5-member group
3. Five wallets join (faucet → approve → join)
4. Group activates → Commit phase → each wallet seals a bid
5. Reveal → highest discount wins
6. Claim dividends — show $20 each on $500 pot at 20% discount
7. Round history + on-chain verification

---

## Tech stack (for project card)

Solidity · Foundry · OpenZeppelin · Next.js · TypeScript · Wagmi · RainbowKit · Polygon · USDC · Web3

---

## Links (fill after deploy)

| Link | URL |
|------|-----|
| GitHub | `https://github.com/YOUR_USERNAME/ChitChain` |
| Live demo | Vercel URL (optional) |
| Demo video | YouTube / Loom |
| Contracts | Polygonscan Amoy |

---

## Suggested website project card

```
ChitChain
On-chain chit fund protocol — sealed-bid auctions & automatic dividends on Polygon

Tags: Web3 · Solidity · Foundry · Next.js · DeFi · Polygon

[GitHub] [Live Demo] [Case Study]
```
