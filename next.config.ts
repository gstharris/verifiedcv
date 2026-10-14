import type { NextConfig } from "next";
import { posthogProxyRewrites } from "./src/lib/visitTracking";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return posthogProxyRewrites();
  }
};

export default nextConfig;
