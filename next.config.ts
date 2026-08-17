import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir conexiones cross-origin desde cualquier dispositivo en la red WiFi local (iPhone, laptops, Motorolas)
  allowedDevOrigins: [
    '192.168.18.15:3000',
    '192.168.18.15',
    'localhost:3000',
    'localhost',
    '127.0.0.1:3000',
    '127.0.0.1'
  ],
  experimental: {
    // Optimización Turbopack
  }
};

export default nextConfig;
