import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next blocks cross-origin requests to dev-only assets by default, which
   * breaks testing on a phone or tablet over the LAN. Development only — this
   * has no effect on a production build.
   */
  allowedDevOrigins: ["192.168.1.24"],
};

export default nextConfig;
