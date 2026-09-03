'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Printer, Download, ExternalLink, 
  CheckCircle2, AlertTriangle, Filter, RefreshCw, Eye 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { imprimirTicketTermicoHtml } from '@/lib/hardware/thermalPrinter';

const supabase = createClient();

export default function FacturasPage() {
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [modalDetalle, setModalDetalle] = useState<any | null>(null);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const cargarComprobantes = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comprobantes_pago')
        .select('*')
        .eq('sede_id', sedeActiva.id)
        .order('fecha_emision', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error cargando comprobantes:', error);
      } else {
        setComprobantes(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, [sedeActiva]);

  const handleReimprimir = (comp: any) => {
    const meta = comp.metadata_fiscal || {};
    imprimirTicketTermicoHtml({
      tipo: 'COMPROBANTE_SUNAT',
      numeroDocumento: `${comp.serie}-${String(comp.correlativo).padStart(8, '0')}`,
      clienteNombre: meta.cliente_nombre || 'Cliente General',
      clienteDniRuc: `${meta.cliente_tipo_doc || 'DOC'}: ${meta.cliente_num_doc || '00000000'}`,
      colaboradorNombre: comp.cajero_nombre || 'Cajero POS',
      items: [{
        nombre: `Consumo / Venta Registrada (${comp.tipo_comprobante})`,
        cantidad: 1,
        precioUnitario: Number(comp.total || 0),
        subtotal: Number(comp.total || 0)
      }],
      subtotal: Number(comp.subtotal || 0),
      igv: Number(comp.igv || 0),
      total: Number(comp.total || 0),
      mensajePie: `Re-impresión de Comprobante Electrónico | SUNAT Aceptado`
    }, 80);

    showAlert(`Ticket ${comp.serie}-${comp.correlativo} enviado a impresión térmica`, 'success');
  };

  const filtrados = comprobantes.filter(c => {
    const matchTexto = !filtroTexto || 
      c.serie.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.correlativo.toString().includes(filtroTexto) ||
      (c.metadata_fiscal?.cliente_nombre && c.metadata_fiscal.cliente_nombre.toLowerCase().includes(filtroTexto.toLowerCase()));
    const matchTipo = filtroTipo === 'TODOS' || c.tipo_comprobante === filtroTipo;
    return matchTexto && matchTipo;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Facturación Electrónica SUNAT PSE
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  CPEs Emitidos
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bandeja de Boletas, Facturas y Notas Electrónicas validadas con Nubefact / SUNAT REST API.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={cargarComprobantes}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer self-start md:self-auto"
          title="Recargar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filtros & Tabla */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por serie, número o cliente..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {['TODOS', 'BOLETA', 'FACTURA', 'NOTA_VENTA'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${
                  filtroTipo === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'BOLETA' ? 'Boletas' : t === 'FACTURA' ? 'Facturas' : 'Notas Venta'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                <th className="pb-2.5">Comprobante</th>
                <th className="pb-2.5">Cliente / Razón Social</th>
                <th className="pb-2.5 text-center">Fecha Emisión</th>
                <th className="pb-2.5 text-center">Total</th>
                <th className="pb-2.5 text-center">Estado SUNAT</th>
                <th className="pb-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                    Cargando comprobantes electrónicos...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron comprobantes electrónicos emitidos.
                  </td>
                </tr>
              ) : (
                filtrados.map((comp) => {
                  const meta = comp.metadata_fiscal || {};
                  return (
                    <tr key={comp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {comp.serie}-{String(comp.correlativo).padStart(8, '0')}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold">
                          {comp.tipo_comprobante}
                        </span>
                      </td>

                      <td className="py-3">
                        <p className="font-bold text-slate-800 dark:text-slate-100">{meta.cliente_nombre || 'Cliente General'}</p>
                        <p className="text-[10px] font-mono text-slate-400">{meta.cliente_num_doc || '00000000'}</p>
                      </td>

                      <td className="py-3 text-center text-slate-500 font-mono text-[11px]">
                        {comp.fecha_emision ? new Date(comp.fecha_emision).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>

                      <td className="py-3 text-center font-mono font-black text-slate-800 dark:text-white">
                        S/ {Number(comp.total).toFixed(2)}
                      </td>

                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Aceptado SUNAT
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {meta.enlace_pdf && (
                            <a
                              href={meta.enlace_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition"
                              title="Ver PDF Oficial SUNAT"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleReimprimir(comp)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-lg transition cursor-pointer"
                            title="Re-imprimir Ticket Térmico 80mm"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
