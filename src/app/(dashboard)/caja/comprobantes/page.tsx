'use client';

import { useState, useEffect } from 'react';
import { FileText, Search, Ban, Eye, Filter, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

const supabase = createClient();

interface ComprobanteExt {
  id: string;
  tipo_comprobante: string;
  serie: string;
  correlativo: number;
  subtotal: number;
  igv: number;
  total: number;
  fecha_emision: string;
  estado: string;
  emisores: { id: string; razon_social: string; ruc: string } | null;
  agentes: { id: string; nombre: string; } | null;
  oatc: { id: string; cliente_nombre: string; punto_partida: any[] } | null;
}

export default function ComprobantesPage() {
  const [comprobantes, setComprobantes] = useState<ComprobanteExt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [searchDoc, setSearchDoc] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [filtroEmisor, setFiltroEmisor] = useState('');
  const [filtroOperativo, setFiltroOperativo] = useState('');

  // Selectores para filtros
  const [emisoresList, setEmisoresList] = useState<{id: string, razon_social: string}[]>([]);
  const [operativosList, setOperativosList] = useState<{id: string, nombre: string}[]>([]);

  // Modales
  const [selectedComp, setSelectedComp] = useState<ComprobanteExt | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  const loadData = async () => {
    if (!sedeActiva) return;
    setIsLoading(true);

    // Cargar listas para los filtros
    const { data: emisData } = await supabase.from('emisores').select('id, razon_social').eq('estado', 'ACTIVO');
    if (emisData) setEmisoresList(emisData);

    const { data: agData } = await supabase.from('agentes').select('id, nombre');
    if (agData) setOperativosList(agData);

    // Query principal
    let query = supabase.from('comprobantes').select(`
      *,
      emisores (id, razon_social, ruc),
      agentes (id, nombre),
      oatc (id, cliente_nombre, punto_partida)
    `).eq('sede_id', sedeActiva.id).order('fecha_emision', { ascending: false });

    if (fechaInicio) query = query.gte('fecha_emision', `${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) query = query.lte('fecha_emision', `${fechaFin}T23:59:59.999Z`);
    if (estadoFiltro !== 'TODOS') query = query.eq('estado', estadoFiltro);
    if (filtroEmisor) query = query.eq('emisor_id', filtroEmisor);
    if (filtroOperativo) query = query.eq('cajero_id', filtroOperativo);

    const { data, error } = await query;
    if (error) {
      console.error(error);
      showAlert('Error al cargar comprobantes', 'error');
    } else {
      let result = (data as unknown) as ComprobanteExt[];
      
      // Filtros por texto (en JS para simplificar la búsqueda en joins)
      if (searchDoc) {
        const term = searchDoc.toLowerCase();
        result = result.filter(c => 
          `${c.serie}-${c.correlativo.toString().padStart(6, '0')}`.toLowerCase().includes(term) ||
          c.tipo_comprobante.toLowerCase().includes(term)
        );
      }
      if (searchCliente) {
        const term = searchCliente.toLowerCase();
        result = result.filter(c => c.oatc?.cliente_nombre.toLowerCase().includes(term));
      }
      
      setComprobantes(result);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [sedeActiva, fechaInicio, fechaFin, estadoFiltro, filtroEmisor, filtroOperativo, searchDoc, searchCliente]);

  const handleAnular = async (id: string) => {
    if (!confirm('¿Estás seguro de anular este comprobante? Esta acción es irreversible.')) return;

    const { error } = await supabase.from('comprobantes').update({ estado: 'ANULADO' }).eq('id', id);
    if (error) {
      showAlert('Error al anular', 'error');
    } else {
      showAlert('Comprobante anulado correctamente', 'success');
      loadData(); // Recargar
    }
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600 bg-indigo-100 rounded-lg p-1" />
          Comprobantes Emitidos
        </h1>
        <p className="text-slate-500 mt-2">Auditoría, anulación y visualización de facturas, boletas y tickets.</p>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-700">
          <Filter className="w-4 h-4" /> Filtros Avanzados
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Desde</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Hasta</label>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Estado</label>
            <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500">
              <option value="TODOS">Todos</option>
              <option value="EMITIDO">Emitidos</option>
              <option value="ANULADO">Anulados</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-slate-400" />
              <input type="text" placeholder="Buscar cliente..." value={searchCliente} onChange={e => setSearchCliente(e.target.value)} className="w-full pl-8 pr-2 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Documento</label>
            <input type="text" placeholder="Ej. B001" value={searchDoc} onChange={e => setSearchDoc(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Emisor</label>
            <select value={filtroEmisor} onChange={e => setFiltroEmisor(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500">
              <option value="">Todos los Emisores</option>
              {emisoresList.map(e => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Operativo / Cajero</label>
            <select value={filtroOperativo} onChange={e => setFiltroOperativo(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-indigo-500">
              <option value="">Todos los Cajeros</option>
              {operativosList.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Emisión</th>
                <th className="p-4 font-bold border-b border-slate-200">Documento</th>
                <th className="p-4 font-bold border-b border-slate-200">Cliente</th>
                <th className="p-4 font-bold border-b border-slate-200">Emisor & Operativo</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Total</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Estado</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Cargando comprobantes...</td></tr>
              ) : comprobantes.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No se encontraron comprobantes con los filtros actuales.</td></tr>
              ) : (
                comprobantes.map(comp => (
                  <tr key={comp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(comp.fecha_emision).toLocaleDateString()}<br/>
                      <span className="text-xs text-slate-400">{new Date(comp.fecha_emision).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{comp.tipo_comprobante}</p>
                      <p className="text-sm font-medium text-slate-500">{comp.serie}-{comp.correlativo.toString().padStart(6, '0')}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {comp.oatc?.cliente_nombre || 'Cliente Final'}
                    </td>
                    <td className="p-4 text-sm">
                      <p className="font-medium text-slate-800 truncate max-w-[200px]" title={comp.emisores?.razon_social}>{comp.emisores?.razon_social}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        {comp.agentes?.nombre}
                      </p>
                    </td>
                    <td className="p-4 font-black text-slate-800 text-right">
                      ${Number(comp.total).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${comp.estado === 'EMITIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {comp.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedComp(comp); setShowDetailModal(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Ver Detalle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {comp.estado === 'EMITIDO' && (
                          <button 
                            onClick={() => handleAnular(comp.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Anular Comprobante"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalles del Comprobante */}
      {showDetailModal && selectedComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{selectedComp.tipo_comprobante}</h3>
                <p className="text-slate-300">{selectedComp.serie}-{selectedComp.correlativo.toString().padStart(6, '0')}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedComp.estado === 'EMITIDO' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border-rose-500/50'}`}>
                {selectedComp.estado}
              </span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs mb-1">Cliente</p>
                  <p className="font-medium text-slate-800">{selectedComp.oatc?.cliente_nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs mb-1">Fecha de Emisión</p>
                  <p className="font-medium text-slate-800">{new Date(selectedComp.fecha_emision).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs mb-1">Emisor</p>
                  <p className="font-medium text-slate-800">{selectedComp.emisores?.razon_social}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs mb-1">Cajero / Operativo</p>
                  <p className="font-medium text-slate-800">{selectedComp.agentes?.nombre}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Cant.</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedComp.oatc?.punto_partida || []).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3 text-slate-500">{item.cantidad || 1}</td>
                        <td className="p-3 font-medium text-slate-700">{item.nombre}</td>
                        <td className="p-3 text-right text-slate-800 font-medium">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-end text-sm space-y-2">
                <div className="flex justify-between w-48 text-slate-500">
                  <span>Subtotal:</span>
                  <span>${Number(selectedComp.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 text-slate-500">
                  <span>IGV (18%):</span>
                  <span>${Number(selectedComp.igv).toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-48 text-lg font-black text-slate-800 pt-2 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span>${Number(selectedComp.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button onClick={() => setShowDetailModal(false)} className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
