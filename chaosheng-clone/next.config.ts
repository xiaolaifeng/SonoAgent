import type { NextConfig } from "next";

const basePath = "/chaosheng";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
