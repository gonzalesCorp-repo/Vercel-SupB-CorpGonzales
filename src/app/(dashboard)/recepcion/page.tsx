import NuevaOATC from '@/components/recepcion/NuevaOATC';

export default function RecepcionPage() {
  return (
    <div className="p-8 h-full bg-gray-50/50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Módulo de Recepción</h1>
        <p className="text-gray-600 mt-2">Gestiona la llegada de clientes y genera órdenes de atención.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Nueva OATC */}
        <div className="lg:col-span-1">
          <NuevaOATC />
        </div>
        
        {/* Columna Derecha: Cola (Placeholder por ahora) */}
        <div className="lg:col-span-2">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm h-full">
            <h3 className="text-md font-bold text-yellow-800 mb-3">Listado de Atención (Hoy)</h3>
            <div className="text-sm text-gray-500 italic text-center py-10 bg-white/50 rounded-lg border border-dashed border-gray-300">
              Módulo de monitorización de cola en construcción...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
