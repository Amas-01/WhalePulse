"use client"

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useWhaleStore } from "@/store/whaleStore";
import useNow from "@/hooks/useNow";

const WINDOW_MS = 5 * 60 * 1000;
const BUCKET_MS = 30 * 1000;
const N_BUCKETS = WINDOW_MS / BUCKET_MS;
const THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100);

export default function ActivityChart(): React.ReactElement {
  const transfers = useWhaleStore((s: any) => s.liveTransfers);
  const now = useNow();

  const buckets = Array.from({ length: N_BUCKETS }, (_, i) => {
    const bucketEnd = now - (N_BUCKETS - 1 - i) * BUCKET_MS;
    const bucketStart = bucketEnd - BUCKET_MS;
    const label = new Date(bucketEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    let volume = 0, whaleVolume = 0;
    for (const t of transfers) {
      if (t.timestamp >= bucketStart && t.timestamp < bucketEnd) {
        volume += t.amount;
        if (t.amount >= THRESHOLD) whaleVolume += t.amount;
      }
    }
    return { time: label, volume: parseFloat(volume.toFixed(4)), whaleVolume: parseFloat(whaleVolume.toFixed(4)) };
  });

  const hasData = buckets.some((b) => b.volume > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "rgba(5,14,26,0.95)", border: "1px solid rgba(0,229,255,0.2)",
        borderRadius: "10px", padding: "10px 14px", fontSize: "0.72rem",
        fontFamily: "var(--font-jetbrains)", color: "var(--text-primary)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      }}>
        <div style={{ color: "var(--text-muted)", marginBottom: "6px" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.stroke, marginBottom: "2px" }}>
            {p.dataKey === "whaleVolume" ? "🐋 Whale" : "Total"}: {p.value.toLocaleString()} STT
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-card p-4" style={{ height: "280px" }}>
      <div className="section-label" style={{ marginBottom: "0.5rem" }}>
        <span className="label-dot" style={{ background: "#00b4a0", boxShadow: "0 0 6px #00b4a0" }} />
        STT Activity
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "none", letterSpacing: "0.02em", marginLeft: "4px" }}>
          · 5 min window · 30s buckets
        </span>
        {!hasData && (
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-jetbrains)", fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>
            Listening for transfers…
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="grad-vol" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#00b4a0" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#00b4a0" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="grad-whale" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(13,37,55,0.8)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-jetbrains)" }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-jetbrains)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="volume" stroke="#00b4a0" strokeWidth={1.5} fill="url(#grad-vol)" />
          <Area type="monotone" dataKey="whaleVolume" stroke="#00e5ff" strokeWidth={2} fill="url(#grad-whale)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
