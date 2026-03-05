"use client"

import React, { useState } from "react";
import { useWhaleStore } from "@/store/whaleStore";
import { motion, AnimatePresence } from "framer-motion";

const EXPLORER = "https://shannon-explorer.somnia.network";
const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);
const isTxHash = (s: string) => /^0x[0-9a-fA-F]{64}$/.test(s);

/* ── types ── */
interface WalletResult {
    kind: "address";
    address: string;
    balance: string;
    txCount: number;
}
interface TxResult {
    kind: "tx";
    hash: string;
    from: string;
    to: string;
    value: string;      // human-readable STT
    status: string;
    block: string;
    timestamp: string;
    fee: string;
    types: string[];
}
type SearchResult = WalletResult | TxResult;

/* ── data fetchers ── */

async function lookupAddress(address: string, rpcUrl: string): Promise<WalletResult> {
    const rpc = (method: string, params: unknown[]) =>
        fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        }).then((r) => r.json());

    const [balRes, txRes] = await Promise.all([
        rpc("eth_getBalance", [address, "latest"]),
        rpc("eth_getTransactionCount", [address, "latest"]),
    ]);
    if (balRes.error) throw new Error(balRes.error.message);

    const balSTT = (Number(BigInt(balRes.result ?? "0x0")) / 1e18).toFixed(6);
    const txCount = parseInt(txRes.result ?? "0x0", 16);
    return { kind: "address", address, balance: balSTT, txCount };
}

async function lookupTxHash(hash: string): Promise<TxResult> {
    const res = await fetch(`${EXPLORER}/api/v2/transactions/${hash}`);
    if (!res.ok) throw new Error(`Explorer returned ${res.status}`);
    const tx: Record<string, unknown> = await res.json();

    const val = Number((tx.value as string) ?? "0") / 1e18;
    const fee = Number(((tx.fee as Record<string, string>)?.value) ?? "0") / 1e18;
    const from = ((tx.from as Record<string, string>)?.hash) ?? "—";
    const to = ((tx.to as Record<string, string>)?.hash) ?? "—";
    const ts = tx.timestamp ? new Date(tx.timestamp as string).toLocaleString() : "—";
    const types = (tx.transaction_types as string[]) ?? [];

    return {
        kind: "tx",
        hash,
        from,
        to,
        value: val.toFixed(6),
        status: (tx.status as string) ?? "unknown",
        block: String(tx.block_number ?? "—"),
        timestamp: ts,
        fee: fee.toFixed(8),
        types,
    };
}

/* ── component ── */

export default function WalletSearch() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const whales = useWhaleStore((s: any) => s.whaleLeaderboard);
    const rpcUrl = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        setError(null);
        setResult(null);

        if (isAddr(q)) {
            setLoading(true);
            try { setResult(await lookupAddress(q, rpcUrl)); }
            catch (err: any) { setError(err?.message ?? "Failed to fetch address data."); }
            finally { setLoading(false); }
        } else if (isTxHash(q)) {
            setLoading(true);
            try { setResult(await lookupTxHash(q)); }
            catch (err: any) { setError(err?.message ?? "Failed to fetch transaction."); }
            finally { setLoading(false); }
        } else {
            setError("Enter a wallet address (0x + 40 hex chars) or a tx hash (0x + 64 hex chars).");
        }
    };

    const whale = result?.kind === "address"
        ? whales.find((w: any) => w.address.toLowerCase() === (result as WalletResult).address.toLowerCase())
        : null;

    return (
        <div className="glass-card p-5 mb-6">
            <div className="section-label mb-4">
                <span style={{ fontSize: "1rem" }}>🔍</span>
                Search — Wallet Address or Transaction Hash
            </div>

            <form onSubmit={onSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="0x…  wallet address or tx hash"
                    className="input-neon flex-1"
                    style={{ fontSize: "0.8rem" }}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                />
                <button type="submit" disabled={loading} className="btn-neon whitespace-nowrap">
                    {loading ? "Searching…" : "Search"}
                </button>
            </form>

            {/* hint */}
            <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "6px" }}>
                Accepts: wallet address (42 chars) · transaction hash (66 chars)
            </div>

            <AnimatePresence>
                {/* Error */}
                {error && (
                    <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-3 px-4 py-2.5 rounded-xl"
                        style={{ background: "rgba(255,61,107,0.08)", border: "1px solid rgba(255,61,107,0.25)" }}>
                        <span style={{ color: "#ff3d6b", fontSize: "0.75rem", fontFamily: "var(--font-jetbrains)" }}>⚠ {error}</span>
                    </motion.div>
                )}

                {/* Address result */}
                {result?.kind === "address" && (
                    <motion.div key="addr-res" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <RC label="Address" value={short(result.address)} mono accent="#00e5ff" />
                            <RC label="Native Balance" value={`${result.balance} STT`} mono />
                            <RC label="Tx Count" value={result.txCount.toLocaleString()} />
                            <RC label="Leaderboard" value={whale ? `#${whales.indexOf(whale) + 1}` : "Not tracked"} accent={whale ? "#ffd166" : undefined} />
                        </div>
                        {whale && (
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <RC label="Influence Score" value={Math.round(whale.influenceScore).toLocaleString()} accent="#ffd166" />
                                <RC label="Total Volume" value={`${formatVol(whale.totalVolume)} STT`} />
                                <RC label="Whale Txs" value={whale.txCount.toLocaleString()} />
                                <RC label="Suspicious" value={whale.isSuspicious ? "🚨 Yes" : "✅ No"} accent={whale.isSuspicious ? "#ff3d6b" : "#00ffc8"} />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Transaction result */}
                {result?.kind === "tx" && (
                    <motion.div key="tx-res" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                        {/* Status banner */}
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                            style={{
                                background: result.status === "ok" ? "rgba(0,255,200,0.06)" : "rgba(255,61,107,0.06)",
                                border: `1px solid ${result.status === "ok" ? "rgba(0,255,200,0.2)" : "rgba(255,61,107,0.2)"}`,
                            }}>
                            <span style={{ fontSize: "0.9rem" }}>{result.status === "ok" ? "✅" : "❌"}</span>
                            <span style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.6rem", letterSpacing: "0.12em", color: result.status === "ok" ? "var(--teal)" : "#ff3d6b" }}>
                                TX {result.status.toUpperCase()}
                            </span>
                            {result.types.length > 0 && (
                                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: "0.62rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                                    · {result.types.join(", ").replace(/_/g, " ")}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <RC label="Hash" value={`${result.hash.slice(0, 10)}…${result.hash.slice(-8)}`} mono accent="#00e5ff" />
                            <RC label="Block" value={`#${Number(result.block).toLocaleString()}`} />
                            <RC label="Timestamp" value={result.timestamp} />
                            <RC label="From" value={short(result.from)} mono />
                            <RC label="To" value={result.to !== "—" ? short(result.to) : "—"} mono />
                            <RC label="Value" value={`${result.value} STT`} mono accent={Number(result.value) > 0 ? "var(--amber)" : undefined} />
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <RC label="Gas Fee" value={`${result.fee} STT`} />
                            <RC label="View on Explorer" value="shannon-explorer.somnia.network →"
                                accent="#00e5ff" />
                        </div>
                        {/* Explorer link */}
                        <div className="mt-2">
                            <a
                                href={`${EXPLORER}/tx/${result.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-neon"
                                style={{ display: "inline-block", textDecoration: "none" }}
                            >
                                Open in Shannon Explorer ↗
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── helpers ── */

function short(a: string) {
    if (!a || a === "—") return "—";
    return `${a.slice(0, 8)}…${a.slice(-6)}`;
}
function formatVol(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(2);
}

function RC({ label, value, mono = false, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
    return (
        <div className="glass-card-inner px-3 py-2.5">
            <div style={{ fontFamily: "var(--font-orbitron)", fontSize: "0.52rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>
                {label}
            </div>
            <div style={{
                fontFamily: mono ? "var(--font-jetbrains)" : "var(--font-syne)",
                fontSize: "0.82rem", fontWeight: 600,
                color: accent ?? "var(--text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
                {value}
            </div>
        </div>
    );
}
