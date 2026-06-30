'use client';

export default function DespachoPanel() {
  return (
    <div className="flex gap-4 h-full">
      {/* Panel Izquierdo: Órdenes Pendientes */}
      <div className="w-1/2 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Órdenes de Servicio <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">0</span>
          </h2>
          <div className="flex gap-2">
            <button className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">Pendientes</button>
            <button className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200">Todas</button>
          </div>
        </div>
        
        <div className="text-sm text-slate-500 text-center py-12">
          No hay órdenes pendientes de despacho.
        </div>
      </div>
      
      {/* Panel Derecho: Historial (Hoy) */}
      <div className="w-1/2 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Historial de Despachos (Hoy)</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Buscar OATC..." className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1" />
          <input type="text" placeholder="Agente..." className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1" />
        </div>
        
        <div className="flex-1 overflow-auto border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-500 text-center py-12">
            Aún no hay despachos hoy.
          </div>
        </div>
      </div>
    </div>
  );
}
