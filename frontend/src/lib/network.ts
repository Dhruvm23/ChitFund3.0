import { DEFAULT_CHAIN_ID } from "./addresses";

const NETWORK_NAMES: Record<number, string> = {
  31337: "Anvil Local",
  11155111: "Ethereum Sepolia",
};

export function getNetworkName(chainId: number = DEFAULT_CHAIN_ID): string {
  return NETWORK_NAMES[chainId] ?? `Chain ${chainId}`;
}

export function getExplorerUrl(chainId: number = DEFAULT_CHAIN_ID): string {
  if (chainId === 11155111) return "https://sepolia.etherscan.io";
  return "https://etherscan.io";
}
