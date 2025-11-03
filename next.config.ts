import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_XANO_BASE_URL: process.env.NEXT_PUBLIC_XANO_BASE_URL,
    NEXT_PUBLIC_XANO_API_GROUP: process.env.NEXT_PUBLIC_XANO_API_GROUP || 'api:v1',
  },
};

export default nextConfig;
