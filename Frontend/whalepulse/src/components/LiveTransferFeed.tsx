"use client"

import React from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";
import useNow from "@/hooks/useNow";

const THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100);

export default function LiveTransferFeed(): React.ReactElement {
  const transfers = useWhaleStore((s: any) => s.liveTransfers);
  const blockNumber = useWhaleStore((s: any) => s.blockNumber);
  const blocksScanned = useWhaleStore((s: any) => s.blocksScanned);
  const lastScanTime = useWhaleStore((s: any) => s.latestBlockTime);
  const now = useNow();


  return (
    <div className="glass-card p-4">
      <div className="section-label">
        <span className="label-dot" style={{ background: "var(--teal)", boxShadow: "0 0 6px var(--teal)" }} />
        Live Transfer Feed
        <span className="ml-auto text-xs font-sans normal-case tracking-normal" style={{ color: "var(--text-muted)", fontFamily: "var(--font-jetbrains)", fontSize: "0.65rem" }}>
          Native STT · Somnia Mainnet
        </span>
      </div>

      <div className="space-y-1.5 overflow-auto max-h-[460px] pr-1">
        {transfers.length === 0 ? (
          // ── Empty state: show live block scanner stats ──────────────────
          <div className="py-6 space-y-3">
            {/* Block scanner status */}
            <div className="flex items-center justify-between px-3 py-3 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-dim)" }}>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--teal)", boxShadow: "0 0 8px var(--teal)" }}
                />
                <div>
                  <div style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Scanning Somnia Mainnet
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {blockNumber
                      ? `Block #${Number(blockNumber).toLocaleString()}`
                      : "Awaiting first block…"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Blocks Scanned
                </div>
                <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.9rem", color: "var(--cyan)", fontWeight: 700, marginTop: "2px" }}>
                  {blocksScanned.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Last scan line */}
            {lastScanTime && (
              <div className="text-center" style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                Last scan: {Math.floor((now - lastScanTime) / 1000)}s ago
                {" · "}Threshold: {Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100)} STT
              </div>
            )}

            {/* Skeleton rows */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl shimmer-bg" style={{ background: "var(--bg-elevated)", height: "50px", opacity: 0.5 - i * 0.1 }} />
            ))}

            <div className="text-center pt-2" style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
              Tracker is live — STT transfers will appear here as they happen on Somnia Mainnet.
            </div>

          </div>

        ) : (
          <AnimatePresence initial={false}>
            {transfers.map((t: any) => {
              const isWhale = t.amount >= THRESHOLD;
              const isSuspicious = !!t.isSuspicious;
              const amtColor = isSuspicious ? "#ff3d6b" : isWhale ? "var(--amber)" : "var(--text-primary)";
              const borderColor = isSuspicious ? "#ff3d6b40" : isWhale ? "rgba(255,209,102,0.3)" : "var(--border-dim)";

              return (
                <motion.div
                  key={t.txHash}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: isWhale
                      ? "linear-gradient(135deg, rgba(10,22,40,0.9) 0%, rgba(255,209,102,0.04) 100%)"
                      : "var(--bg-elevated)",
                    border: `1px solid ${borderColor}`,
                    boxShadow: isWhale ? "0 0 12px rgba(255,209,102,0.06)" : "none",
                  }}
                >
                  {/* Icons */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-base shrink-0">
                      {isSuspicious ? "🚨" : isWhale ? "🐋" : "→"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--cyan)" }}>
                          {short(t.from)}
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>→</span>
                        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {short(t.to)}
                        </span>
                      </div>
                      <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {t.txHash ? t.txHash.slice(0, 14) + "…" : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Amount + time + explorer link */}
                  <div className="flex flex-col items-end shrink-0 ml-3 gap-0.5">
                    <span className="font-bold tabular-nums" style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.82rem", color: amtColor }}>
                      {formatAmt(t.amount)} STT
                    </span>
                    <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.62rem", color: "var(--text-muted)" }}>
                      {timeAgo(t.timestamp, now)}
                    </span>
                    {t.txHash && (
                      <a
                        href={`https://explorer.somnia.network/tx/${t.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on Somnia Explorer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          marginTop: "2px",
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cyan)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function short(a: string) { return a.slice(0, 6) + "…" + a.slice(-4); }
function timeAgo(ts: number, now = Date.now()) {
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}
function formatAmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(6);
}
