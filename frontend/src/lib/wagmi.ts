import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { defineChain, type Chain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);

/** Local dev only — use ./scripts/deploy-local.sh */
export const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

const DEFAULT_RPC: Record<number, string> = {
  31337: "http://127.0.0.1:8545",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
};

function resolveChain(id: number): Chain {
  if (id === 31337) return anvilLocal;
  return sepolia;
}

const activeChainConfig = resolveChain(chainId);
const isLocal = chainId === 31337;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || DEFAULT_RPC[chainId] || DEFAULT_RPC[11155111];

export const config = getDefaultConfig({
  appName: "ChitFund3.0",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo-project-id",
  chains: [activeChainConfig],
  transports: {
    [activeChainConfig.id]: http(rpcUrl),
  },
  ssr: !isLocal,
});

export const activeChain = activeChainConfig;
export const activeChainId = activeChainConfig.id;
