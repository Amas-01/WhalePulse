"use client"

import { useEffect } from "react";
import { getSomniaClient } from "@/lib/somniaClient";
import { useWhaleStore } from "@/store/whaleStore";
import { processTransfer } from "@/lib/whaleEngine";

const THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100);

export default function useSomniaEvents(): void {
  const setConnected = useWhaleStore((s: any) => s.setConnected);
  const addTransfer = useWhaleStore((s: any) => s.addTransfer);
  const updateWhale = useWhaleStore((s: any) => s.updateWhale);
  const addAlert = useWhaleStore((s: any) => s.addAlert);
  const setConnectionStatus = useWhaleStore((s: any) => s.setConnectionStatus);
  const setReconnectAttempt = useWhaleStore((s: any) => s.setReconnectAttempt);
  const setBlockNumber = useWhaleStore((s: any) => s.setBlockNumber);

  useEffect(() => {
    let mounted = true;

    setConnectionStatus("connecting");

    const client = getSomniaClient();

    const onTransfer = (t: any) => {
      if (!mounted) return;
      const transfer = {
        from: t.from,
        to: t.to,
        amount: t.amount,
        timestamp: t.timestamp || Date.now(),
        txHash: t.txHash,
      };
      addTransfer(transfer);
      const profile = processTransfer(transfer);
      if (profile) {
        updateWhale(profile);
        (transfer as any).isWhale = transfer.amount >= THRESHOLD;
        (transfer as any).isSuspicious = profile.isSuspicious;
      }
      // Alert on significant whale transfers (10× threshold)
      if (transfer.amount >= THRESHOLD * 10) {
        addAlert({
          id: transfer.txHash,
          title: `🐋 Whale moved ${formatAmt(transfer.amount)} STT`,
          timestamp: Date.now(),
          level: "critical",
        });
      }
    };

    const onBlock = (n: number) => { if (mounted) setBlockNumber(n); };
    const onConnected = () => { if (mounted) { setConnected(true); setConnectionStatus("connected"); setReconnectAttempt(0); } };
    const onDisconnected = () => { if (mounted) { setConnected(false); setConnectionStatus("disconnected"); } };
    const onConnecting = () => { if (mounted) setConnectionStatus("connecting"); };

    client.on("transfer", onTransfer);
    client.on("block", onBlock);
    client.on("connected", onConnected);
    client.on("disconnected", onDisconnected);
    client.on("connecting", onConnecting);

    client.connect().catch(() => {
      if (mounted) setConnectionStatus("disconnected");
    });

    return () => {
      mounted = false;
      client.off("transfer", onTransfer);
      client.off("block", onBlock);
      client.off("connected", onConnected);
      client.off("disconnected", onDisconnected);
      client.off("connecting", onConnecting);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function formatAmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(3);
}
