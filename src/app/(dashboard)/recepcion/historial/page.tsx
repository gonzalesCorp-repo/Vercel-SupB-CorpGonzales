'use client';

import React from 'react';
import HistorialOATCsTable from '@/components/recepcion/HistorialOATCsTable';
import { BulkUploader } from '@/components/ui/BulkUploader';

export default function HistorialRecepcionPage() {
  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Historial de Órdenes</h1>
          <p className="text-slate-500 mt-2">Consulta todas las atenciones generadas y su estado final.</p>
        </div>
        <BulkUploader 
          tableName="oatc" 
          title="Importar Órdenes Históricas" 
          buttonClassName="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors shadow-sm font-semibold"
        />
      </div>
      
      <HistorialOATCsTable />
    </div>
  );
}
