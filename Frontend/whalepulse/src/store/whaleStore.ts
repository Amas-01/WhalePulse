import { create } from "zustand";

export interface Transfer {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  txHash: string;
}

export interface WhaleProfile {
  address: string;
  totalVolume: number;
  txCount: number;
  influenceScore: number;
  lastSeen: number;
  isSuspicious: boolean;
  transfers: Transfer[];
}

export interface Alert {
  id: string;
  title: string;
  timestamp: number;
  level?: "info" | "warning" | "critical";
}

export interface ChainStats {
  totalTxs: string;
  txsToday: number;
  totalAddresses: string;
  avgBlockTime: number;
}

export interface WhaleState {
  liveTransfers: Transfer[];
  whaleLeaderboard: WhaleProfile[];
  panicMeter: number;
  totalVolumeTracked: number;
  blockNumber: number | null;
  blocksScanned: number;
  latestBlockTime: number | null;
  chainStats: ChainStats | null;
  isConnected: boolean;
  connectionStatus: "connected" | "connecting" | "reconnecting" | "disconnected";
  reconnectAttempt: number;
  alerts: Alert[];
  setBlockNumber: (n: number) => void;
  setChainStats: (s: ChainStats) => void;

  addTransfer: (t: Transfer) => void;
  updateWhale: (p: WhaleProfile) => void;
  recalculatePanicMeter: () => void;
  addAlert: (a: Alert) => void;
  removeAlert: (id: string) => void;
  setConnected: (c: boolean) => void;
}

export const useWhaleStore = create<WhaleState>((set: any, get: any) => ({
  liveTransfers: [],
  whaleLeaderboard: [],
  panicMeter: 0,
  totalVolumeTracked: 0,
  isConnected: false,
  connectionStatus: "disconnected",
  reconnectAttempt: 0,
  alerts: [],
  blockNumber: null,
  blocksScanned: 0,
  latestBlockTime: null,
  chainStats: null,

  addTransfer: (t: Transfer) =>
    set((s: any) => ({
      liveTransfers: [t, ...s.liveTransfers].slice(0, 50),
      totalVolumeTracked: s.totalVolumeTracked + t.amount,
    })),

  updateWhale: (p: WhaleProfile) =>
    set((s: any) => {
      const map = new Map(s.whaleLeaderboard.map((w: any) => [w.address, w]));
      map.set(p.address, p);
      const arr = Array.from(map.values()).sort((a: any, b: any) => b.influenceScore - a.influenceScore).slice(0, 100);
      return { whaleLeaderboard: arr.slice(0, 10) };
    }),

  recalculatePanicMeter: () =>
    set((s: any) => {
      const now = Date.now();
      // transfers in last 60s
      const recent = s.liveTransfers.filter((t: any) => now - t.timestamp <= 60000);

      // 1) frequency score (0-40): map 0..100+ transfers -> 0..40
      const freqCount = recent.length;
      const frequency = Math.min(40, Math.round((freqCount / 100) * 40));

      // 2) whale density (0-40): transfers > threshold in last 60s
      const threshold = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 50000);
      const whaleCount = recent.filter((t: any) => t.amount >= threshold).length;
      const whaleDensity = Math.min(40, Math.round((whaleCount / 50) * 40));

      // 3) risk score (0-20): suspicious flagged whales present
      const suspicious = s.whaleLeaderboard.filter((w: any) => w.isSuspicious && now - w.lastSeen <= 60000).length;
      const risk = Math.min(20, Math.round((suspicious / 10) * 20));

      const panic = Math.min(100, frequency + whaleDensity + risk);
      return { panicMeter: panic };
    }),

  addAlert: (a: Alert) =>
    set((s: any) => {
      const next = [a, ...s.alerts].slice(0, 20);
      // schedule auto-dismiss after 30s
      setTimeout(() => {
        set((ss: any) => ({ alerts: ss.alerts.filter((x: any) => x.id !== a.id) }));
      }, 30000);
      return { alerts: next };
    }),
  removeAlert: (id: string) => set((s: any) => ({ alerts: s.alerts.filter((a: any) => a.id !== id) })),

  setConnected: (c: boolean) => set(() => ({ isConnected: c })),
  setConnectionStatus: (s: "connected" | "connecting" | "reconnecting" | "disconnected") => set(() => ({ connectionStatus: s })),
  setReconnectAttempt: (n: number) => set(() => ({ reconnectAttempt: n })),
  setBlockNumber: (n: number) => set((prev: any) => ({
    blockNumber: n,
    blocksScanned: prev.blocksScanned + 1,
    latestBlockTime: Date.now(),
  })),
  setChainStats: (s: any) => set(() => ({ chainStats: s })),

}));
