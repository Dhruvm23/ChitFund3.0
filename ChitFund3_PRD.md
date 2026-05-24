# ChitFund3 — Product Requirements Document

**Version:** 1.0  
**Author:** Dhruv  
**Target Event:** ETHGlobal New Delhi 2026  
**Status:** Ready to build

---

## 1. Problem Statement

India's chit fund industry is worth over ₹50,000 crore (~$6B USD) annually. A chit fund is one of the oldest community savings mechanisms in the world — a group of people pool money every month, and each month one member wins the entire pot through an auction. The winner pays a discount back to the group, which is split as a dividend.

The problem is deep and structural:

- **Fraud is rampant.** The Saradha scam (2013) collapsed with ₹2,500 crore in losses. Operators routinely abscond with the pot.
- **No transparency.** Members have zero visibility into how auctions are conducted or how dividends are calculated.
- **Platform lock-in.** All trust is placed in a single human foreman (the "Nidhi") with no accountability mechanism.
- **Diaspora exclusion.** Indian-Americans, UK Indians, and Gulf NRIs cannot participate in hometown chit funds due to geography and cash requirements.
- **No dispute resolution.** If the foreman cheats, there is no recourse outside the court system, which takes years.

There is currently no trustless, transparent, on-chain equivalent of the chit fund anywhere in the world.

---

## 2. Solution Overview

ChitFund3 is a decentralized chit fund protocol on Polygon where:

- A smart contract enforces all rules — no human foreman can cheat.
- Members join by depositing USDC into a group smart contract.
- Every month, a commit-reveal auction determines who wins the pot.
- The winner receives the full pot minus a discount they bid.
- The discount is split as a dividend among all members.
- ENS names serve as member identities.
- Safe multisig is used for group governance (pause, emergency exit).
- Everything is verifiable on-chain via Polygonscan.

**One-line pitch for judges:** *India's ₹50,000 crore savings institution, rebuilt trustless on-chain in 36 hours.*

---

## 3. Core Concepts (for the README)

### How a Traditional Chit Fund Works
1. 20 members each contribute ₹1,000/month → ₹20,000 pot.
2. Members bid a discount — whoever accepts the lowest payout wins.
3. If Alice bids to take ₹17,000 (a ₹3,000 discount), she wins.
4. The ₹3,000 discount is split among 20 members → ₹150 dividend each.
5. Alice cannot bid again. Next month, a new auction runs.
6. This repeats until all 20 members have received the pot once.

### How ChitFund3 Changes It
- Contribution → USDC deposit to smart contract.
- Auction → commit-reveal scheme (no front-running).
- Foreman → smart contract (immutable, transparent).
- Dividend distribution → automatic via contract.
- Member identity → wallet address + optional ENS name.
- Group governance → Safe multisig (members vote on emergencies).

---

## 4. User Roles

| Role | Description |
|------|-------------|
| **Organizer** | Deploys the contract, sets group parameters, holds no special power after deploy |
| **Member** | Joins the group, deposits monthly, participates in auctions |
| **Winner** | Member who won the current round's auction |
| **Observer** | Anyone who can view group state on-chain or via the frontend |

---

## 5. Functional Requirements

### 5.1 Group Creation (Organizer)

- Organizer deploys a `ChitFund` contract with:
  - `contributionAmount` — fixed USDC per member per round (e.g., 100 USDC)
  - `memberCount` — total members allowed (e.g., 10)
  - `roundDuration` — seconds per round (e.g., 30 days = 2,592,000 seconds)
  - `maxDiscount` — maximum discount a bidder can offer (e.g., 30%)
  - `token` — ERC-20 token address (USDC on Polygon)
- Contract is deployed in `OPEN` state awaiting members.
- A factory contract `ChitFundFactory` allows anyone to deploy groups from the frontend with one click.
- Each deployed group gets a unique `groupId` and is listed in the factory registry.

### 5.2 Joining a Group (Member)

- Any wallet can call `join()` on an `OPEN` group.
- On join, the member approves and transfers `contributionAmount` USDC to the contract (first round deposit).
- Member is added to the `members[]` array.
- Once `members.length == memberCount`, state transitions to `ACTIVE` automatically.
- No member can join after the group is `ACTIVE`.
- A member can only join one active group at a time (enforced per address).

### 5.3 Round Flow

Each round has 4 phases, enforced by block timestamps:

```
CONTRIBUTION_PHASE → COMMIT_PHASE → REVEAL_PHASE → DISTRIBUTION_PHASE
```

**Contribution Phase** (first 7 days of a round)
- All members call `contribute()` to deposit `contributionAmount` USDC.
- Late contributions are flagged; after 2 missed rounds, member is marked `delinquent`.
- Delinquent members cannot bid in the auction.

**Commit Phase** (days 8–14)
- Eligible members call `commitBid(bytes32 commitment)`.
- Commitment = `keccak256(abi.encodePacked(discountBps, salt))`.
- `discountBps` is the discount in basis points (e.g., 2000 = 20%).
- Salt is a random secret the user generates locally.
- Only one commit per member allowed.
- Already-won members cannot commit.

**Reveal Phase** (days 15–21)
- Members call `revealBid(uint256 discountBps, bytes32 salt)`.
- Contract verifies: `keccak256(abi.encodePacked(discountBps, salt)) == storedCommitment`.
- Invalid reveals are discarded.
- If no valid reveals: lowest-index eligible member wins by default (fallback).

**Distribution Phase** (days 22–30)
- Contract determines winner (highest `discountBps` = willing to take most discount).
- Winner receives: `totalPot - (totalPot * winnerDiscountBps / 10000)`.
- Discount amount is split equally among all non-delinquent members as dividend.
- All balances updated in storage; member calls `withdrawDividend()` to claim.
- `roundNumber` increments. State returns to `CONTRIBUTION_PHASE` for next round.
- When `roundNumber == memberCount`, group is `COMPLETE`.

### 5.4 Emergency & Governance (Safe Multisig)

- On deploy, a Gnosis Safe multisig is created with all member addresses.
- The Safe holds a special `GUARDIAN_ROLE` on the contract.
- 60% member majority can call `pause()` — freezes all deposits and auctions.
- 80% majority can call `emergencyExit()` — returns all deposits pro-rata to members.
- Individual members can call `ragequit()` in `OPEN` state (before group goes `ACTIVE`) to get their first deposit back.

### 5.5 Frontend — Group Discovery

- Homepage lists all active groups from the factory registry.
- Each group card shows: contribution amount, member count, spots left, next round date.
- Filter by: token (USDC / DAI), contribution size, round duration.
- Search by ENS name of organizer.

### 5.6 Frontend — Member Dashboard

- Shows: current round phase, your contribution status, your bid status, dividend balance.
- Countdown timer to next phase transition.
- Auction history — past winners, discount offered, dividend received.
- One-click flow for: contribute → commit bid → reveal bid → withdraw dividend.
- MetaMask / WalletConnect integration via Wagmi + RainbowKit.

### 5.7 Frontend — Bid Interface

- Slider to set discount percentage (0–30%).
- Shows estimated payout if you win at that discount.
- Shows estimated dividend if someone else wins at that discount.
- "Commit Bid" generates the commitment hash client-side and stores salt in localStorage.
- "Reveal Bid" reads salt from localStorage, sends reveal transaction.
- Warning if salt is missing from localStorage (user cleared storage).

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Network | Polygon Amoy testnet (demo), Polygon mainnet (post-hackathon) |
| Token | USDC (mock ERC-20 on testnet) |
| Gas efficiency | All writes under 200k gas |
| Test coverage | ≥ 80% line coverage via Foundry |
| Frontend load time | < 2s on 4G |
| Audit readiness | No critical Slither warnings |
| Accessibility | WCAG AA on all interactive elements |

---

## 7. Smart Contract Architecture

### 7.1 Contracts

```
contracts/
├── ChitFund.sol          — core logic (one per group)
├── ChitFundFactory.sol   — deploys and registers ChitFund instances
├── MockUSDC.sol          — test ERC-20 with faucet function
└── interfaces/
    └── IChitFund.sol     — interface for frontend ABI use
```

### 7.2 ChitFund.sol — Storage Layout

```solidity
// State
enum GroupState { OPEN, ACTIVE, PAUSED, COMPLETE }
enum RoundPhase { CONTRIBUTION, COMMIT, REVEAL, DISTRIBUTION }

GroupState public state;
RoundPhase public phase;
uint256 public roundNumber;
uint256 public phaseDeadline;

// Config (set at deploy, immutable)
IERC20 public token;
uint256 public contributionAmount;
uint256 public memberCount;
uint256 public roundDuration;
uint256 public maxDiscountBps;  // e.g., 3000 = 30%

// Members
address[] public members;
mapping(address => bool) public isMember;
mapping(address => bool) public hasWon;
mapping(address => bool) public isDelinquent;
mapping(address => uint256) public missedRounds;

// Per-round state
mapping(address => bool) public hasContributed;
mapping(address => bytes32) public commitments;
mapping(address => uint256) public revealedDiscount;
mapping(address => bool) public hasRevealed;

// Balances
mapping(address => uint256) public dividendBalance;
uint256 public potBalance;

// Governance
address public safe;      // Gnosis Safe address
bytes32 public GUARDIAN_ROLE;
```

### 7.3 ChitFund.sol — Key Functions

```solidity
// Joining
function join() external;

// Round participation
function contribute() external;
function commitBid(bytes32 commitment) external;
function revealBid(uint256 discountBps, bytes32 salt) external;
function withdrawDividend() external;

// Phase advancement (callable by anyone when deadline passes)
function advancePhase() external;

// Governance (Safe only)
function pause() external onlyGuardian;
function unpause() external onlyGuardian;
function emergencyExit() external onlyGuardian;

// Views
function getCurrentWinner() external view returns (address, uint256);
function getMemberStatus(address member) external view returns (MemberStatus memory);
function getGroupInfo() external view returns (GroupInfo memory);
function getRoundHistory(uint256 round) external view returns (RoundResult memory);
```

### 7.4 ChitFundFactory.sol

```solidity
// Deploy a new group
function createGroup(
    address token,
    uint256 contributionAmount,
    uint256 memberCount,
    uint256 roundDurationSeconds,
    uint256 maxDiscountBps
) external returns (address groupAddress);

// Registry
address[] public allGroups;
mapping(address => address[]) public groupsByOrganizer;
function getActiveGroups() external view returns (address[] memory);
```

### 7.5 Events

```solidity
event MemberJoined(address indexed member, uint256 memberIndex);
event GroupActivated(uint256 timestamp);
event ContributionMade(address indexed member, uint256 round, uint256 amount);
event BidCommitted(address indexed member, uint256 round);
event BidRevealed(address indexed member, uint256 round, uint256 discountBps);
event RoundComplete(uint256 indexed round, address winner, uint256 payout, uint256 dividend);
event DividendWithdrawn(address indexed member, uint256 amount);
event GroupPaused(address indexed by);
event EmergencyExit(uint256 totalReturned);
```

---

## 8. Commit-Reveal Scheme (MEV Protection)

### Why it matters
Without commit-reveal, a validator or MEV bot watching the mempool could see your bid and front-run with a slightly higher discount, always winning the pot. Commit-reveal forces bids to be hidden until all bids are locked in.

### How it works

**Step 1 — Commit (client-side)**
```javascript
// Frontend generates this locally — never sent to server
const salt = ethers.utils.randomBytes(32);
const discountBps = 2000; // 20%
const commitment = ethers.utils.solidityKeccak256(
  ['uint256', 'bytes32'],
  [discountBps, salt]
);
// Store salt in localStorage for reveal step
localStorage.setItem(`salt_round_${roundNumber}`, ethers.utils.hexlify(salt));
// Send only commitment on-chain
await contract.commitBid(commitment);
```

**Step 2 — Reveal (after commit phase ends)**
```javascript
const salt = localStorage.getItem(`salt_round_${roundNumber}`);
const discountBps = 2000;
await contract.revealBid(discountBps, salt);
```

**Step 3 — Contract verifies**
```solidity
function revealBid(uint256 discountBps, bytes32 salt) external {
    require(phase == RoundPhase.REVEAL, "Not reveal phase");
    require(isMember[msg.sender], "Not a member");
    require(commitments[msg.sender] != bytes32(0), "No commitment");
    require(!hasRevealed[msg.sender], "Already revealed");
    require(discountBps <= maxDiscountBps, "Discount too high");

    bytes32 check = keccak256(abi.encodePacked(discountBps, salt));
    require(check == commitments[msg.sender], "Commitment mismatch");

    revealedDiscount[msg.sender] = discountBps;
    hasRevealed[msg.sender] = true;
    emit BidRevealed(msg.sender, roundNumber, discountBps);
}
```

---

## 9. Frontend Architecture

### 9.1 Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 14 (App Router) | Fast, easy Vercel deploy |
| Styling | Tailwind CSS | Rapid UI |
| Web3 | Wagmi v2 + Viem | Best DX for React |
| Wallet | RainbowKit | Handles MetaMask, WalletConnect, Coinbase |
| Contract ABIs | auto-generated by Foundry | Always in sync |
| State | React Query (via Wagmi) | Handles on-chain data fetching |
| ENS | Wagmi `useEnsName` | Display human-readable names |
| Deployment | Vercel | Free, instant |

### 9.2 Folder Structure

```
chitfund3/
├── contracts/                    — Foundry project
│   ├── src/
│   │   ├── ChitFund.sol
│   │   ├── ChitFundFactory.sol
│   │   └── MockUSDC.sol
│   ├── test/
│   │   ├── ChitFund.t.sol
│   │   └── ChitFundFactory.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
├── frontend/                     — Next.js app
│   ├── app/
│   │   ├── page.tsx              — Homepage / group discovery
│   │   ├── create/page.tsx       — Create a new group
│   │   ├── group/[address]/
│   │   │   ├── page.tsx          — Group overview
│   │   │   ├── contribute/       — Contribution UI
│   │   │   ├── bid/              — Commit + reveal UI
│   │   │   └── history/          — Past rounds
│   │   └── dashboard/page.tsx    — Member's personal dashboard
│   ├── components/
│   │   ├── GroupCard.tsx
│   │   ├── PhaseTimer.tsx
│   │   ├── BidSlider.tsx
│   │   ├── MemberList.tsx
│   │   ├── RoundHistory.tsx
│   │   └── WalletButton.tsx
│   ├── hooks/
│   │   ├── useChitFund.ts        — all contract reads/writes
│   │   ├── useGroupList.ts       — factory registry reads
│   │   └── useSaltStorage.ts     — localStorage for bid salt
│   ├── lib/
│   │   ├── abi/                  — generated ABIs from Foundry
│   │   ├── addresses.ts          — deployed contract addresses
│   │   └── utils.ts
│   └── wagmi.config.ts
│
└── README.md
```

### 9.3 Key Pages

**Homepage (`/`)**
- Hero: "India's chit fund, on-chain."
- Grid of active groups with: token, amount, spots left, next round date.
- "Create Group" CTA → `/create`.

**Group Page (`/group/[address]`)**
- Phase banner with live countdown (updates every second).
- Member list with ENS names, contribution status, has-won badge.
- Current round pot size.
- Phase-specific action panel (see below).

**Action Panel — by phase:**

| Phase | UI Shown |
|-------|----------|
| CONTRIBUTION | "Contribute 100 USDC" button + approval flow |
| COMMIT | Discount slider + "Lock in Bid" button |
| REVEAL | "Reveal My Bid" button (reads salt from localStorage) |
| DISTRIBUTION | "Claim Dividend" button + winner announcement |

**Dashboard (`/dashboard`)**
- All groups the connected wallet is in.
- Pending actions across groups (needs contribution, needs bid, etc.).
- Total dividends earned lifetime.

---

## 10. Test Plan

### 10.1 Unit Tests (Foundry)

```
ChitFund.t.sol
├── test_JoinGroup_Success
├── test_JoinGroup_Reverts_WhenFull
├── test_JoinGroup_Reverts_WhenActive
├── test_Contribute_Success
├── test_Contribute_Reverts_WrongPhase
├── test_CommitBid_Success
├── test_CommitBid_Reverts_IfAlreadyWon
├── test_CommitBid_Reverts_IfDelinquent
├── test_RevealBid_Success
├── test_RevealBid_Reverts_BadSalt
├── test_RevealBid_Reverts_ExceedsMaxDiscount
├── test_AdvancePhase_Contribution_To_Commit
├── test_AdvancePhase_Commit_To_Reveal
├── test_AdvancePhase_Reveal_To_Distribution
├── test_Distribution_CorrectWinner
├── test_Distribution_CorrectDividend
├── test_Distribution_FallbackWinner_NoReveals
├── test_WithdrawDividend_Success
├── test_EmergencyExit_ReturnsProRata
├── test_FullRound_E2E (fuzz with random bids)
└── test_FullGroup_AllRounds_E2E
```

### 10.2 Fuzz Tests

```solidity
function testFuzz_CommitReveal(uint256 discountBps, bytes32 salt) public {
    discountBps = bound(discountBps, 0, maxDiscountBps);
    // ... verify commitment scheme holds
}

function testFuzz_DividendNeverExceedsPot(uint256[10] memory discounts) public {
    // Verify sum of dividends + winner payout == totalPot
}
```

### 10.3 Integration Test (Fork Test)

```solidity
// Fork Polygon Amoy, use real USDC testnet contract
function test_Fork_FullGroupLifecycle() public {
    vm.createSelectFork("polygon_amoy");
    // Deploy factory, create group, 10 members join, run 10 rounds
}
```

---

## 11. Deployment Plan

### Testnet (Day 1 of hackathon)

```bash
# Deploy to Polygon Amoy
forge script script/Deploy.s.sol \
  --rpc-url $POLYGON_AMOY_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY
```

Deployed contracts:
- `MockUSDC` — testnet USDC with `faucet()` anyone can call
- `ChitFundFactory` — main registry
- One demo `ChitFund` group pre-seeded with 3 members for judges to see

### Frontend Deploy

```bash
cd frontend
vercel deploy --prod
# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_FACTORY_ADDRESS=0x...
# NEXT_PUBLIC_CHAIN_ID=80002
# NEXT_PUBLIC_RPC_URL=https://rpc-amoy.polygon.technology
```

### Contract Verification

Every contract gets verified on [amoy.polygonscan.com](https://amoy.polygonscan.com) so judges can read the source code directly.

---

## 12. 36-Hour Build Plan (ETHGlobal)

### Hours 0–2: Setup
- Clone repo, install Foundry + Node.
- Copy storage layout and function signatures from this PRD into `ChitFund.sol`.
- Get MockUSDC deployed to Amoy.
- Set up Next.js project with Wagmi + RainbowKit boilerplate.

### Hours 2–8: Core Contract
- Implement `join()`, `contribute()`, state transitions.
- Implement commit-reveal: `commitBid()`, `revealBid()`.
- Implement `advancePhase()` with timestamp checks.
- Implement `distribution()` — winner selection and dividend split.
- Write 10 basic unit tests. All passing.

### Hours 8–12: Factory + Safe Integration
- Deploy `ChitFundFactory`.
- Wire up Gnosis Safe creation on group deploy (can use Safe SDK).
- Implement `emergencyExit()` and `pause()`.
- Fuzz test the dividend math.

### Hours 12–20: Frontend Core
- Homepage with factory group list.
- Group page with phase timer and member list.
- Contribute flow (approve + contribute in 2 txns, batch with Wagmi).
- Commit bid flow with slider and localStorage salt.
- Reveal bid flow.

### Hours 20–26: Polish + Demo Setup
- Dashboard page.
- Dividend claim UI.
- Seed demo group with pre-committed bids for judges.
- Write README with architecture diagram.
- Deploy frontend to Vercel.

### Hours 26–30: Testing + Slides
- Full manual walkthrough on testnet.
- Fix any bugs.
- Prepare 3-minute pitch: problem → solution → demo → why it's novel.
- Add Polygonscan verified contract links to README.

### Hours 30–36: Buffer + Submission
- Fix any last issues.
- Submit on ETHGlobal.com.
- Sleep.

---

## 13. Judging Pitch Script (3 minutes)

**Hook (20 seconds)**
> "Every month, 50 million Indian families pool money in chit funds — a savings system older than banks. But the guy running it? He can disappear with your money overnight. That's a $6 billion trust problem. We fixed it in a weekend."

**Problem (30 seconds)**
> "Chit funds work beautifully in theory — rotating savings, community credit, zero banks. But they require a trusted foreman. And foremen steal. The Saradha scam alone wiped out ₹2,500 crore from working-class families."

**Solution (60 seconds)**
> "ChitFund3 replaces the foreman with a smart contract. Members join a group, contribute USDC every month, and bid for the pot in a commit-reveal auction — so nobody can front-run your bid. The contract enforces every rule: who can bid, who wins, how dividends split. The code is the law. And it's all verifiable on Polygonscan right now."

**Demo (60 seconds)**
> Live demo: join a group, commit a bid, reveal, claim dividend.

**Why it wins (10 seconds)**
> "First trustless chit fund ever deployed. Commit-reveal MEV protection. India-native problem with a global diaspora market. Open source, verified on-chain, live on Polygon Amoy."

---

## 14. Post-Hackathon Roadmap

| Milestone | What | Timeline |
|-----------|------|----------|
| v1.1 | Multi-token support (DAI, MATIC) | Week 1 |
| v1.2 | Email/SMS reminders for phase deadlines via Push Protocol | Week 2 |
| v1.3 | ZK-based private bids (replace commit-reveal with Noir circuit) | Month 2 |
| v1.4 | Mainnet deploy on Polygon | Month 2 |
| v1.5 | Mobile app via React Native + WalletConnect | Month 3 |
| v2.0 | KYC-lite via Polygon ID for regulated markets | Month 4 |

---

## 15. Resources & Links

| Resource | URL |
|----------|-----|
| Foundry docs | https://book.getfoundry.sh |
| Wagmi v2 docs | https://wagmi.sh |
| RainbowKit | https://rainbowkit.com |
| Polygon Amoy faucet | https://faucet.polygon.technology |
| Gnosis Safe SDK | https://docs.safe.global/sdk/overview |
| EAS (for future) | https://attest.sh |
| Polygonscan Amoy | https://amoy.polygonscan.com |
| Vercel deploy | https://vercel.com |
| OpenZeppelin | https://docs.openzeppelin.com/contracts |

---

*This PRD is the single source of truth for ChitFund3. Every function name, event, state variable, and UI element in the codebase should match what's described here.*
