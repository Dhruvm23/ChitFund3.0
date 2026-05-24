"use client";

import { useState, useEffect } from "react";

/** True only after client mount — avoids SSR/client env mismatch hydration errors. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
