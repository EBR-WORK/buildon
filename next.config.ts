import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Every route in this site prerenders — there are no route handlers, server
   * actions, middleware, redirects or ISR — so `next build` can emit plain
   * HTML/CSS/JS into `out/` instead of a server bundle. That folder is what a
   * static host serves, and what you drag onto Netlify.
   *
   * `.next` is NOT that folder: it is the build's own working output, and no
   * static host can serve it.
   */
  output: "export",

  images: {
    /**
     * The optimizer behind next/image is a server, and a static export has no
     * server. Without this, `next build` refuses to export at all.
     *
     * The cost is real: every file in /public now ships at its original size
     * and format, so keep the source images small. Sizes, lazy loading and the
     * layout behaviour of next/image all still work.
     */
    unoptimized: true,
  },

  /**
   * Next blocks cross-origin requests to dev-only assets by default, which
   * breaks testing on a phone or tablet over the LAN. Development only — this
   * has no effect on a production build.
   */
  allowedDevOrigins: ["192.168.1.24"],
};

export default nextConfig;
