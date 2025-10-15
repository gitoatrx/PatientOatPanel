import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.3oatrx.ca',
        port: '',
        pathname: '/storage/**',
      },{
        protocol: 'https',
        hostname: 'oatrx.ca',
        port: '',
        pathname: '/storage/**',
      }
    ],
  },
};

export default nextConfig;
