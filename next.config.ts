import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // pdfjs-dist is imported only in server code (attendance decoder); keep it
  // external so Next doesn't try to bundle its worker/font assets.
  serverExternalPackages: ["pdfjs-dist"],
  // pdfjs loads pdf.worker.mjs via a DYNAMIC import (the "fake worker" it runs
  // on the main thread in Node). Vercel's file tracing only follows static
  // imports, so it prunes the worker from the serverless bundle and it's
  // missing at runtime. Force-include it (symlink resolves through pnpm's
  // .pnpm store on the build machine).
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  // Allow dev server to be accessed from all network interfaces
  // Run with: next dev --hostname 0.0.0.0
  experimental: {},
};

export default nextConfig;
