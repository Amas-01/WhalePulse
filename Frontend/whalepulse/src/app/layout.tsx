import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import ConfigGuard from "@/components/ConfigGuard";

// Fonts are loaded via globals.css @import (Orbitron, JetBrains Mono, Syne)
// and mapped to CSS variables --font-orbitron, --font-jetbrains, --font-syne.

export const metadata: Metadata = {
  title: "WhalePulse — Real-Time Onchain Intelligence",
  description: "Track whale movements on Somnia Network in real time",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#020810] text-[#e8f4f8]">
        <ConfigGuard>
          <Header />
          <Toaster position="top-right" />
          {children}
        </ConfigGuard>
      </body>
    </html>
  );
}
