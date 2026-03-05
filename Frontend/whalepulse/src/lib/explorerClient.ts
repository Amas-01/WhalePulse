/**
 * explorerClient.ts — Shannon Explorer API client
 *
 * Fetches historical and chain-level data from:
 * https://shannon-explorer.somnia.network/api/v2/
 *
 * Combines with the real-time somniaClient (HTTP polling) so the
 * WhalePulse store holds BOTH past + present Somnia testnet transfers.
 */

const EXPLORER = "https://shannon-explorer.somnia.network";

export interface RawTransfer {
    from: string;
    to: string;
    amount: number;   // human-readable units (18 decimals assumed for STT)
    timestamp: number;   // unix ms
    txHash: string;
    type: "native" | "erc20";
    contract?: string;
}

export interface ChainStats {
    totalTxs: string;
    txsToday: number;
    totalAddresses: string;
    avgBlockTime: number;
}

/* ─── helpers ─── */

async function getJson(url: string): Promise<unknown> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function buildNextUrl(base: string, params: Record<string, unknown>): string | null {
    if (!params || Object.keys(params).length === 0) return null;
    const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
    return `${base}?${qs}`;
}

/* ─── public functions ─── */

/**
 * Recent native STT coin transfers from the explorer home page.
 */
export async function fetchRecentNativeTxs(): Promise<RawTransfer[]> {
    let raw: unknown;
    try { raw = await getJson(`${EXPLORER}/api/v2/main-page/transactions`); } catch { return []; }

    const data = raw as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) return [];

    const out: RawTransfer[] = [];
    for (const tx of data) {
        const amount = Number(tx.value ?? 0) / 1e18;
        if (amount <= 0) continue;
        const ts = tx.timestamp ? new Date(tx.timestamp as string).getTime() : Date.now();
        const from = (tx.from as Record<string, string>)?.hash ?? "0x";
        const to = (tx.to as Record<string, string>)?.hash ?? "0x";
        out.push({ from, to, amount, timestamp: ts, txHash: tx.hash as string, type: "native" });
    }
    return out;
}

/**
 * Paginated ERC-20 token transfers — fetches up to `pages` pages.
 */
export async function fetchRecentTokenTransfers(pages = 3): Promise<RawTransfer[]> {
    const out: RawTransfer[] = [];
    let url: string | null = `${EXPLORER}/api/v2/token-transfers`;

    for (let p = 0; p < pages && url; p++) {
        let raw: unknown;
        try { raw = await getJson(url); } catch { break; }

        const data = raw as { items?: Array<Record<string, unknown>>; next_page_params?: Record<string, unknown> };
        const items: Array<Record<string, unknown>> = Array.isArray(data.items) ? data.items : [];

        for (const t of items) {
            const total = t.total as Record<string, unknown> | undefined;
            const rawVal = String(total?.value ?? "0");
            const decimals = parseInt(String(total?.decimals ?? "18"), 10);
            const amount = Number(rawVal) / Math.pow(10, decimals);
            if (amount <= 0) continue;

            const ts = t.timestamp ? new Date(t.timestamp as string).getTime() : Date.now();
            const from = (t.from as Record<string, string>)?.hash ?? "0x";
            const to = (t.to as Record<string, string>)?.hash ?? "0x";
            const hash = (t.tx_hash ?? t.transaction_hash ?? "0x") as string;
            const addr = (t.token as Record<string, string>)?.address;
            out.push({ from, to, amount, timestamp: ts, txHash: hash, type: "erc20", contract: addr });
        }

        url = buildNextUrl(`${EXPLORER}/api/v2/token-transfers`, data.next_page_params ?? {});
    }
    return out;
}

/**
 * Fetch transaction history for a specific address (used in WalletSearch).
 */
export async function fetchAddressTransfers(address: string, pages = 2): Promise<RawTransfer[]> {
    const out: RawTransfer[] = [];
    let url: string | null = `${EXPLORER}/api/v2/addresses/${address}/transactions`;

    for (let p = 0; p < pages && url; p++) {
        let raw: unknown;
        try { raw = await getJson(url); } catch { break; }

        const data = raw as { items?: Array<Record<string, unknown>>; next_page_params?: Record<string, unknown> };
        const items: Array<Record<string, unknown>> = Array.isArray(data.items) ? data.items : [];

        for (const tx of items) {
            const amount = Number(tx.value ?? 0) / 1e18;
            const ts = tx.timestamp ? new Date(tx.timestamp as string).getTime() : Date.now();
            const from = (tx.from as Record<string, string>)?.hash ?? "0x";
            const to = (tx.to as Record<string, string>)?.hash ?? "0x";
            out.push({ from, to, amount, timestamp: ts, txHash: tx.hash as string, type: "native" });
        }

        url = buildNextUrl(
            `${EXPLORER}/api/v2/addresses/${address}/transactions`,
            data.next_page_params ?? {}
        );
    }
    return out;
}

/**
 * Chain-wide statistics from the Shannon Explorer.
 */
export async function fetchChainStats(): Promise<ChainStats | null> {
    let raw: unknown;
    try { raw = await getJson(`${EXPLORER}/api/v2/stats`); } catch { return null; }

    const d = raw as Record<string, unknown>;
    return {
        totalTxs: String(d.total_transactions ?? "0"),
        txsToday: Number(d.transactions_today ?? 0),
        totalAddresses: String(d.total_addresses ?? "0"),
        avgBlockTime: Number(d.average_block_time ?? 0),
    };
}
