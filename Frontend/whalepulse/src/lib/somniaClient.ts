import EventEmitter from "events";
import { formatUnits, Interface } from "ethers";

export interface SomniaClientOptions {
  rpcUrl: string;
  wsUrl?: string;
  pollIntervalMs?: number;
}

/**
 * SomniaClient — tracks NATIVE STT transfers on Somnia Mainnet.
 *
 * Strategy (most-to-least reliable):
 *  1. HTTP polling (PRIMARY)  — polls eth_blockNumber every 5s, fetches each
 *     new block's transactions, emits native STT transfers.
 *  2. WebSocket (ENHANCEMENT) — if available, improves block latency. Falls
 *     back to pure HTTP polling on any WS error.
 *
 * This ensures data flows even if the Somnia WS endpoint is unreachable,
 * since the HTTP JSON-RPC is the canonical interface.
 */
export class SomniaClient extends EventEmitter {
  private rpcUrl: string;
  private wsUrl: string;
  private pollIntervalMs: number;

  private lastBlock = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private wsTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private destroyed = false;

  constructor(opts: SomniaClientOptions) {
    super();
    this.rpcUrl = opts.rpcUrl || "https://api.infra.mainnet.somnia.network/";
    this.wsUrl = opts.wsUrl || "wss://dream-rpc.somnia.network/ws";
    this.pollIntervalMs = opts.pollIntervalMs ?? 5000;
  }

  /* ─── public API ─── */

  public async connect(): Promise<void> {
    if (this.connected || this.destroyed) return;
    this.emit("connecting");

    // 1. Seed the last-known block so we don't replay old history
    try {
      this.lastBlock = await this.fetchBlockNumber();
    } catch {
      this.lastBlock = 0;
    }

    // 2. Start HTTP polling (always — this is our safety net)
    this.startPolling();

    // 3. Try to enhance with WebSocket for lower latency
    this.tryWsEnhancement();

    this.connected = true;
    this.emit("connected");
  }

  public async disconnect(): Promise<void> {
    this.destroyed = true;
    this.stopPolling();
    if (this.wsTimer) clearInterval(this.wsTimer);
    this.connected = false;
    this.emit("disconnected");
  }

  public isConnected() { return this.connected; }

  /* ─── HTTP polling ─── */

  private startPolling() {
    this.stopPolling();
    // Immediate first poll
    this.pollOnce().catch(() => { });
    this.pollTimer = setInterval(() => this.pollOnce().catch(() => { }), this.pollIntervalMs);
  }

  private stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private async pollOnce() {
    if (this.destroyed) return;
    try {
      const latest = await this.fetchBlockNumber();
      if (latest <= this.lastBlock) return;

      this.emit("block", latest);

      // Scan every missed block (cap at 3 to avoid thundering herd)
      const from = this.lastBlock + 1;
      const to = Math.min(from + 2, latest);
      this.lastBlock = latest;

      for (let b = from; b <= to; b++) {
        await this.scanBlock(b);
      }
    } catch {
      // Silent — will retry next interval
    }
  }

  /** Fetch full block from HTTP RPC, emit native STT + ERC-20 transfers */
  private async scanBlock(blockNum: number) {
    if (this.destroyed) return;
    try {
      const res = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: blockNum,
          method: "eth_getBlockByNumber",
          params: [`0x${blockNum.toString(16)}`, true],
        }),
      });
      const json = await res.json();
      const block = json?.result;
      if (!block) return;

      const ts = parseInt(block.timestamp ?? "0", 16) * 1000 || Date.now();
      const blockHex = `0x${blockNum.toString(16)}`;

      // ── 1. Native STT transfers (tx.value > 0) ────────────────────────
      for (const tx of (block.transactions ?? [])) {
        if (!tx.value || tx.value === "0x0" || tx.value === "0x") continue;
        try {
          const amountSTT = Number(formatUnits(BigInt(tx.value), 18));
          if (amountSTT <= 0) continue;
          this.emit("transfer", {
            from: tx.from ?? "0x0000000000000000000000000000000000000000",
            to: tx.to ?? "0x0000000000000000000000000000000000000000",
            amount: amountSTT,
            timestamp: ts,
            txHash: tx.hash,
            type: "native",
          });
        } catch { /* skip */ }
      }

      // ── 2. ERC-20 Transfer events (eth_getLogs) ───────────────────────
      try {
        const logRes = await fetch(this.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: `${blockNum}l`,
            method: "eth_getLogs",
            params: [{
              fromBlock: blockHex,
              toBlock: blockHex,
              // ERC-20 Transfer(address,address,uint256) topic
              topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
            }],
          }),
        });
        const logJson = await logRes.json();
        const logs: any[] = logJson?.result ?? [];

        const iface = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);
        for (const log of logs) {
          try {
            const parsed = iface.parseLog(log);
            if (!parsed) continue;
            const amount = Number(formatUnits(parsed.args.value as bigint, 18));
            if (amount <= 0) continue;
            this.emit("transfer", {
              from: parsed.args.from as string,
              to: parsed.args.to as string,
              amount,
              timestamp: ts,
              txHash: log.transactionHash,
              contract: log.address,
              type: "erc20",
            });
          } catch { /* skip malformed log */ }
        }
      } catch { /* log fetch failed — skip */ }

    } catch { /* network error — skip block */ }
  }

  /* ─── Helper ─── */

  private async fetchBlockNumber(): Promise<number> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "bn", method: "eth_blockNumber", params: [] }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return parseInt(json.result, 16);
  }

  /* ─── Optional WS enhancement (lower latency if available) ─── */

  private tryWsEnhancement() {
    // Attempt to open a WS and push block events more promptly.
    // Any failure is silently ignored — HTTP polling is our fallback.
    try {
      const ws = new WebSocket(this.wsUrl);

      ws.onopen = () => {
        // Subscribe to new heads
        ws.send(JSON.stringify({ jsonrpc: "2.0", id: 99, method: "eth_subscribe", params: ["newHeads"] }));
      };

      ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // Subscription result with a block header
          if (msg?.params?.result?.number) {
            const blockNum = parseInt(msg.params.result.number, 16);
            if (blockNum > this.lastBlock) {
              this.emit("block", blockNum);
              this.lastBlock = blockNum;
              await this.scanBlock(blockNum);
            }
          }
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => ws.close();
      ws.onclose = () => { /* WS gone — HTTP polling already running */ };

      // Give up on the WS after 10 s if it never opened
      setTimeout(() => { if (ws.readyState !== WebSocket.OPEN) ws.close(); }, 10000);
    } catch {
      /* WebSocket not available (SSR?) — ignore */
    }
  }
}

/* ─── Singleton ─── */

let _client: SomniaClient | null = null;

export function getSomniaClient(
  rpcUrl = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://api.infra.mainnet.somnia.network/",
  wsUrl = process.env.NEXT_PUBLIC_SOMNIA_WS_URL || "wss://dream-rpc.somnia.network/ws",
): SomniaClient {
  if (!_client) {
    _client = new SomniaClient({ rpcUrl, wsUrl });
  }
  return _client;
}

/** Call this to force a fresh client (e.g. after disconnect) */
export function resetSomniaClient() { _client = null; }
