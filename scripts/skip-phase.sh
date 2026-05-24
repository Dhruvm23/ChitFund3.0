#!/usr/bin/env bash
# Skip one chit-fund phase on local Anvil (default: 7-day round ≈ 42h per phase).
# Usage: ./scripts/skip-phase.sh [seconds]
set -euo pipefail

RPC="${ANVIL_RPC:-http://127.0.0.1:8545}"
SECONDS="${1:-152000}"

echo "==> Increasing Anvil time by ${SECONDS}s..."
cast rpc anvil_increaseTime "$SECONDS" --rpc-url "$RPC" >/dev/null
cast rpc anvil_mine --rpc-url "$RPC" >/dev/null

NOW=$(cast block latest --rpc-url "$RPC" --json | python3 -c "import sys,json; print(int(json.load(sys.stdin)['timestamp'], 16))")
echo "    Chain time: $NOW"
echo "    Refresh the group page — timer uses chain time now."
echo "    Click ⏭ Advance to Next Phase when the timer hits 0."
