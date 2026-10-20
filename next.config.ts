import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "word-extractor"],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const noStore = [{ key: "Cache-Control", value: "no-store" }];
    return [
      { source: "/studio", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/attest/:path*", headers: noStore }
    ];
  }
};

export default nextConfig;
