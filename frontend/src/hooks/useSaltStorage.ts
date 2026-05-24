"use client";

import { useState, useCallback, useEffect } from "react";

const SALT_PREFIX = "chitfund3_salt_";

function storageKey(groupAddress: string, roundNumber: number, userAddress?: string) {
  const base = `${SALT_PREFIX}${groupAddress.toLowerCase()}_${roundNumber}`;
  return userAddress ? `${base}_${userAddress.toLowerCase()}` : base;
}

function readStoredSalt(key: string): { salt: string; discountBps: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as { salt: string; discountBps: number };
  } catch {
    return null;
  }
}

/**
 * Bid salts stored per group, round, and wallet — switch MetaMask accounts in one browser.
 */
export function useSaltStorage(
  groupAddress: string,
  roundNumber: number,
  userAddress?: string
) {
  const key = storageKey(groupAddress, roundNumber, userAddress);

  const [salt, setSaltState] = useState<string | null>(null);
  const [discountBps, setDiscountBpsState] = useState<number | null>(null);

  useEffect(() => {
    const stored = readStoredSalt(key);
    setSaltState(stored?.salt ?? null);
    setDiscountBpsState(stored?.discountBps ?? null);
  }, [key]);

  const saveSalt = useCallback(
    (newSalt: string, newDiscountBps: number) => {
      const data = { salt: newSalt, discountBps: newDiscountBps };
      localStorage.setItem(key, JSON.stringify(data));
      setSaltState(newSalt);
      setDiscountBpsState(newDiscountBps);
    },
    [key]
  );

  const hasSalt = salt !== null;

  const clearSalt = useCallback(() => {
    localStorage.removeItem(key);
    setSaltState(null);
    setDiscountBpsState(null);
  }, [key]);

  return {
    salt,
    discountBps,
    hasSalt,
    saveSalt,
    clearSalt,
  };
}
