import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling puppeteer — it must run as a native Node.js module
  // on the server side, not through the webpack bundle.
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
};

export default nextConfig;
