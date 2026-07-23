import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["pdfjs-dist"],
  outputFileTracingIncludes: {
    "/**": ["./src/vendor/pdf.worker.mjs"],
  },
  experimental: {},
};

export default nextConfig;
