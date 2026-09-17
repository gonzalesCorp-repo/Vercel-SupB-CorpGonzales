import React from 'react';
import { Metadata } from 'next';
import { VisualStudioCanvas } from '@/components/admin/canvas/VisualStudioCanvas';

export const metadata: Metadata = {
  title: 'Estudio Visual de Flujos & Catálogo | Vaikuntha ERP',
  description: 'Centro de comando interactivo estilo Bizagi, Archify y Obsidian Canvas para modelar flujos de salón y catálogo de bienes.'
};

export default function FlujosCanvasPage() {
  return (
    <div className="w-full h-full">
      <VisualStudioCanvas />
    </div>
  );
}
