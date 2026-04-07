import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/body-type-analyzer",
  images: { unoptimized: true },
};

export default nextConfig;
