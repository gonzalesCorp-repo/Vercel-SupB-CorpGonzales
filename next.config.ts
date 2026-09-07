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
  // Optimización de paquetes y compilación Turbopack
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'date-fns',
      '@tanstack/react-query',
      '@tanstack/react-table',
    ],
  },
  // Compresión automática de respuestas (Gzip/Brotli)
  compress: true,
  // Limpieza de console.log en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Optimización de formatos modernos y caché de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
  },
  // Encabezados HTTP de alto rendimiento para activos estáticos
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff2|woff)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
