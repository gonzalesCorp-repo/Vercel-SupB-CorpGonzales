'use client';

import { useState, useEffect } from 'react';
import { User, CheckSquare, Plus, Bell, RefreshCw } from 'lucide-react';
import { obtenerTicketsAsignados, terminarAtencion, pedirInsumo, PedidoInsumo } from '@/services/operaciones';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

export default function OperacionesPage() {
  const [tickets, setTickets] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  
  // Para pruebas rápidas, asumimos que somos Juan Pérez. En la app real sacaremos esto del Auth Context.
  const AGENTE_NOMBRE_DEMO = 'Juan Pérez'; 

  const [insumo, setInsumo] = useState('');
  const [isEnviando, setIsEnviando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');

  const cargarMisTickets = async () => {
    setIsLoading(true);
    const data = await obtenerTicketsAsignados(AGENTE_NOMBRE_DEMO);
    setTickets(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarMisTickets();
    
    // Realtime Suscripción
    const channel = supabase.channel('realtime-operaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarMisTickets())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTerminar = async (ticketId: string) => {
    if (confirm("¿Estás seguro de terminar la atención de este cliente? Pasará a caja para el cobro.")) {
      await terminarAtencion(ticketId);
      cargarMisTickets();
    }
  };

  const handlePedirInsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumo) return;
    
    setIsEnviando(true);
    const pedido: PedidoInsumo = {
      agente_id: 'd0e3a9c7-5e60-4e4c-8b8a-3d2e1f8a9b7c', // ID dummy por ahora
      agente_nombre: AGENTE_NOMBRE_DEMO,
      insumo_solicitado: insumo
    };
    
    const exito = await pedirInsumo(pedido);
    if (exito) {
      setMensajeOk('¡Pedido enviado al laboratorio!');
      setInsumo('');
      setTimeout(() => setMensajeOk(''), 3000);
    }
    setIsEnviando(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hola, {AGENTE_NOMBRE_DEMO}</h1>
            <p className="text-sm text-gray-500">Panel de Operaciones en Cabina</p>
          </div>
        </div>
        <button onClick={cargarMisTickets} className="p-2 text-gray-400 hover:text-indigo-600 transition">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mis Clientes Actuales */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Mis Clientes Activos
          </h2>
          
          {isLoading ? (
            <div className="text-center p-8 bg-white rounded-xl border border-gray-200">Cargando...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500">
              No tienes clientes asignados en este momento.
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="bg-white p-5 rounded-xl border-l-4 border-l-indigo-500 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{ticket.cliente_nombre}</h3>
                  <span className="text-xs text-gray-400">
                    {ticket.created_at ? formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es }) : ''}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Servicios a realizar:</p>
                  <ul className="text-sm space-y-1 text-gray-700">
                    {ticket.punto_partida?.map((item: any, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                        {item.nombre}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handleTerminar(ticket.id!)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckSquare className="w-5 h-5" />
                  Terminar Atención
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pedir Insumos al Laboratorio */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Solicitud Rápida a Laboratorio
          </h2>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handlePedirInsumo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">¿Qué necesitas?</label>
                <textarea 
                  value={insumo}
                  onChange={e => setInsumo(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                  placeholder="Ej: Mezcla tinte rubio cenizo, Toallas limpias, Guantes M..."
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isEnviando || !insumo}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {isEnviando ? 'Enviando...' : 'Pedir Insumo'}
              </button>
              
              {mensajeOk && (
                <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
                  {mensajeOk}
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
