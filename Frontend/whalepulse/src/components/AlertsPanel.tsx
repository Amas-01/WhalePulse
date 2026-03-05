"use client"

import React from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { AnimatePresence, motion } from "framer-motion";
import useNow from "@/hooks/useNow";

export default function AlertsPanel(): React.ReactElement {
  const alerts: any[] = useWhaleStore((s: any) => s.alerts);
  const removeAlert = useWhaleStore((s: any) => s.removeAlert);
  const now = useNow();

  return (
    <div
      className="glass-card px-4 py-3 flex items-center"
      style={{ minHeight: "64px" }}
    >
      <div className="flex items-center gap-2 shrink-0 mr-4">
        <span className="label-dot" style={{ background: "#ff3d6b", boxShadow: "0 0 6px #ff3d6b", width: "6px", height: "6px", borderRadius: "50%" }} />
        <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Alerts
        </span>
      </div>

      {alerts.length === 0 ? (
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          All quiet in the depths…
        </span>
      ) : (
        <div className="overflow-x-auto flex-1">
          <div className="flex gap-2 whitespace-nowrap pb-0.5">
            <AnimatePresence initial={false}>
              {alerts.map((a: any) => {
                const isCritical = a.level === "critical";
                return (
                  <motion.button
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.9, x: -12 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => removeAlert(a.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer shrink-0"
                    title="Click to dismiss"
                    style={{
                      background: isCritical ? "rgba(255,61,107,0.1)" : "rgba(0,229,255,0.08)",
                      border: `1px solid ${isCritical ? "rgba(255,61,107,0.3)" : "rgba(0,229,255,0.2)"}`,
                      boxShadow: isCritical ? "0 0 12px rgba(255,61,107,0.08)" : "none",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-syne)", fontSize: "0.75rem", color: isCritical ? "#ff3d6b" : "var(--cyan)" }}>
                      {a.title}
                    </span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.62rem", color: "var(--text-muted)" }}>
                      {timeAgo(a.timestamp, now)}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>✕</span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(ts: number, now: number) {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}
