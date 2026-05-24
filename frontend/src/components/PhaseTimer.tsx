"use client";

import { useState, useEffect } from "react";
import { useBlock } from "wagmi";
import { formatDuration } from "@/lib/utils";

interface PhaseTimerProps {
  deadline: number; // Unix timestamp
  compact?: boolean;
}

export function PhaseTimer({ deadline, compact = false }: PhaseTimerProps) {
  const { data: block } = useBlock({ watch: true });
  const chainNow = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calc = () => setTimeLeft(Math.max(0, deadline - chainNow));
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [deadline, chainNow]);

  if (compact) {
    return (
      <p className="text-sm font-bold text-white mt-1">
        {timeLeft > 0 ? formatDuration(timeLeft) : "Phase Complete"}
      </p>
    );
  }

  // Full timer display with circular progress
  const totalPhaseDuration = 7 * 24 * 60 * 60; // estimate 7 days
  const progress = Math.max(
    0,
    Math.min(100, ((totalPhaseDuration - timeLeft) / totalPhaseDuration) * 100)
  );

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        {/* Background ring */}
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#timer-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient
              id="timer-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {timeLeft > 0 ? (
            <>
              <span className="text-2xl font-bold text-white">
                {Math.floor(timeLeft / 86400)}
              </span>
              <span className="text-xs text-gray-400">
                {Math.floor(timeLeft / 86400) === 1 ? "day" : "days"}
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-purple-400">Ready</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 font-mono">{formatDuration(timeLeft)}</p>
    </div>
  );
}
