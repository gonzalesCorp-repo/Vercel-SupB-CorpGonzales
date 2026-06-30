'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { AgendaCRM } from '@/components/recepcion/AgendaCRM';
import { DirectorioCRM } from '@/components/recepcion/DirectorioCRM';

export default function AgendaMainPage() {
  const [activeTab, setActiveTab] = useState<'AGENDA' | 'DIRECTORIO'>('AGENDA');

  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            {activeTab === 'AGENDA' ? (
              <><CalendarIcon className="w-8 h-8 text-indigo-600" /> Agenda CRM</>
            ) : (
              <><Users className="w-8 h-8 text-indigo-600" /> Directorio de Clientes</>
            )}
          </h1>
          <p className="text-slate-500 mt-2">
            {activeTab === 'AGENDA' 
              ? 'Gestiona las citas y reservas programadas.' 
              : 'Administra la base de datos de clientes y sus historiales.'}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('AGENDA')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'AGENDA' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Calendario de Citas
        </button>
        <button
          onClick={() => setActiveTab('DIRECTORIO')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'DIRECTORIO' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Directorio de Clientes
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'AGENDA' ? <AgendaCRM /> : <DirectorioCRM />}
      </div>
    </div>
  );
}
