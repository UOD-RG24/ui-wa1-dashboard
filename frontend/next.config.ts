import type { NextConfig } from "next";

/** Local Nest BFF. Production without Nest can point at core-wa1-api (path-compatible). */
const DEFAULT_BFF =
  process.env.NODE_ENV === "production"
    ? "https://rg24-rg1-wa1-api-bchpdqcthyh3ddd2.ukwest-01.azurewebsites.net"
    : "http://127.0.0.1:3001";

const fromEnv = process.env.DASHBOARD_BFF_URL?.replace(/\/$/, "").trim();
const bff = fromEnv || DEFAULT_BFF;

const nextConfig: NextConfig = {
  // Keep Turbopack rooted in frontend/ so .env.local NEXT_PUBLIC_* vars load
  // (parent package-lock.json otherwise becomes the inferred workspace root).
  turbopack: {
    root: __dirname,
  },
  // Default 10MB truncates large uploads proxied via /api/* (multipart uploads
  // are sent directly to the BFF in apiClient.ts to avoid buffering).
  experimental: {
    proxyClientMaxBodySize: "1gb",
  },
  serverActions: {
    bodySizeLimit: "1gb",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${bff}/:path*`,
      },
    ];
  },
};

export default nextConfig;
