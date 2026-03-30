import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "*",
        pathname: "/**",
      }
    ]
  }
};

export default nextConfig;
