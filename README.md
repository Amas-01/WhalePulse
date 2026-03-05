# 🐋 WhalePulse

> **Real-time whale tracker for the Somnia Testnet** — monitors native STT and ERC-20 token transfers on-chain, scores whale influence, detects suspicious patterns, and surfaces everything in a sleek cyberpunk dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Frontend Setup](#frontend-setup)
   - [Contracts Setup](#contracts-setup)
7. [Environment Variables](#environment-variables)
8. [How It Works](#how-it-works)
   - [Data Pipeline](#data-pipeline)
   - [Whale Engine](#whale-engine)
   - [Panic Meter](#panic-meter)
9. [UI Components](#ui-components)
10. [Smart Contract](#smart-contract)
11. [Deployment](#deployment)
12. [Contributing](#contributing)
13. [License](#license)

---

## Overview

WhalePulse is a full-stack blockchain analytics dashboard purpose-built for the **Somnia Testnet** (Chain ID `50312`). It combines two data sources — a live HTTP/WebSocket block scanner and the **Shannon Explorer REST API** — to give you a continuously-populated view of every significant STT and ERC-20 transfer the moment it lands on-chain.

The app never shows a blank screen: on first load it bootstraps historical data from the Explorer, then seamlessly blends in real-time blocks as they arrive. Large transfers trigger whale alerts, feed a ranked leaderboard, and move the **Panic Meter** — a composite market-sentiment gauge.

---

## Features

| Feature | Description |
|---|---|
| 🔴 **Live Transfer Feed** | Streams native STT and ERC-20 transfers as new blocks arrive, with spring animations for each row. |
| 🐋 **Whale Leaderboard** | Ranks wallets by a composite *influence score* (volume + frequency + recency). Flags suspicious addresses in real time. |
| 🚨 **Alerts Panel** | Dismissible toast-style alerts fire when transfers exceed 10× the whale threshold. |
| 📈 **Activity Chart** | Rolling chart of transfer volume over time, powered by Recharts. |
| 🌡️ **Panic Meter** | Animated SVG ring gauge that aggregates whale density, frequency, and risk into a single 0–100 score. |
| 🔍 **Wallet / Tx Search** | Dual search — enter a wallet address (42 chars) or a tx hash (66 chars) to see balance, tx count, and leaderboard rank; or full transaction details. |
| 📊 **Chain Stats** | Live counters: total transactions, txs today, total addresses, and average block time — fetched from Shannon Explorer. |
| 🕰️ **Historical Bootstrap** | On startup, fetches up to 50 recent transfers (native + ERC-20, deduplicated) from the Explorer so the feed is never empty. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                            │
│                                                                     │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │ useSomniaEvents │    │useExplorerBoot-  │    │  whaleEngine  │  │
│  │  (real-time)    │    │  strap (history) │    │ (scoring/AI)  │  │
│  └────────┬────────┘    └────────┬─────────┘    └───────┬───────┘  │
│           │                      │                       │          │
│  ┌────────▼────────┐    ┌────────▼─────────┐            │          │
│  │  SomniaClient   │    │  explorerClient  │            │          │
│  │ HTTP poll + WS  │    │ Shannon REST API  │            │          │
│  └────────┬────────┘    └────────┬─────────┘            │          │
│           │                      │                       │          │
│  ┌────────▼──────────────────────▼───────────────────────▼───────┐ │
│  │                        Zustand Store (whaleStore)              │ │
│  │  liveTransfers · whaleLeaderboard · alerts · panicMeter · …   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Components: LiveTransferFeed · WhaleLeaderboard · AlertsPanel     │
│              PanicMeter · ActivityChart · WalletSearch · Header    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Somnia Testnet (Chain 50312)                   │
│   dream-rpc.somnia.network  ·  shannon-explorer.somnia.network      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Contracts (Hardhat / TypeScript)                  │
│   WhaleToken.sol — ERC-20 token WHAL (1B initial supply)           │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Bootstrap** — `useExplorerBootstrap` fires once on mount. It concurrently fetches:
   - Chain stats (`/api/v2/stats`)
   - Recent native txs (`/api/v2/main-page/transactions`)
   - Up to 3 pages of ERC-20 token transfers (`/api/v2/token-transfers`)

   Results are merged, deduplicated by `txHash`, sorted newest-first, capped at 50, then piped through `processTransfer` → store.

2. **Live stream** — `useSomniaEvents` connects a singleton `SomniaClient`. The client:
   - **Primary**: HTTP-polls `eth_blockNumber` every 5 seconds, scans up to 3 missed blocks per tick via `eth_getBlockByNumber`.
   - **Secondary**: Attempts a WebSocket connection (`eth_subscribe: newHeads`) for lower latency. Falls silently back to HTTP polling on any WS error.
   - Emits `transfer` events for **native STT** (non-zero `tx.value`) and **ERC-20** (via `eth_getLogs` + Transfer topic).

3. **Whale processing** — every incoming transfer is passed through `processTransfer`, which updates or creates a `WhaleProfile` (volume, tx count, influence score, suspicious flags) and pushes it to the leaderboard.

4. **Alert fan-out** — transfers ≥ 10× `NEXT_PUBLIC_WHALE_THRESHOLD` push a dismissible critical alert.

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom CSS design tokens |
| State | Zustand v5 |
| Animations | Framer Motion v12 |
| Charts | Recharts v3 |
| EVM | ethers.js v6 |
| Blockchain adapter | `@somnia-chain/streams` |
| UI primitives | Radix UI (Dialog, Tooltip) |
| Notifications | Sonner |
| Icons | Lucide React |

### Contracts

| Layer | Technology |
|---|---|
| Framework | Hardhat v2 + hardhat-toolbox |
| Language | Solidity 0.8.20 / 0.8.28 |
| Libraries | OpenZeppelin Contracts v5 |
| Type safety | TypeChain (ethers v6 bindings) |
| Network | Somnia Testnet (Chain ID 50312) |

---

## Project Structure

```
Whalepulse/
├── Contracts/                     # Hardhat project
│   ├── contracts/
│   │   └── WhaleToken.sol         # ERC-20 WHAL token
│   ├── scripts/                   # Deployment scripts
│   ├── test/                      # Contract tests
│   ├── ignition/                  # Hardhat Ignition modules
│   ├── hardhat.config.ts          # Somnia network config
│   └── package.json
│
└── Frontend/whalepulse/           # Next.js app
    ├── src/
    │   ├── app/                   # Next.js App Router pages
    │   ├── components/
    │   │   ├── ActivityChart.tsx  # Rolling volume chart
    │   │   ├── AlertsPanel.tsx    # Dismissible whale alerts
    │   │   ├── ConfigGuard.tsx    # Env-var gate component
    │   │   ├── ErrorBoundary.tsx  # React error boundary
    │   │   ├── Header.tsx         # Top bar + connection status
    │   │   ├── LiveTransferFeed.tsx # Animated tx stream
    │   │   ├── LoadingScreen.tsx  # Startup splash
    │   │   ├── PanicMeter.tsx     # SVG ring gauge
    │   │   ├── WalletSearch.tsx   # Address + tx hash lookup
    │   │   └── WhaleLeaderboard.tsx # Ranked whale profiles
    │   ├── hooks/
    │   │   ├── useExplorerBootstrap.ts # Historical data seeder
    │   │   ├── useNow.ts          # Reactive current timestamp
    │   │   ├── usePanicMeter.ts   # Panic score calculator
    │   │   └── useSomniaEvents.ts # Real-time block listener
    │   ├── lib/
    │   │   ├── explorerClient.ts  # Shannon Explorer API client
    │   │   ├── mockEvents.ts      # Dev-mode mock transfers
    │   │   ├── somniaClient.ts    # HTTP + WS block scanner
    │   │   └── whaleEngine.ts     # Whale scoring & heuristics
    │   └── store/
    │       └── whaleStore.ts      # Zustand global store
    ├── public/                    # Static assets
    ├── next.config.ts
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- A funded Somnia Testnet wallet (for contract deployment)
- Git

### Frontend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd Whalepulse/Frontend/whalepulse

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# → Edit .env.local (see Environment Variables below)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard bootstraps immediately with historical data, then connects to the live block stream.

### Contracts Setup

```bash
cd Whalepulse/Contracts

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# → Fill in DEPLOYER_PRIVATE_KEY

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Somnia Testnet
npx hardhat ignition deploy ./ignition/modules/WhaleToken.ts --network somnia
```

---

## Environment Variables

### Frontend (`Frontend/whalepulse/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SOMNIA_RPC_URL` | `https://dream-rpc.somnia.network` | Somnia Testnet HTTP RPC endpoint |
| `NEXT_PUBLIC_SOMNIA_WS_URL` | `wss://dream-rpc.somnia.network` | WebSocket endpoint (optional, falls back to polling) |
| `NEXT_PUBLIC_WHALE_THRESHOLD` | `100` | Minimum STT amount to classify a transfer as a whale move |

### Contracts (`Contracts/.env`)

| Variable | Required | Description |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | ✅ | Private key of the deployer wallet (include `0x` prefix) |
| `SOMNIA_RPC_URL` | ✅ | Somnia Testnet RPC URL |
| `SOMNIA_API_KEY` | ☑️ | Shannon Explorer API key (for contract verification) |
| `GAS_PRICE` | ☑️ | Gas price override (default: `auto`) |
| `GAS_LIMIT` | ☑️ | Gas limit override (default: `8000000`) |

> ⚠️ **Never commit `.env` or `.env.local` files containing real private keys to version control.**

---

## How It Works

### Data Pipeline

```
Somnia RPC (HTTP / WS)
        │
        ▼
  SomniaClient.scanBlock()
  ├─ eth_getBlockByNumber → native STT transfers (tx.value > 0)
  └─ eth_getLogs          → ERC-20 Transfer events (topic0 match)
        │
        ▼ "transfer" event
  useSomniaEvents (hook)
        │
        ├─ store.addTransfer()   → liveTransfers[]
        ├─ whaleEngine.processTransfer() → WhaleProfile
        │        └─ store.updateWhale() → whaleLeaderboard[]
        └─ (amount ≥ 10× threshold) → store.addAlert()
```

**Block scanning strategy:**
- On each 5-second poll tick, up to **3 consecutive missed blocks** are scanned to prevent gaps without thundering-herd.
- The WebSocket subscription fires `scanBlock` immediately when a new head is detected (sub-second latency when WS is reachable).
- The singleton `SomniaClient` is shared across the entire app via the `getSomniaClient()` factory, preventing duplicate connections.

### Whale Engine

`processTransfer` in `whaleEngine.ts` implements a lightweight scoring model:

```
influenceScore = (totalVolume × 0.5)
               + (txCount      × 0.3)
               + (recency      × 0.2)

recency = max(0, 1 − (now − lastSeen) / 60_000)  # linear decay over 60s
```

**Suspicious pattern detection:**
- **Rapid-fire transfers** — ≥ 3 transactions from the same address within the last 60 seconds.
- **Round-number transfers** — amounts that are exact multiples of 1,000 STT (common in wash-trading patterns).

Suspicious wallets are flagged 🚨 in the leaderboard and their bar renders in red instead of cyan.

### Panic Meter

`usePanicMeter` derives a 0–100 panic score from the live transfer store (transfer rate + whale density in a rolling window). The `PanicMeter` component renders it as an animated SVG ring with three states:

| Score | State | Color |
|---|---|---|
| 0–39 | 😴 MARKETS SLEEPING | `#00ffc8` (teal) |
| 40–69 | 🌊 WHALES STIRRING | `#ffd166` (amber) |
| 70–100 | 🚨 PANIC DETECTED | `#ff3d6b` (red) |

The breakdown bars (Frequency, Whale Density, Risk Score) are proportional offsets of the master score for visual depth.

---

## UI Components

### `LiveTransferFeed`
Displays the rolling list of transfers from the Zustand store. Each row animates in with a spring transition. Whale transfers get an amber glow border; suspicious ones get a red border and a 🚨 icon. While empty, shows a live block-scanner status widget with scanning block number and count.

### `WhaleLeaderboard`
Sorted descending by `influenceScore`. Top 3 addresses get gold/silver/bronze rank colors. Each entry shows: short address, influence score, total volume, tx count, time-since-last-seen, and an animated fill bar relative to the top whale's score.

### `AlertsPanel`
A horizontal scrolling ticker of dismissible alert pills. Critical alerts (whale moves) render in red; informational alerts in cyan. Each pill shows the message and a relative timestamp that auto-ticks via `useNow`.

### `PanicMeter`
SVG circle stroke-dashoffset animation driven by Framer Motion, with a center numeric score and a colour-matched status badge below. The three breakdown bars update simultaneously.

### `WalletSearch`
Dual-mode search form:
- **Address mode** — calls `eth_getBalance` and `eth_getTransactionCount` via RPC, then cross-references the leaderboard to show rank and whale stats if tracked.
- **Tx hash mode** — hits the Shannon Explorer REST API (`/api/v2/transactions/:hash`) and shows full transaction details with a deep-link to the explorer.

### `ActivityChart`
Recharts area chart of transfer volume over time, updated live via the store subscription.

---

## Smart Contract

### `WhaleToken.sol` (`WHAL`)

A standard OpenZeppelin ERC-20 token deployed to the Somnia Testnet.

```solidity
contract WhaleToken is ERC20, Ownable {
    constructor() ERC20("WhaleToken", "WHAL") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals()); // 1B WHAL
    }

    function mintTo(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

| Property | Value |
|---|---|
| Name | WhaleToken |
| Symbol | WHAL |
| Decimals | 18 |
| Initial Supply | 1,000,000,000 WHAL |
| Network | Somnia Testnet (Chain ID 50312) |
| Admin | Deployer (Ownable) |

The `mintTo` function allows the contract owner to mint additional tokens, useful for faucet-style distribution during testnet development.

---

## Deployment

### Frontend (Vercel / any Node host)

```bash
cd Frontend/whalepulse
npm run build
npm start
# or deploy the .next output to Vercel / Netlify / Railway
```

Set the three `NEXT_PUBLIC_*` environment variables in your hosting dashboard.

### Contracts (Somnia Testnet)

1. Fund your deployer wallet with testnet STT from the Somnia faucet.
2. Ensure `DEPLOYER_PRIVATE_KEY` and `SOMNIA_RPC_URL` are set in `Contracts/.env`.
3. Run:

```bash
cd Contracts
npx hardhat ignition deploy ./ignition/modules/WhaleToken.ts --network somnia
```

4. Note the deployed contract address for use in the frontend or further integrations.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Commit your changes with clear messages.
4. Open a pull request and describe what your change does and why.

Please keep pull requests focused — one feature or fix per PR.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<p align="center">
  Built for the <strong>Somnia Testnet</strong> · Powered by <strong>Next.js</strong> + <strong>Hardhat</strong>
</p>
