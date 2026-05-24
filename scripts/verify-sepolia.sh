#!/usr/bin/env bash
# Verify already-deployed Sepolia contracts on Etherscan (no redeploy).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

if [ ! -f .env ]; then
  echo "Create contracts/.env from contracts/.env.example first."
  exit 1
fi

set -a
source .env
set +a

if [ -z "${ETHERSCAN_API_KEY:-}" ]; then
  echo "Set ETHERSCAN_API_KEY in contracts/.env"
  exit 1
fi

RPC="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"

# From frontend/.env.local or pass as args
MOCK="${1:-$(grep NEXT_PUBLIC_MOCK_USDC_ADDRESS "$ROOT/frontend/.env.local" | cut -d= -f2)}"
FACTORY="${2:-$(grep NEXT_PUBLIC_FACTORY_ADDRESS "$ROOT/frontend/.env.local" | cut -d= -f2)}"

echo "==> Verifying MockUSDC at $MOCK..."
forge verify-contract "$MOCK" src/MockUSDC.sol:MockUSDC \
  --chain sepolia \
  --rpc-url "$RPC" \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --watch

echo ""
echo "==> Verifying ChitFundFactory at $FACTORY..."
forge verify-contract "$FACTORY" src/ChitFundFactory.sol:ChitFundFactory \
  --chain sepolia \
  --rpc-url "$RPC" \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --watch

echo ""
echo "Done. Check:"
echo "  https://sepolia.etherscan.io/address/$MOCK#code"
echo "  https://sepolia.etherscan.io/address/$FACTORY#code"
