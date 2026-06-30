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

interface Emisor {
  id: string;
  razon_social: string;
  ruc: string;
}

interface SerieComprobante {
  id: string;
  emisor_id: string;
  tipo_comprobante: string;
  serie: string;
  correlativo_actual: number;
}

export default function WorkspaceCajaPage() {
  const [tickets, setTickets] = useState<OatcCaja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<OatcCaja | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [pagosMixtos, setPagosMixtos] = useState<PagoMixto[]>([]);
  
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [series, setSeries] = useState<SerieComprobante[]>([]);
  const [selectedEmisorId, setSelectedEmisorId] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('BOLETA');
  const [selectedSerieId, setSelectedSerieId] = useState<string>('');

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

  const cargarEmisoresYSeries = async () => {
    if (!sedeActiva) return;
    
    // Obtener relaciones emisores_sedes para la sede activa
    const { data: rels } = await supabase.from('emisores_sedes').select('emisor_id').eq('sede_id', sedeActiva.id).eq('estado', 'ACTIVO');
    let emis: Emisor[] = [];
    
    if (rels && rels.length > 0) {
      const { data: emisData } = await supabase.from('emisores').select('*').in('id', rels.map((r: any) => r.emisor_id)).eq('estado', 'ACTIVO');
      if (emisData) emis = emisData;
    }
    
    // Fallback para la demo: Si la sede actual no tiene emisores, traemos todos los disponibles
    if (emis.length === 0) {
      const { data: allEmis } = await supabase.from('emisores').select('*').eq('estado', 'ACTIVO');
      if (allEmis) emis = allEmis;
    }

    if (emis.length > 0) {
      setEmisores(emis);
      const { data: sers } = await supabase.from('emisores_series').select('*').in('emisor_id', emis.map((e: Emisor) => e.id)).eq('estado', 'ACTIVO');
      if (sers) setSeries(sers);
    } else {
      setEmisores([]);
      setSeries([]);
    }
  };

  useEffect(() => {
    cargarTicketsCaja();
    cargarEmisoresYSeries();
    
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
    
    if (emisores.length > 0) {
      const defaultEmisor = emisores[0].id;
      setSelectedEmisorId(defaultEmisor);
      setSelectedTipo('BOLETA');
      const defaultSerie = series.find(s => s.emisor_id === defaultEmisor && s.tipo_comprobante === 'BOLETA');
      if (defaultSerie) setSelectedSerieId(defaultSerie.id);
      else setSelectedSerieId('');
    }
    
    setIsModalOpen(true);
  };

  const handleProcesarPago = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    let cajero_id = null;
    if (user) {
      const { data: agente } = await supabase.from('agentes').select('id').eq('email', user.email).single();
      if (agente) cajero_id = agente.id;
    }
    
    const serieObj = series.find(s => s.id === selectedSerieId);
    if (!serieObj) {
      showAlert('Seleccione una serie válida', 'error');
      setIsProcessing(false);
      return;
    }
    
    const nextCorrelativo = serieObj.correlativo_actual + 1;
    const totalCalc = selectedTicket.total_calculado || 0;
    
    // Iniciar el registro de comprobante
    await supabase.from('emisores_series').update({ correlativo_actual: nextCorrelativo }).eq('id', serieObj.id);

    const { data: comp, error: compErr } = await supabase.from('comprobantes').insert({
      oatc_id: selectedTicket.id,
      sede_id: sedeActiva?.id,
      cajero_id: cajero_id,
      emisor_id: selectedEmisorId,
      tipo_comprobante: selectedTipo,
      serie: serieObj.serie,
      correlativo: nextCorrelativo,
      subtotal: totalCalc / 1.18,
      igv: totalCalc - (totalCalc / 1.18),
      total: totalCalc
    }).select().single();
    
    if (comp && !compErr) {
      const pagosToInsert = pagosMixtos.map(p => ({
        comprobante_id: comp.id,
        oatc_id: selectedTicket.id,
        sede_id: sedeActiva?.id,
        metodo_pago: p.metodo,
        monto: p.monto
      }));
      await supabase.from('pagos').insert(pagosToInsert);
    }

    // 1. Marcar OATC como Pagada
    const { error } = await supabase
      .from('oatc')
      .update({ estado_pago: 'Pagado' })
      .eq('id', selectedTicket.id);

    // 2. Liberar al Agente
    if (!error && selectedTicket.agente_id) {
      try {
        await supabase
          .from('agentes')
          .update({ estado: 'DISPONIBLE' })
          .eq('id', selectedTicket.agente_id);
      } catch (err) {
        console.warn("No se pudo liberar agente:", err);
      }
    }
    
    if (!error && !compErr) {
      const metodosDetalle = pagosMixtos.map(p => `${p.metodo} ($${p.monto.toFixed(2)})`).join(', ');
      showAlert(`Comprobante ${serieObj.serie}-${nextCorrelativo.toString().padStart(6, '0')} emitido con éxito. Pagos: ${metodosDetalle}`, 'success');
    } else {
      showAlert('Error al procesar el pago o comprobante', 'error');
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
            {/* Datos del Comprobante (Reubicado arriba) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Datos del Comprobante</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Emisor (Razón Social)</label>
                  <select 
                    value={selectedEmisorId} 
                    onChange={(e) => {
                      setSelectedEmisorId(e.target.value);
                      const defSerie = series.find(s => s.emisor_id === e.target.value && s.tipo_comprobante === selectedTipo);
                      setSelectedSerieId(defSerie ? defSerie.id : '');
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
                  >
                    {emisores.map(emi => (
                      <option key={emi.id} value={emi.id}>{emi.razon_social} (RUC: {emi.ruc})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                    <select 
                      value={selectedTipo} 
                      onChange={(e) => {
                        setSelectedTipo(e.target.value);
                        const defSerie = series.find(s => s.emisor_id === selectedEmisorId && s.tipo_comprobante === e.target.value);
                        setSelectedSerieId(defSerie ? defSerie.id : '');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
                    >
                      <option value="BOLETA">Boleta</option>
                      <option value="FACTURA">Factura</option>
                      <option value="TICKET">Ticket Interno</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Serie</label>
                    <select 
                      value={selectedSerieId} 
                      onChange={(e) => setSelectedSerieId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
                    >
                      {series.filter(s => s.emisor_id === selectedEmisorId && s.tipo_comprobante === selectedTipo).map(ser => (
                        <option key={ser.id} value={ser.id}>{ser.serie} (Sig: {(ser.correlativo_actual + 1).toString().padStart(6, '0')})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle de Consumo (Reubicado abajo) */}
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
