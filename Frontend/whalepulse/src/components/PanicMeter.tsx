"use client"

import React from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { motion } from "framer-motion";

export default function PanicMeter(): React.ReactElement {
  const panic = useWhaleStore((s: any) => s.panicMeter);

  const { ringColor, glowColor, label, emoji } = getPanicTheme(panic);

  return (
    <div className="glass-card p-4 flex flex-col items-center">
      <div className="section-label w-full justify-start">
        <span className="label-dot" style={{ background: ringColor, boxShadow: `0 0 6px ${ringColor}` }} />
        Whale Panic Meter
      </div>

      {/* Ring gauge */}
      <div className="relative my-4 flex items-center justify-center" style={{ width: 160, height: 160 }}>
        {/* Background ring */}
        <svg width="160" height="160" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
          <circle cx="80" cy="80" r="68" fill="none" stroke="var(--border-dim)" strokeWidth="10" />
          <motion.circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 68}`}
            animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - panic / 100) }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <motion.span
            key={panic}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold tabular-nums"
            style={{ fontFamily: "var(--font-orbitron)", color: ringColor, textShadow: `0 0 16px ${glowColor}` }}
          >
            {panic}
          </motion.span>
          <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.5rem", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            / 100
          </span>
        </div>
      </div>

      {/* Status label */}
      <div
        className="px-4 py-2 rounded-full text-xs font-bold tracking-wider text-center"
        style={{
          fontFamily: "var(--font-orbitron)",
          fontSize: "0.62rem",
          letterSpacing: "0.12em",
          color: ringColor,
          background: `${ringColor}12`,
          border: `1px solid ${ringColor}30`,
        }}
      >
        {emoji} {label}
      </div>

      {/* Breakdown bars */}
      <div className="w-full mt-4 space-y-2">
        {[
          { label: "Frequency", pct: Math.min(100, panic * 1.2) },
          { label: "Whale Density", pct: Math.min(100, panic * 0.9) },
          { label: "Risk Score", pct: Math.min(100, panic * 0.5) },
        ].map(({ label, pct }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.62rem", color: "var(--text-muted)", width: "80px", flexShrink: 0 }}>{label}</span>
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-dim)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${ringColor}80, ${ringColor})` }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPanicTheme(p: number) {
  if (p >= 70) return { ringColor: "#ff3d6b", glowColor: "rgba(255,61,107,0.5)", label: "PANIC DETECTED", emoji: "🚨" };
  if (p >= 40) return { ringColor: "#ffd166", glowColor: "rgba(255,209,102,0.4)", label: "WHALES STIRRING", emoji: "🌊" };
  return { ringColor: "#00ffc8", glowColor: "rgba(0,255,200,0.3)", label: "MARKETS SLEEPING", emoji: "😴" };
}
