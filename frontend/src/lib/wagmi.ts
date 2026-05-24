import { http } from "wagmi";
import { polygonAmoy } from "wagmi/chains";
import { defineChain, type Chain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 80002);
const isLocal = chainId === 31337;

/**
 * Must match MetaMask network name + RPC exactly.
 * Using wagmi's built-in "localhost" chain triggers "Add Localhost" popup
 * which conflicts with a manually added "Anvil Local" network.
 */
export const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ||
  (isLocal ? "http://127.0.0.1:8545" : "https://rpc-amoy.polygon.technology");

const activeChainConfig: Chain = isLocal ? anvilLocal : polygonAmoy;

export const config = getDefaultConfig({
  appName: "ChitChain",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "demo-project-id",
  chains: isLocal ? ([anvilLocal] as const) : ([polygonAmoy] as const),
  transports: {
    [activeChainConfig.id]: http(rpcUrl),
  },
  ssr: !isLocal,
});

export const activeChain = activeChainConfig;
export const activeChainId = activeChainConfig.id;
