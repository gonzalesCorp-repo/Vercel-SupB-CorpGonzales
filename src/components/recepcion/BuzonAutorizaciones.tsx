'use client';

import React, { useEffect, useState } from 'react';
import { obtenerAutorizacionesPendientes, resolverAutorizacion, OATC } from '@/services/recepcion';
import { ShieldAlert, Check, X, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function BuzonAutorizaciones() {
  const [pendientes, setPendientes] = useState<OATC[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const cargarPendientes = async () => {
    const data = await obtenerAutorizacionesPendientes();
    setPendientes(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarPendientes();
    const channel = supabase.channel('realtime-autorizaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, cargarPendientes)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleResolver = async (id: string, aprobar: boolean) => {
    if (confirm(`¿${aprobar ? 'Aprobar' : 'Rechazar'} la solicitud de adición de servicios?`)) {
      setLoading(true);
      await resolverAutorizacion(id, aprobar);
      cargarPendientes();
    }
  };

  if (loading && pendientes.length === 0) return null;
  if (pendientes.length === 0) return null;

  return (
    <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-2xl shadow-sm mb-6 animate-pulse-slow">
      <div className="flex items-center gap-3 mb-4 text-orange-800">
        <ShieldAlert className="w-6 h-6" />
        <h3 className="font-bold text-lg flex-1">Buzón de Autorizaciones (Upselling)</h3>
        <span className="bg-orange-600 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
          <Bell className="w-3 h-3" /> {pendientes.length} Pendientes
        </span>
      </div>
      
      <div className="space-y-3">
        {pendientes.map(ticket => (
          <div key={ticket.id} className="bg-white border border-orange-200 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
            <div>
              <p className="font-bold text-slate-800">
                Cliente: {ticket.cliente_nombre} <span className="text-slate-400 font-normal">| Agente: {ticket.agente_nombre}</span>
              </p>
              <div className="mt-2 text-sm text-slate-600">
                <span className="font-bold text-slate-700">Servicios Solicitados a agregar:</span>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {ticket.cambios_pendientes?.nuevos_servicios?.map((ns: any, idx: number) => (
                    <li key={idx}><span className="font-medium">{ns.nombre}</span> <span className="text-slate-400">(${ns.precio})</span></li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => ticket.id && handleResolver(ticket.id, false)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" /> Rechazar
              </button>
              <button 
                onClick={() => ticket.id && handleResolver(ticket.id, true)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors"
              >
                <Check className="w-4 h-4" /> Aprobar Cambios
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
