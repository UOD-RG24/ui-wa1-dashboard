import type { NextConfig } from "next";

const upstream =
  process.env.API_UPSTREAM_URL?.replace(/\/$/, "") ??
  "https://rg24-rg1-wa1-api-bchpdqcthyh3ddd2.ukwest-01.azurewebsites.net";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${upstream}/:path*`,
      },
    ];
  },
};

export default nextConfig;
