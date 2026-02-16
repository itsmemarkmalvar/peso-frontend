import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled to prevent Leaflet map double initialization
  transpilePackages: ["leaflet", "react-leaflet"],
  async rewrites() {
    return [
      // Local dev proxy: Next.js (3000) → Laravel artisan serve (8000)
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      // Proxy storage so profile images load (frontend on 3000, Laravel serves files on 8000)
      {
        source: "/storage/:path*",
        destination: "http://127.0.0.1:8000/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
