"use client"

import React, { useEffect } from "react";
import useSomniaEvents from "@/hooks/useSomniaEvents";
import usePanicMeter from "@/hooks/usePanicMeter";
import useExplorerBootstrap from "@/hooks/useExplorerBootstrap";
import LiveTransferFeed from "@/components/LiveTransferFeed";
import WhaleLeaderboard from "@/components/WhaleLeaderboard";
import PanicMeter from "@/components/PanicMeter";
import ActivityChart from "@/components/ActivityChart";
import AlertsPanel from "@/components/AlertsPanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import WalletSearch from "@/components/WalletSearch";
import { useWhaleStore } from "@/store/whaleStore";
import LoadingScreen from "@/components/LoadingScreen";

export default function Page() {
  useSomniaEvents();
  usePanicMeter();
  useExplorerBootstrap(); // loads historical data from Shannon Explorer on startup


  const connectionStatus = useWhaleStore((s: any) => s.connectionStatus);
  const setConnectionStatus = useWhaleStore((s: any) => s.setConnectionStatus);
  const setConnected = useWhaleStore((s: any) => s.setConnected);

  // Fallback: if WS hasn't connected within 6 s, reveal the UI anyway so
  // the user isn't stuck on the loading screen indefinitely.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (connectionStatus !== "connected") {
        setConnectionStatus("connected");
        setConnected(true);
      }
    }, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadingVisible = connectionStatus !== "connected";

  return (
    <>
      <LoadingScreen visible={loadingVisible} />

      {!loadingVisible && (
        <ErrorBoundary>
          <main className="min-h-screen px-6 py-6">
            {/* Wallet Search — prominent, full width */}
            <WalletSearch />

            <div className="grid grid-cols-12 gap-6">
              <aside className="col-span-12 lg:col-span-3">
                <WhaleLeaderboard />
              </aside>

              <section className="col-span-12 lg:col-span-6">
                <LiveTransferFeed />
              </section>

              <aside className="col-span-12 lg:col-span-3">
                <PanicMeter />
              </aside>
            </div>

            <div className="mt-6">
              <ActivityChart />
            </div>

            <div className="mt-6">
              <AlertsPanel />
            </div>
          </main>
        </ErrorBoundary>
      )}
    </>
  );
}
