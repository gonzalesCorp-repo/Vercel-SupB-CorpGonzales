'use client';

import { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckCircle2, DollarSign, CreditCard, Wallet, Search } from 'lucide-react';
import { obtenerTicketsAbiertos, procesarPago, Factura } from '@/services/caja';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CajaPage() {
  const [tickets, setTickets] = useState<OATC[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<OATC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  const cargarTickets = async () => {
    setIsLoading(true);
    const data = await obtenerTicketsAbiertos();
    setTickets(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  // Calcular total de los bienes (punto de partida)
  const calcularTotal = (puntoPartida: any[]): number => {
    if (!puntoPartida) return 0;
    return puntoPartida.reduce((sum, item) => sum + (Number(item.precio_venta) || 0), 0);
  };

  const handlePagar = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    
    const total = calcularTotal(selectedTicket.punto_partida);
    
    const factura: Factura = {
      oatc_id: selectedTicket.id!,
      cliente_nombre: selectedTicket.cliente_nombre,
      total: total,
      metodo_pago: metodoPago,
      detalles: selectedTicket.punto_partida
    };

    const exito = await procesarPago(factura);
    
    if (exito) {
      setPagoExitoso(true);
      setTimeout(() => {
        setPagoExitoso(false);
        setSelectedTicket(null);
        cargarTickets();
      }, 3000);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Punto de Venta (Caja)</h1>
        <p className="text-sm text-gray-500 mt-1">Cobra los tickets OATC pendientes y genera la facturación.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Tickets Pendientes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" /> 
                Tickets OATC Abiertos
              </h3>
              <span className="text-xs bg-orange-100 text-orange-800 py-1 px-2.5 rounded-full font-bold">
                {tickets.length} pendientes
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-70">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mb-3" />
                  <p className="font-medium text-lg text-gray-600">Todo limpio</p>
                  <p className="text-sm">No hay tickets OATC pendientes de pago en este momento.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className={`cursor-pointer bg-white p-4 rounded-xl border-2 transition-all ${selectedTicket?.id === ticket.id ? 'border-orange-500 shadow-md ring-2 ring-orange-100' : 'border-gray-200 hover:border-orange-300 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400">#{ticket.id?.split('-')[0]}</span>
                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                          {ticket.estado_proceso}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 truncate mb-1">{ticket.cliente_nombre}</h4>
                      <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                        <Briefcase className="w-3 h-3"/> {ticket.agente_nombre || 'Sin Agente Asignado'}
                      </p>
                      
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es }) : 'Reciente'}
                        </span>
                        <span className="font-bold text-orange-600">
                          S/ {calcularTotal(ticket.punto_partida).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen y Pago */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-24 flex flex-col max-h-[calc(100vh-140px)]">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Resumen de Venta
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedTicket ? (
                <div className="text-center text-gray-400 py-10">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">Selecciona un ticket de la lista para procesar el cobro.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Detalle del Cliente */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Cliente a Cobrar</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedTicket.cliente_nombre}</p>
                    <p className="text-sm text-gray-600 mt-1">Ticket: #{selectedTicket.id?.split('-')[0]}</p>
                  </div>

                  {/* Items del Carrito */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">Servicios y Productos</h4>
                    <ul className="space-y-3">
                      {selectedTicket.punto_partida?.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{item.nombre}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.tipo_bien}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 shrink-0 mt-0.5">S/ {Number(item.precio_venta).toFixed(2)}</span>
                        </li>
                      ))}
                      {(!selectedTicket.punto_partida || selectedTicket.punto_partida.length === 0) && (
                        <li className="text-sm text-gray-500 italic">No hay ítems registrados.</li>
                      )}
                    </ul>
                  </div>

                  {/* Métodos de Pago */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">Método de Pago</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Efectivo', 'Tarjeta', 'Yape', 'Plin'].map(m => (
                        <button
                          key={m}
                          onClick={() => setMetodoPago(m)}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${metodoPago === m ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                        >
                          {m === 'Tarjeta' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total y Botón Pagar */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">Total a Pagar</span>
                <span className="text-3xl font-black text-gray-900">
                  S/ {selectedTicket ? calcularTotal(selectedTicket.punto_partida).toFixed(2) : '0.00'}
                </span>
              </div>
              
              {pagoExitoso ? (
                <div className="bg-green-600 text-white p-3 rounded-lg font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Pago Procesado!
                </div>
              ) : (
                <button
                  onClick={handlePagar}
                  disabled={!selectedTicket || isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white p-3.5 rounded-lg font-bold text-base transition-colors flex justify-center items-center gap-2 shadow-sm"
                >
                  {isProcessing ? 'Procesando...' : `Confirmar Cobro en ${metodoPago}`}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
