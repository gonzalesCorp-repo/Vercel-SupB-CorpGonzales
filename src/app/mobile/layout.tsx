import React from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Vaikuntha Staff Mobile',
  description: 'Suite operativa móvil para especialistas y colaboradores de salón.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vaikuntha Staff'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617'
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden select-none antialiased transition-colors duration-200">
      {/* Contenedor Ergonómico Centrado */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 relative flex flex-col shadow-2xl transition-colors duration-200">
        {children}
      </div>
    </div>
  );
}
