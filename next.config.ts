import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/body-type-analyzer",
  images: { unoptimized: true },
  experimental: {
    workerThreads: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
