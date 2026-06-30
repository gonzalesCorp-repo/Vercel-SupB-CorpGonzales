'use client';

export default function StockPanel() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Existencias Actuales y Ubicación</h2>
        <input 
          type="text" 
          placeholder="Filtrar por nombre o ubicación..." 
          className="border border-slate-300 rounded px-4 py-2 text-sm w-64"
        />
      </div>
      
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Producto / Marca</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3 text-center">Stock Central</th>
              <th className="px-4 py-3 text-center">Stock Lab</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                Cargando inventario...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
