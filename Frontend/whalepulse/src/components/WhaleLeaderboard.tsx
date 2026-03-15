"use client"

import React from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import useNow from "@/hooks/useNow";

const THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100);

export default function WhaleLeaderboard(): React.ReactElement {
  const whales = useWhaleStore((s: any) => s.whaleLeaderboard);
  const now = useNow();

  return (
    <div className="glass-card h-full p-4">
      <div className="section-label">
        <span className="label-dot" />
        Whale Leaderboard
      </div>

      {whales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
          <div className="text-5xl">🐋</div>
          <div className="text-sm text-[var(--text-secondary)]">No whales detected yet</div>
          <div className="text-xs text-[var(--text-muted)] px-4 leading-relaxed">
            Native STT transfers above {THRESHOLD.toLocaleString()} STT will appear here
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <ol className="space-y-2">
            {whales.map((w: any, i: number) => {
              const rankColors = ["#ffd166", "#c0c0c0", "#cd7f32"];
              const rankColor = rankColors[i] ?? "var(--text-muted)";
              const isWhale = w.totalVolume >= THRESHOLD;

              return (
                <motion.li
                  key={w.address}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card-inner p-3 group cursor-default"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-7 text-center font-bold text-sm tabular-nums"
                        style={{ fontFamily: "var(--font-orbitron)", color: rankColor, fontSize: "0.7rem" }}
                      >
                        #{i + 1}
                      </span>
                      <a
                        href={`https://explorer.somnia.network/address/${w.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-[var(--text-primary)] hover:text-cyan-400 transition-colors flex items-center gap-1 group/link"
                        style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.78rem" }}
                      >
                        {short(w.address)}
                        <ExternalLink size={10} className="text-[var(--text-muted)] group-hover/link:text-cyan-400" />
                      </a>
                      {w.isSuspicious && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,61,107,0.15)", color: "#ff3d6b", fontSize: "0.6rem", fontFamily: "var(--font-orbitron)", letterSpacing: "0.1em" }}>
                          SUSPICIOUS
                        </span>
                      )}
                    </div>
                    <span
                      className="text-glow-cyan text-sm font-bold tabular-nums"
                      style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.8rem" }}
                    >
                      {Math.round(w.influenceScore).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between px-0.5">
                    <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: "0.68rem" }}>
                      <span>{formatVol(w.totalVolume)} STT</span>
                      <span className="opacity-40">·</span>
                      <span>{w.txCount} txs</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: "0.65rem" }}>
                      {timeAgo(w.lastSeen, now)}
                    </span>
                  </div>

                  {/* Volume bar */}
                  <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "var(--border-dim)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: w.isSuspicious ? "#ff3d6b" : "var(--cyan)", width: `${Math.min(100, (w.influenceScore / (whales[0]?.influenceScore || 1)) * 100)}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (w.influenceScore / (whales[0]?.influenceScore || 1)) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </AnimatePresence>
      )}
    </div>
  );
}

function short(a: string) { return a.slice(0, 6) + "…" + a.slice(-4); }
function timeAgo(ts: number, now = Date.now()) {
  if (!ts) return "—";
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}
function formatVol(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}
