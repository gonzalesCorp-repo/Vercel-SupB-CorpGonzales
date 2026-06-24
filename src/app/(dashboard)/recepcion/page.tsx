import NuevaOATC from '@/components/recepcion/NuevaOATC';
import QueueMonitor from '@/components/recepcion/QueueMonitor';

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
        
        {/* Columna Derecha: Cola */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full">
            <QueueMonitor />
          </div>
        </div>
      </div>
    </div>
  );
}
