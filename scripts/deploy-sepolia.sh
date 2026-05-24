#!/usr/bin/env bash
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

if [[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != 0x* ]]; then
  export PRIVATE_KEY="0x$PRIVATE_KEY"
fi

SEPOLIA_RPC="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
CHAIN_ID=11155111

echo "==> Deploying ChitFund3.0 to Ethereum Sepolia..."
forge script script/Deploy.s.sol \
  --rpc-url "$SEPOLIA_RPC" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  ${ETHERSCAN_API_KEY:+--verify --etherscan-api-key "$ETHERSCAN_API_KEY"}

RUN_JSON="broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"

if [ ! -f "$RUN_JSON" ]; then
  echo "Deployment broadcast not found at $RUN_JSON"
  exit 1
fi

echo "==> Extracting addresses from $RUN_JSON"

MOCK_USDC=$(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('$RUN_JSON','utf8'));
const t=j.transactions.find(x=>x.contractName==='MockUSDC');
console.log(t?.contractAddress||'');
")

FACTORY=$(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('$RUN_JSON','utf8'));
const t=j.transactions.find(x=>x.contractName==='ChitFundFactory');
console.log(t?.contractAddress||'');
")

ENV_FILE="$ROOT/frontend/.env.local"
cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_FACTORY_ADDRESS=$FACTORY
NEXT_PUBLIC_MOCK_USDC_ADDRESS=$MOCK_USDC
NEXT_PUBLIC_RPC_URL=$SEPOLIA_RPC
EOF

echo ""
echo "=== Sepolia deployment complete ==="
echo "MockUSDC:  $MOCK_USDC"
echo "Factory:   $FACTORY"
echo "Chain ID:  $CHAIN_ID"
echo ""
echo "Wrote $ENV_FILE"
echo "Add NEXT_PUBLIC_WC_PROJECT_ID to .env.local for WalletConnect."
echo "MetaMask → Ethereum Sepolia (chain ID 11155111)"
echo "Create a group at http://localhost:3000/create after npm run dev"
