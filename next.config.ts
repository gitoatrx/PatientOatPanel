import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.oatrx.ca',
        port: '',
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;
