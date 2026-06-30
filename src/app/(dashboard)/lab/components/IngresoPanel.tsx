'use client';

export default function IngresoCentralPanel() {
  return (
    <div className="p-6 h-full flex gap-6">
      {/* Columna Izquierda: Documento y Buscador */}
      <div className="w-1/3 space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2">1. DOCUMENTO DE REFERENCIA</label>
          <div className="flex gap-2">
            <select className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm bg-white">
              <option>-- Seleccione una Factura --</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2">2. FILTRAR E INGRESAR</label>
          <input 
            type="text" 
            placeholder="Buscar Insumo o SKU..." 
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      {/* Columna Derecha: Detalle de Recepción */}
      <div className="w-2/3 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-700">3. DETALLE DE RECEPCIÓN</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-right">Costo U.</th>
                <th className="pb-2 text-right">Cant.</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  Agrega productos desde el buscador
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold mb-1">TOTAL CARRITO</p>
            <p className="text-2xl font-bold text-slate-700">S/. 0.00</p>
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded shadow-sm transition-colors mb-2">
            Ingreso Directo (Stock Central)
          </button>
        </div>
      </div>
    </div>
  );
}
