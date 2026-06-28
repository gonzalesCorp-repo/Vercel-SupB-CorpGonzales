'use client';

import React, { useState } from 'react';
import NuevaOATC from '@/components/recepcion/NuevaOATC';
import QueueMonitor from '@/components/recepcion/QueueMonitor';
import ActiveOATCsTable from '@/components/recepcion/ActiveOATCsTable';
import { Modal } from '@/components/ui/Modal';
import { FloatingWindow } from '@/components/ui/FloatingWindow';
import { Plus } from 'lucide-react';

export default function RecepcionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Módulo de Recepción</h1>
        <p className="text-slate-500 mt-2">Gestiona la llegada de clientes y órdenes de atención.</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna Izquierda (30%): Monitor de Cola */}
        <div className="w-full lg:w-[30%]">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-full">
            <QueueMonitor />
          </div>
        </div>
        
        {/* Columna Derecha (70%): Gestión de Atenciones */}
        <div className="w-full lg:w-[70%] flex flex-col gap-6">
          {/* Header de Gestión y Botón Principal */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Panel de Control de Sala</h2>
              <p className="text-xs text-slate-500">Visualiza y coordina las atenciones en curso.</p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-md shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              Generar Nueva OATC
            </button>
          </div>

          {/* Tabla de Atenciones */}
          <ActiveOATCsTable />
        </div>
      </div>

      {/* Modal del Formulario Flotante */}
      <FloatingWindow 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nueva Orden (OATC)"
      >
        <NuevaOATC onClose={() => setIsModalOpen(false)} />
      </FloatingWindow>
    </div>
  );
}
