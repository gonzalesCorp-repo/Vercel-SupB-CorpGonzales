'use client';

import React, { useState } from 'react';
import NuevaOATC from '@/components/recepcion/NuevaOATC';
import QueueMonitor from '@/components/recepcion/QueueMonitor';
import ActiveOATCsTable from '@/components/recepcion/ActiveOATCsTable';
import BuzonAutorizaciones from '@/components/recepcion/BuzonAutorizaciones';
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
          {/* Buzón de Autorizaciones y Alertas */}
          <BuzonAutorizaciones />

          {/* Tabla de Atenciones */}
          <ActiveOATCsTable onGenerarOrden={() => setIsModalOpen(true)} />
        </div>
      </div>

      {/* Modal del Formulario Flotante */}
      <FloatingWindow 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Orden de Atención"
      >
        <NuevaOATC onClose={() => setIsModalOpen(false)} />
      </FloatingWindow>
    </div>
  );
}
