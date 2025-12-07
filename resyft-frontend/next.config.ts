import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
    ]
  },
  // Suppress warning about multiple lockfiles
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
