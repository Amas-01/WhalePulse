"use client"

/**
 * useExplorerBootstrap
 *
 * Runs once on mount. Fetches historical transfer data from the Shannon
 * Explorer API and feeds it into the Zustand store — this "warms up" the
 * UI with past data so it's never blank while waiting for the next live block.
 *
 * Execution order:
 *  1. Fetch chain stats (total txs, txs today, avg block time) → store
 *  2. Fetch recent native STT transfers from main-page endpoint
 *  3. Fetch 3 pages of ERC-20 token transfers
 *  4. Sort everything by timestamp — newest first — deduplicate by txHash
 *  5. Pipe through processTransfer → whaleLeaderboard, panicMeter
 */

import { useEffect } from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { processTransfer } from "@/lib/whaleEngine";
import {
    fetchRecentNativeTxs,
    fetchRecentTokenTransfers,
    fetchChainStats,
} from "@/lib/explorerClient";

export default function useExplorerBootstrap(): void {
    const addTransfer = useWhaleStore((s: any) => s.addTransfer);
    const updateWhale = useWhaleStore((s: any) => s.updateWhale);
    const addAlert = useWhaleStore((s: any) => s.addAlert);
    const setChainStats = useWhaleStore((s: any) => s.setChainStats);

    const THRESHOLD = Number(process.env.NEXT_PUBLIC_WHALE_THRESHOLD || 100);

    useEffect(() => {
        let mounted = true;

        async function bootstrap() {
            // 1. Chain stats
            try {
                const stats = await fetchChainStats();
                if (stats && mounted && setChainStats) setChainStats(stats);
            } catch { /* non-fatal */ }

            // 2. Historical transfers (native + ERC-20)
            try {
                const [native, erc20] = await Promise.all([
                    fetchRecentNativeTxs(),
                    fetchRecentTokenTransfers(3),
                ]);

                if (!mounted) return;

                // Merge, deduplicate on txHash, sort newest first
                const seen = new Set<string>();
                const all = [...native, ...erc20]
                    .filter((t) => { if (seen.has(t.txHash)) return false; seen.add(t.txHash); return true; })
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 50); // cap at 50 so store doesn't overflow

                for (const t of all) {
                    if (!mounted) return;
                    const transfer = {
                        from: t.from,
                        to: t.to,
                        amount: t.amount,
                        timestamp: t.timestamp,
                        txHash: t.txHash,
                    };
                    addTransfer(transfer);
                    const profile = processTransfer(transfer);
                    if (profile) {
                        updateWhale(profile);
                        (transfer as any).isWhale = transfer.amount >= THRESHOLD;
                        (transfer as any).isSuspicious = profile.isSuspicious;
                    }
                    if (transfer.amount >= THRESHOLD * 10) {
                        addAlert({
                            id: transfer.txHash,
                            title: `🐋 Historical: ${formatAmt(transfer.amount)} STT whale move`,
                            timestamp: transfer.timestamp,
                            level: "critical",
                        });
                    }
                }
            } catch { /* non-fatal — live data will arrive via polling */ }
        }

        bootstrap();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

function formatAmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
    return n.toFixed(3);
}
