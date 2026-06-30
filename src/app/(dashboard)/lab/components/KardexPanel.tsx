'use client';

export default function KardexPanel() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Kardex: Historial de Movimientos</h2>
        <input 
          type="text" 
          placeholder="Filtrar por SKU o Tipo..." 
          className="border border-slate-300 rounded px-4 py-2 text-sm w-64"
        />
      </div>
      
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-slate-200 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Fecha / Hora</th>
              <th className="px-4 py-3">SKU / Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              <th className="px-4 py-3">Almacén</th>
              <th className="px-4 py-3">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No hay movimientos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
