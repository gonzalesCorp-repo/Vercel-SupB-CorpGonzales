'use client';

export default function MetricasPanel() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Métricas de Laboratorio</h2>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-semibold mb-1">Despachos Hoy</p>
          <p className="text-3xl font-bold text-slate-800">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-semibold mb-1">Items en Alerta (Stock Bajo)</p>
          <p className="text-3xl font-bold text-rose-500">0</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-semibold mb-1">Valor Inventario (Central)</p>
          <p className="text-3xl font-bold text-indigo-600">S/. 0.00</p>
        </div>
      </div>
      <div className="text-center text-slate-400 py-12 border border-dashed border-slate-300 rounded-lg">
        Más gráficos y reportes se añadirán aquí.
      </div>
    </div>
  );
}
