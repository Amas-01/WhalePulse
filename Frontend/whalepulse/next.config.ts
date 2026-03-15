import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v2/:path*",
        destination: "https://explorer.somnia.network/api/v2/:path*",
      },
      {
        source: "/rpc",
        destination: "https://api.infra.mainnet.somnia.network/:path*",
      },
    ];
  },
};

export default nextConfig;
