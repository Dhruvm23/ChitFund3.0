"use client";

import { useReadContract } from "wagmi";
import { FACTORY_ABI } from "@/lib/abi/ChitFundFactory";
import { CONTRACTS } from "@/lib/addresses";

const FACTORY_ADDRESS = CONTRACTS.polygonAmoy.factory;

export function useAllGroups() {
  const result = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllGroups",
  });
  return { ...result, data: result.data as `0x${string}`[] | undefined };
}

export function useActiveGroups() {
  const result = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getActiveGroups",
  });
  return { ...result, data: result.data as `0x${string}`[] | undefined };
}

export function useGroupsByOrganizer(organizer: `0x${string}`) {
  const result = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getGroupsByOrganizer",
    args: [organizer],
    query: {
      enabled: !!organizer && organizer !== "0x0000000000000000000000000000000000000000",
    },
  });
  return { ...result, data: result.data as `0x${string}`[] | undefined };
}

export function useGroupCount() {
  const result = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getGroupCount",
  });
  return { ...result, data: result.data as bigint | undefined };
}
