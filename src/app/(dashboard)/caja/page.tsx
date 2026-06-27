'use client';

import { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckCircle2, DollarSign, CreditCard, Wallet, Search, ArrowRight } from 'lucide-react';
import { obtenerTicketsAbiertos, procesarPago, Factura } from '@/services/caja';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import BotonAsistencia from '@/components/wfm/BotonAsistencia';

export default function CajaPage() {
  const [tickets, setTickets] = useState<OATC[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<OATC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const supabase = createClient();
  
  const cargarTickets = async () => {
    setIsLoading(true);
    const data = await obtenerTicketsAbiertos();
    setTickets(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarTickets();
    
    // Realtime Suscripción
    const channel = supabase.channel('realtime-caja')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarTickets())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
        setIsModalOpen(false);
        setSelectedTicket(null);
        cargarTickets();
      }, 3000);
    }
    
    setIsProcessing(false);
  };

  const openPaymentModal = (ticket: OATC) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Punto de Venta (Caja)</h1>
          <p className="text-sm text-slate-500 mt-1">Cobra los tickets OATC pendientes y genera la facturación.</p>
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <BotonAsistencia />
          <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200 font-semibold shadow-sm whitespace-nowrap">
            {tickets.length} Pendientes
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <CheckCircle2 className="w-16 h-16 text-slate-300 mb-3" />
            <p className="font-bold text-xl text-slate-700">Todo limpio</p>
            <p className="text-sm mt-1">No hay tickets OATC pendientes de pago en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => openPaymentModal(ticket)}
                className="cursor-pointer bg-white p-5 rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-lg transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-slate-400">#{ticket.id?.split('-')[0]}</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase border border-slate-200">
                    {ticket.estado_proceso}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 truncate mb-1 text-lg group-hover:text-orange-600 transition-colors">{ticket.cliente_nombre}</h4>
                <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-3.5 h-3.5"/> {ticket.agente_nombre || 'Sin Agente Asignado'}
                </p>
                
                <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total a cobrar</span>
                    <span className="font-bold text-xl text-slate-800">
                      S/ {calcularTotal(ticket.punto_partida).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-orange-50 text-orange-600 p-2 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Procesar Pago"
        maxWidth="max-w-lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wider">Cliente a Cobrar</p>
                <p className="font-bold text-slate-900 text-xl">{selectedTicket.cliente_nombre}</p>
                <p className="text-sm text-slate-600 mt-0.5 font-medium">Ticket: #{selectedTicket.id?.split('-')[0]}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-300 opacity-50" />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Servicios y Productos</h4>
              <ul className="space-y-3">
                {selectedTicket.punto_partida?.map((item: any, i: number) => (
                  <li key={i} className="flex justify-between items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.nombre}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">{item.tipo_bien}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 shrink-0 mt-0.5">S/ {Number(item.precio_venta).toFixed(2)}</span>
                  </li>
                ))}
                {(!selectedTicket.punto_partida || selectedTicket.punto_partida.length === 0) && (
                  <li className="text-sm text-slate-500 italic p-3 text-center">No hay ítems registrados.</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Método de Pago</h4>
              <div className="grid grid-cols-2 gap-3">
                {['Efectivo', 'Tarjeta', 'Yape', 'Plin'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMetodoPago(m)}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-bold transition-all border-2 ${metodoPago === m ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                  >
                    {m === 'Tarjeta' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Total a Pagar</span>
                <span className="text-3xl font-black text-green-600 tracking-tight">S/ {calcularTotal(selectedTicket.punto_partida).toFixed(2)}</span>
              </div>
              
              {pagoExitoso ? (
                <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                  ¡Pago procesado exitosamente!
                </div>
              ) : (
                <button
                  onClick={handlePagar}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Procesando...' : `Cobrar S/ ${calcularTotal(selectedTicket.punto_partida).toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
