import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep dev output isolated from production builds to avoid stale chunk/runtime corruption.
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
};

export default nextConfig;
