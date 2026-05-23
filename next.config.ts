import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow dev server to be accessed from all network interfaces
  // Run with: next dev --hostname 0.0.0.0
  experimental: {},
};

export default nextConfig;
