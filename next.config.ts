import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // pdfjs-dist is imported only in server code (attendance decoder); keep it
  // external so Next doesn't try to bundle its worker/font assets.
  serverExternalPackages: ["pdfjs-dist"],
  // Allow dev server to be accessed from all network interfaces
  // Run with: next dev --hostname 0.0.0.0
  experimental: {},
};

export default nextConfig;
