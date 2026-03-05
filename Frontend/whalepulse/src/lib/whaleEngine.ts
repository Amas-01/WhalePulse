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

import { useWhaleStore } from "@/store/whaleStore";

/**
 * Process an incoming transfer and return an updated WhaleProfile.
 * Implements threshold detection and basic suspicious-pattern heuristics.
 */
export function processTransfer(transfer: Transfer): WhaleProfile | null {
  const threshold = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 50000);
  const store = useWhaleStore.getState();

  // Update or create profile
  const existing = store.whaleLeaderboard.find((w: any) => w.address === transfer.from) || null;
  const totalVolume = (existing ? existing.totalVolume : 0) + transfer.amount;
  const txCount = (existing ? existing.txCount : 0) + 1;

  // recency factor (seconds since last seen)
  const now = Date.now();
  const recency = existing ? Math.max(0, 1 - (now - existing.lastSeen) / 60000) : 1;

  // influence = (totalVolume * 0.5) + (frequency * 0.3) + (recency * 0.2)
  const frequency = txCount;
  const influenceScore = totalVolume * 0.5 + frequency * 0.3 + recency * 0.2;

  // Suspicious heuristics
  let isSuspicious = false;

  // Rapid repeated transfers: count transfers from same address in last 60s
  const recentFrom = store.liveTransfers.filter((t: any) => t.from === transfer.from && now - t.timestamp <= 60000);
  if (recentFrom.length >= 3) isSuspicious = true;

  // Round number transfers
  if (Math.abs(transfer.amount - Math.round(transfer.amount / 1000) * 1000) < 1) isSuspicious = true;

  // Build profile
  const profile: WhaleProfile = {
    address: transfer.from,
    totalVolume,
    txCount,
    influenceScore,
    lastSeen: now,
    isSuspicious,
    transfers: [(existing ? existing.transfers : []).concat([transfer])].flat().slice(-50),
  };

  return profile;
}
