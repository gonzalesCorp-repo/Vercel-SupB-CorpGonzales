'use client';

import { useState } from 'react';
import { Beaker, ArrowRightLeft, PackageSearch, Download, LayoutDashboard } from 'lucide-react';
import DespachoPanel from './components/DespachoPanel';
import KardexPanel from './components/KardexPanel';
import TransferenciaPanel from './components/TransferenciaPanel';
import StockPanel from './components/StockPanel';
import IngresoPanel from './components/IngresoPanel';
import MetricasPanel from './components/MetricasPanel';

export default function LabWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'despacho'|'kardex'|'transferencia'|'stock'|'ingreso'|'metricas'>('despacho');

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[calc(100vh-4rem)]">
      {/* Top Header / Navigation */}
      <div className="bg-slate-900 text-slate-200 px-6 py-3 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <Beaker className="w-5 h-5 text-indigo-400" />
          <h1 className="font-bold tracking-wide">
            WMS Lab <span className="text-slate-400 font-light">| Beauty</span>
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <button 
            onClick={() => setActiveTab('despacho')}
            className={`flex items-center gap-2 px-2 py-1 border-b-2 transition-colors ${activeTab === 'despacho' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Despacho (ODI)
          </button>
          
          {/* Sub-menu for Gestión Almacén */}
          <div className="flex items-center gap-4 border-l border-slate-700 pl-6">
            <button 
              onClick={() => setActiveTab('kardex')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'kardex' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Kardex
            </button>
            <button 
              onClick={() => setActiveTab('transferencia')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'transferencia' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Transferencia Lab
            </button>
            <button 
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'stock' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stock & Ubicación
            </button>
            <button 
              onClick={() => setActiveTab('ingreso')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'ingreso' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Ingreso Central
            </button>
            <button 
              onClick={() => setActiveTab('metricas')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'metricas' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Métricas
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'despacho' && <DespachoPanel />}
          
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* The rest of the tabs share the same white container block style from screenshots */}
            {activeTab === 'kardex' && <KardexPanel />}
            {activeTab === 'transferencia' && <TransferenciaPanel />}
            {activeTab === 'stock' && <StockPanel />}
            {activeTab === 'ingreso' && <IngresoPanel />}
            {activeTab === 'metricas' && <MetricasPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
