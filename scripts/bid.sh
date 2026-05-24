#!/usr/bin/env bash
# Commit or reveal a bid via cast (one browser / CLI testing).
# Usage:
#   ./scripts/bid.sh commit <group> <private_key> <discount_bps>
#   ./scripts/bid.sh reveal <group> <private_key> <discount_bps> <salt>
set -euo pipefail

RPC="${ANVIL_RPC:-http://127.0.0.1:8545}"
CMD="${1:?commit or reveal}"
GROUP="${2:?group address}"
PK="${3:?private key (0x...)}"
DISCOUNT="${4:?discount bps e.g. 2000}"

if [[ "$CMD" == "commit" ]]; then
  SALT=$(cast keccak256 "$(openssl rand -hex 32)")
  COMMITMENT=$(cast keccak256 "$(cast abi-encode "packed(uint256,bytes32)" "$DISCOUNT" "$SALT")")
  echo "Salt (save this for reveal): $SALT"
  echo "Commitment: $COMMITMENT"
  cast send "$GROUP" "commitBid(bytes32)" "$COMMITMENT" --private-key "$PK" --rpc-url "$RPC"
  echo ""
  echo "Reveal later with:"
  echo "  ./scripts/bid.sh reveal $GROUP $PK $DISCOUNT $SALT"
elif [[ "$CMD" == "reveal" ]]; then
  SALT="${5:?salt from commit step}"
  cast send "$GROUP" "revealBid(uint256,bytes32)" "$DISCOUNT" "$SALT" --private-key "$PK" --rpc-url "$RPC"
else
  echo "Unknown command: $CMD" >&2
  exit 1
fi
