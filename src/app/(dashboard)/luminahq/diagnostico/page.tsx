'use client';

import React from 'react';
import { CapillaryDiagnosticView } from '@/components/luminahq/CapillaryDiagnosticView';

export default function LuminaDiagnosticoPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <CapillaryDiagnosticView />
    </div>
  );
}
