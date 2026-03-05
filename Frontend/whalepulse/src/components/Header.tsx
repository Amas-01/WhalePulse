"use client"

import Image from "next/image";
import React from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { motion, AnimatePresence } from "framer-motion";
import useNow from "@/hooks/useNow";

export default function Header(): React.ReactElement {
  const status = useWhaleStore((s: any) => s.connectionStatus);
  const attempt = useWhaleStore((s: any) => s.reconnectAttempt);
  const blockNumber = useWhaleStore((s: any) => s.blockNumber);
  const totalVolume = useWhaleStore((s: any) => s.totalVolumeTracked);
  const chainStats = useWhaleStore((s: any) => s.chainStats);
  const now = useNow();


  const clockStr = new Date(now).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const statusConfig = {
    connected: { color: "#00ffc8", pulse: "dot-pulse", label: "SOMNIA TESTNET · LIVE" },
    connecting: { color: "#ffd166", pulse: "dot-blink", label: "CONNECTING…" },
    reconnecting: { color: "#ff9940", pulse: "dot-blink", label: `RECONNECTING (${attempt}/5)…` },
    disconnected: { color: "#ff3d6b", pulse: "", label: "DISCONNECTED" },
  };
  const sc = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.disconnected;

  const volDisplay =
    totalVolume >= 1_000_000 ? `${(totalVolume / 1_000_000).toFixed(2)}M`
      : totalVolume >= 1_000 ? `${(totalVolume / 1_000).toFixed(1)}K`
        : totalVolume > 0 ? totalVolume.toFixed(2)
          : "—";

  return (
    <header
      className="relative w-full flex items-center justify-between px-6 py-4 z-10"
      style={{
        background: "linear-gradient(180deg, rgba(2,8,16,0.98) 0%, rgba(2,8,16,0.7) 100%)",
        borderBottom: "1px solid rgba(0,229,255,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Left: Logo + status */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <Image
            src="/logo.svg"
            alt="WhalePulse"
            width={160}
            height={36}
            priority
            style={{ filter: "drop-shadow(0 0 10px rgba(0,229,255,0.4))" }}
          />
        </div>

        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${sc.color}30`,
            boxShadow: `0 0 12px ${sc.color}10`,
          }}
        >
          <span
            className={`h-2 w-2 rounded-full ${sc.pulse}`}
            style={{ background: sc.color, boxShadow: `0 0 6px ${sc.color}` }}
          />
          <span
            className="text-xs font-bold tracking-widest"
            style={{
              fontFamily: "var(--font-orbitron)",
              color: sc.color,
              fontSize: "0.6rem",
            }}
          >
            {sc.label}
          </span>
        </div>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4">
        {/* Block */}
        <StatChip
          label="BLOCK"
          value={
            <AnimatePresence mode="wait">
              {blockNumber ? (
                <motion.span
                  key={blockNumber}
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ display: "inline-block" }}
                >
                  {Number(blockNumber).toLocaleString()}
                </motion.span>
              ) : (
                <motion.span key="b-dash">—</motion.span>
              )}
            </AnimatePresence>
          }
        />

        {/* Volume */}
        <StatChip
          label="TRACKED VOL"
          value={<span style={{ color: "var(--cyan)" }}>{volDisplay} <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>STT</span></span>}
        />

        {/* Chain stats from Shannon Explorer */}
        {chainStats && (
          <StatChip
            label="CHAIN TXS TODAY"
            value={<span style={{ color: "var(--teal)" }}>{Number(chainStats.txsToday).toLocaleString()}</span>}
          />
        )}

        {/* Live clock */}
        <div
          className="px-3 py-1.5 rounded-lg tabular-nums"
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid var(--border-dim)",
            letterSpacing: "0.05em",
          }}
        >
          {clockStr}
        </div>
      </div>
    </header>
  );
}

function StatChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end px-3 py-1.5 rounded-lg"
      style={{ background: "rgba(0,0,0,0.35)", border: "1px solid var(--border-dim)" }}>
      <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
