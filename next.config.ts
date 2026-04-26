import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large payloads for chart image uploads (base64)
  serverExternalPackages: [],
  
  experimental: {
    // Increase server actions body size for image uploads
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  allowedDevOrigins: ['172.29.224.1'],
};

export default nextConfig;
