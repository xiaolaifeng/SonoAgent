import type { NextConfig } from "next";

// Optional sub-path (e.g. "/chaosheng" behind nginx). Leave empty for root deploy (Vercel).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
