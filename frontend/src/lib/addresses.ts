// Deployed contract addresses — set via env after deployment
// IMPORTANT: use static process.env.NEXT_PUBLIC_* access so Next.js inlines values

const zero = "0x0000000000000000000000000000000000000000" as `0x${string}`;

function parseAddress(value: string | undefined): `0x${string}` {
  if (value && value.startsWith("0x") && value.length === 42) {
    return value as `0x${string}`;
  }
  return zero;
}

export const CONTRACTS = {
  factory: parseAddress(process.env.NEXT_PUBLIC_FACTORY_ADDRESS),
  mockUSDC: parseAddress(process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS),
} as const;

export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

export function contractsDeployed(): boolean {
  return CONTRACTS.factory !== zero;
}
