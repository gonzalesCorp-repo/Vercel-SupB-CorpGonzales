'use client';

import React from 'react';
import HistorialOATCsTable from '@/components/recepcion/HistorialOATCsTable';

export default function HistorialRecepcionPage() {
  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Historial de Órdenes</h1>
        <p className="text-slate-500 mt-2">Consulta todas las atenciones generadas y su estado final.</p>
      </div>
      
      <HistorialOATCsTable />
    </div>
  );
}
