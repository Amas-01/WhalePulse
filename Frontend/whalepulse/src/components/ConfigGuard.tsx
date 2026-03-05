"use client"

import React from "react";

function invalidMsg(key: string) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020810] text-[#e8f4f8]">
      <div className="border border-[#233142] rounded-xl p-8 max-w-md text-center backdrop-blur-sm bg-[#040f1c]/80">
        <div className="text-4xl mb-4">⚠️</div>
        <div className="text-xl font-semibold text-[#00e5ff] mb-2">Configuration Error</div>
        <div className="mt-2 text-sm text-[#4a7fa5]">Missing: <code className="text-[#e8f4f8]">{key}</code></div>
        <div className="mt-4 text-xs text-[#89b7c9]">Please check your <code>.env.local</code> file and restart the dev server.</div>
      </div>
    </div>
  );
}

export default function ConfigGuard({ children }: { children: React.ReactNode }) {
  const ws = process.env.NEXT_PUBLIC_SOMNIA_WS_URL || "";
  const rpc = process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "";
  const thresh = process.env.NEXT_PUBLIC_WHALE_THRESHOLD || "";

  if (!ws) return invalidMsg("NEXT_PUBLIC_SOMNIA_WS_URL");
  if (!ws.startsWith("wss://")) return invalidMsg("NEXT_PUBLIC_SOMNIA_WS_URL must begin with wss://");
  if (!rpc) return invalidMsg("NEXT_PUBLIC_SOMNIA_RPC_URL");
  if (!thresh || Number.isNaN(Number(thresh)) || Number(thresh) <= 0)
    return invalidMsg("NEXT_PUBLIC_WHALE_THRESHOLD");

  return <>{children}</>;
}
