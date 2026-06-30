'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Search, CheckCircle, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { OATC } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { Modal } from '@/components/ui/Modal';

const supabase = createClient();

interface OatcCaja extends OATC {
  total_calculado?: number;
}

interface PagoMixto {
  metodo: string;
  monto: number;
}

export default function WorkspaceCajaPage() {
  const [tickets, setTickets] = useState<OatcCaja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<OatcCaja | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [pagosMixtos, setPagosMixtos] = useState<PagoMixto[]>([]);
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  const cargarTicketsCaja = async () => {
    if (!sedeActiva) return;
    setIsLoading(true);
    
    // Traemos las OATC listas para cobro
    let query = supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeActiva.id)
      .in('estado_proceso', ['POR_COBRAR', 'PRE_COBRADO'])
      .or('estado_pago.neq.Pagado,estado_pago.is.null');
      
    if (fechaFiltro) {
      query = query.gte('created_at', `${fechaFiltro}T00:00:00.000Z`)
                   .lte('created_at', `${fechaFiltro}T23:59:59.999Z`);
    }

    const { data, error } = await query;
      
    if (error) {
      console.error('Error cargando caja:', error);
    } else {
      // Calcular totales
      const mapped = (data as OATC[]).map(t => {
        const total = (t.punto_partida || []).reduce((acc: number, item: any) => {
          return acc + ((item.precio || 0) * (item.cantidad || 1));
        }, 0);
        return { ...t, total_calculado: total };
      });
      setTickets(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarTicketsCaja();
    
    // Realtime Suscripción para Caja
    const channel = supabase.channel('realtime-caja')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'oatc' }, (payload: any) => {
        if (['POR_COBRAR', 'PRE_COBRADO'].includes(payload.new.estado_proceso)) {
          cargarTicketsCaja();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeActiva, fechaFiltro]);

  const openCobroModal = (ticket: OatcCaja) => {
    setSelectedTicket(ticket);
    setPagosMixtos([{ metodo: 'Efectivo', monto: ticket.total_calculado || 0 }]);
    setIsModalOpen(true);
  };

  const handleProcesarPago = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    
    // 1. Marcar OATC como Pagada (podemos guardar metodo_pago si la tabla lo soporta en el futuro)
    const { error } = await supabase
      .from('oatc')
      .update({ estado_pago: 'Pagado' })
      .eq('id', selectedTicket.id);

    // 2. Liberar al Agente (Fast-pass) - Usamos try-catch para evitar que un fallo de constraint detenga el éxito
    if (!error && selectedTicket.agente_id) {
      try {
        await supabase
          .from('agentes')
          .update({ estado: 'Disponible' }) // Usar Capitalize por si el check constraint lo pide
          .eq('id', selectedTicket.agente_id);
      } catch (err) {
        console.warn("No se pudo liberar agente:", err);
      }
    }
    
    if (!error) {
      const metodosDetalle = pagosMixtos.map(p => `${p.metodo} ($${p.monto.toFixed(2)})`).join(', ');
      showAlert(`Comprobante emitido con éxito a nombre de Vaikunta SAC. Pagos: ${metodosDetalle}`, 'success');
    } else {
      showAlert('Error al procesar el pago', 'error');
    }
    
    setIsProcessing(false);
    setIsModalOpen(false);
    setSelectedTicket(null);
    setPagosMixtos([]);
    cargarTicketsCaja();
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600 bg-emerald-100 rounded-lg p-1" />
            Workspace de Caja (POS)
          </h1>
          <p className="text-slate-500 mt-2">Liquidación y cobro de atenciones finalizadas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 shadow-sm h-[42px]">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="date" 
              value={fechaFiltro} 
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="px-1 text-sm outline-none border-none text-slate-600 font-medium bg-transparent"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Buscar por cliente o ticket..." 
              className="w-full sm:w-64 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm h-[42px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="font-medium text-slate-600">Buscando atenciones pendientes de cobro...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Caja al día</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">No hay clientes esperando para pagar. Todas las atenciones finalizadas han sido procesadas.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Cliente / Ticket</th>
                  <th className="px-6 py-4">Agente Responsable</th>
                  <th className="px-6 py-4">Servicios (Incl. Upsell)</th>
                  <th className="px-6 py-4 text-right">Total a Cobrar</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ticket.cliente_nombre}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        <Clock className="w-3 h-3 inline-block mr-1" />
                        {new Date(ticket.created_at || '').toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{ticket.agente_nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(ticket.punto_partida || []).map((item: any, i: number) => (
                          <span key={i} className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md">
                            {item.servicio} (x{item.cantidad || 1})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-lg">
                      ${ticket.total_calculado?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openCobroModal(ticket)}
                        className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-xs uppercase tracking-wider"
                      >
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Cobro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Liquidación de Orden`} maxWidth="max-w-md">
        {selectedTicket && (
          <div className="mt-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalle de Consumo</h4>
              <ul className="space-y-2 mb-4">
                {(selectedTicket.punto_partida || []).map((item: any, i: number) => (
                  <li key={i} className="flex justify-between text-sm text-slate-700 font-medium">
                    <span>{item.cantidad || 1}x {item.servicio}</span>
                    <span>${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">TOTAL</span>
                <span className="text-3xl font-black text-emerald-600">${selectedTicket.total_calculado?.toFixed(2)}</span>
              </div>
            </div>

            {/* Pagos Mixtos */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pago</label>
                <button 
                  onClick={() => setPagosMixtos([...pagosMixtos, { metodo: 'Efectivo', monto: 0 }])}
                  className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                >
                  <Plus className="w-3 h-3 mr-1" /> Dividir Pago
                </button>
              </div>
              
              <div className="space-y-3">
                {pagosMixtos.map((pago, index) => (
                  <div key={index} className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-sm">
                    <select 
                      value={pago.metodo} 
                      onChange={(e) => {
                        const newPagos = [...pagosMixtos];
                        newPagos[index].metodo = e.target.value;
                        setPagosMixtos(newPagos);
                      }}
                      className="flex-1 bg-transparent border-none text-sm text-slate-700 font-bold outline-none cursor-pointer"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                    
                    <div className="relative w-32">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-slate-400 font-bold">$</span>
                      </div>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={pago.monto || ''}
                        onChange={(e) => {
                          const newPagos = [...pagosMixtos];
                          newPagos[index].monto = parseFloat(e.target.value) || 0;
                          setPagosMixtos(newPagos);
                        }}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                      />
                    </div>
                    
                    {pagosMixtos.length > 1 && (
                      <button 
                        onClick={() => {
                          const newPagos = pagosMixtos.filter((_, i) => i !== index);
                          setPagosMixtos(newPagos);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totales Resumen */}
              {(() => {
                const totalPagado = pagosMixtos.reduce((acc, p) => acc + (p.monto || 0), 0);
                const restante = (selectedTicket.total_calculado || 0) - totalPagado;
                const isExact = Math.abs(restante) < 0.01;
                
                return (
                  <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-slate-500 font-medium">Total Pagado:</span>
                      <span className="font-bold text-slate-700">${totalPagado.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-sm font-bold ${isExact ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span>Restante:</span>
                      <span>${restante > 0 ? restante.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button 
              onClick={handleProcesarPago}
              disabled={isProcessing || Math.abs((selectedTicket.total_calculado || 0) - pagosMixtos.reduce((a, p) => a + (p.monto || 0), 0)) > 0.01}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <CreditCard className="w-6 h-6" />
              {isProcessing ? 'Procesando pago...' : 'Confirmar Pago Recibido'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
