'use client';

export default function TransferenciaPanel() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-indigo-500">⇄</span> Movimiento Interno (Central ➔ Lab)
      </h2>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">FILTRAR POR LÍNEA</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
              <option>-- Todas las Líneas --</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">FILTRAR POR MARCA</label>
            <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
              <option>-- Todas las Marcas --</option>
            </select>
          </div>
        </div>
        <div>
          <input 
            type="text" 
            placeholder="Buscar por Nombre, SKU o Tipo..." 
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-center">Stock Central</th>
              <th className="px-4 py-3 text-center">Cant. a Mover</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                Selecciona productos para trasladar.
              </td>
            </tr>
          </tbody>
        </table>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium text-sm w-full transition-colors">
            CONFIRMAR TRASLADO MASIVO AL LAB
          </button>
        </div>
      </div>
    </div>
  );
}
