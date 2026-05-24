#!/usr/bin/env bash
set -euo pipefail

# Deploy ChitFund3.0 to local Anvil — NO testnet tokens needed.
# Perfect when Amoy faucets are blocked.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

ANVIL_RPC="http://127.0.0.1:8545"
# Anvil account #0 private key (public, local only)
ANVIL_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "==> Starting Anvil (local blockchain)..."
if ! curl -s -X POST "$ANVIL_RPC" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  | grep -q "0x7a69"; then
  anvil --chain-id 31337 --port 8545 > /tmp/chitfund3-anvil.log 2>&1 &
  ANVIL_PID=$!
  echo "    Anvil PID: $ANVIL_PID (logs: /tmp/chitfund3-anvil.log)"
  sleep 2
else
  echo "    Anvil already running on $ANVIL_RPC"
  ANVIL_PID=""
fi

echo "==> Deploying contracts to local Anvil..."
PRIVATE_KEY="$ANVIL_KEY" forge script script/Deploy.s.sol \
  --rpc-url "$ANVIL_RPC" \
  --private-key "$ANVIL_KEY" \
  --broadcast

RUN_JSON="broadcast/Deploy.s.sol/31337/run-latest.json"

MOCK_USDC=$(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('$RUN_JSON','utf8'));
console.log(j.transactions.find(x=>x.contractName==='MockUSDC')?.contractAddress||'');
")

FACTORY=$(node -e "
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('$RUN_JSON','utf8'));
console.log(j.transactions.find(x=>x.contractName==='ChitFundFactory')?.contractAddress||'');
")

ENV_FILE="$ROOT/frontend/.env.local"
cat > "$ENV_FILE" <<EOF
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_FACTORY_ADDRESS=$FACTORY
NEXT_PUBLIC_MOCK_USDC_ADDRESS=$MOCK_USDC
NEXT_PUBLIC_RPC_URL=$ANVIL_RPC
EOF

echo ""
echo "=== Local deployment complete ==="
echo "MockUSDC:  $MOCK_USDC"
echo "Factory:   $FACTORY"
echo "RPC:       $ANVIL_RPC"
echo "Chain ID:  31337"
echo ""
echo "Wrote $ENV_FILE"
echo ""
echo "Next steps:"
echo "  1. Add Anvil network to MetaMask:"
echo "       Network name: Anvil Local"
echo "       RPC URL:      http://127.0.0.1:8545"
echo "       Chain ID:     31337"
echo "       Symbol:       ETH"
echo ""
echo "  2. Import Anvil test account #0 into MetaMask (optional):"
echo "       Private key: $ANVIL_KEY"
echo "       (Has 10,000 fake ETH for gas — LOCAL ONLY, never use on mainnet)"
echo ""
echo "  3. Start frontend:"
echo "       cd frontend && npm run dev"
echo ""
echo "  4. Open http://localhost:3000"
echo ""
if [ -n "${ANVIL_PID:-}" ]; then
  echo "To stop Anvil later: kill $ANVIL_PID"
fi
