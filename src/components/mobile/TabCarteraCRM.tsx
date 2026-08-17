'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, UserPlus, Phone, MessageSquare, Sparkles, CheckCircle2, 
  Shield, FileText, X, Crown, HeartHandshake, ShoppingBag, UserCheck, Star, 
  ChevronRight, Calendar, DollarSign
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Cliente, crearCliente } from '@/services/clientes';
import { 
  ReglaEtiquetaCliente, obtenerReglasEtiquetas, calcularMetricasCliente, 
  evaluarEtiquetas, MetricasCliente 
} from '@/services/reglasClientes';

const ICON_MAP: Record<string, any> = {
  Crown,
  Sparkles,
  HeartHandshake,
  ShoppingBag,
  UserCheck,
  Star
};

interface ClienteCartera {
  id: string;
  nombre: string;
  dni?: string;
  celular?: string;
  ultimoServicio: string;
  ultimaVisita: string;
  notasTecnicas: string;
  metricas?: MetricasCliente;
  insigniasGanadas: ReglaEtiquetaCliente[];
}

interface TabCarteraCRMProps {
  agenteNombre?: string;
  agenteId?: string;
}

export function TabCarteraCRM({ agenteNombre = 'Demócrito de Abdera', agenteId }: TabCarteraCRMProps) {
  const [query, setQuery] = useState('');
  const [clientes, setClientes] = useState<ClienteCartera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reglas, setReglas] = useState<ReglaEtiquetaCliente[]>([]);

  // Modales
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoCelular, setNuevoCelular] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCartera | null>(null);
  const [feedback, setFeedback] = useState('');

  const cargarCartera = async () => {
    setCargando(true);
    try {
      const supabase = createClient();

      // 1. Obtener reglas activas
      const reglasActivas = await obtenerReglasEtiquetas(true);
      setReglas(reglasActivas);

      // 2. Consultar clientes asignados a este especialista o atendidos por él en OATCs
      let queryClientes = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      // Si tenemos agenteId, filtramos por agente_id o consultamos clientes de sus OATCs
      if (agenteId) {
        queryClientes = queryClientes.eq('agente_id', agenteId);
      }

      const { data: dataClientes } = await queryClientes.limit(40);

      // 3. También buscar clientes que tienen OATC con este especialista
      let oatcClientes: any[] = [];
      if (agenteNombre) {
        const { data: oatcs } = await supabase
          .from('oatc')
          .select('cliente_id, cliente_nombre, created_at, estado_proceso')
          .ilike('agente_nombre', `%${agenteNombre}%`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (oatcs) {
          oatcClientes = oatcs;
        }
      }

      // Unificar lista sin duplicados
      const mapClientes = new Map<string, any>();
      (dataClientes || []).forEach((c: any) => mapClientes.set(c.nombre.toLowerCase().trim(), c));
      
      oatcClientes.forEach((o: any) => {
        const key = (o.cliente_nombre || '').toLowerCase().trim();
        if (key && !mapClientes.has(key)) {
          mapClientes.set(key, {
            id: o.cliente_id || `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            nombre: o.cliente_nombre,
            created_at: o.created_at
          });
        }
      });

      const listaUnificada = Array.from(mapClientes.values());

      // 4. Calcular métricas e insignias para cada cliente de la cartera
      const mapeados: ClienteCartera[] = await Promise.all(
        listaUnificada.map(async (c: any) => {
          const metricas = await calcularMetricasCliente(c.id, c.nombre, c.dni);
          const insignias = evaluarEtiquetas(metricas, reglasActivas);

          return {
            id: c.id,
            nombre: c.nombre,
            dni: c.dni,
            celular: c.celular || c.telefono,
            ultimoServicio: c.notas ? 'Historial con Fórmula' : 'Atención en Salón',
            ultimaVisita: c.created_at ? new Date(c.created_at).toLocaleDateString('es-PE') : 'Reciente',
            notasTecnicas: c.notas || 'Sin notas técnicas registradas aún.',
            metricas,
            insigniasGanadas: insignias
          };
        })
      );

      setClientes(mapeados);
    } catch (e) {
      console.warn('Error cargando cartera del staff:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCartera();
  }, [agenteNombre, agenteId]);

  const filtrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(query.toLowerCase()) || 
    (c.dni && c.dni.includes(query)) ||
    (c.celular && c.celular.includes(query))
  );

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const nuevo: ClienteCartera = {
      id: `cli_${Date.now()}`,
      nombre: nuevoNombre.trim(),
      dni: nuevoDni.trim() || undefined,
      celular: nuevoCelular.trim() || undefined,
      ultimoServicio: 'Cliente Nuevo',
      ultimaVisita: 'Hoy',
      notasTecnicas: nuevasNotas.trim() || 'Registrado desde la App Móvil del Staff.',
      insigniasGanadas: []
    };

    try {
      await crearCliente({
        nombre: nuevoNombre.trim(),
        dni: nuevoDni.trim() || undefined,
        celular: nuevoCelular.trim() || undefined,
        agente_id: agenteId || null
      });
    } catch (e) {
      console.warn('Fallback local para CRM:', e);
    }

    setClientes([nuevo, ...clientes]);
    setModalRegistroOpen(false);
    setNuevoNombre('');
    setNuevoDni('');
    setNuevoCelular('');
    setNuevasNotas('');
    setFeedback('¡Cliente registrado en tu Cartera de Bolsillo!');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header CRM */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" /> Mi Cartera Exclusiva
          </span>
          <h3 className="text-sm font-black text-white">Clientes de {agenteNombre.split(' ')[0]}</h3>
        </div>

        <button
          onClick={() => setModalRegistroOpen(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Nuevo</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Buscador de Cartera */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, DNI o celular..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition font-medium"
        />
      </div>

      {/* Lista de Clientes de la Cartera */}
      {cargando ? (
        <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
          Cargando tu cartera e insignias ganadas...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-slate-700 mx-auto" />
          <p className="text-xs text-slate-400 font-bold">No tienes clientes que coincidan con la búsqueda</p>
          <p className="text-[10px] text-slate-500">Registra un nuevo cliente con el botón + Nuevo.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtrados.map((c) => {
            return (
              <div
                key={c.id}
                onClick={() => setClienteSeleccionado(c)}
                className="p-3.5 bg-slate-900/80 hover:bg-slate-850 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition cursor-pointer space-y-2.5 shadow-sm active:scale-[0.99]"
              >
                {/* Header Cliente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                      {c.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{c.nombre}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {c.dni ? `DNI: ${c.dni}` : 'Sin DNI'} • {c.celular || 'Sin celular'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>

                {/* Insignias Ganadas del Cliente */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {c.insigniasGanadas.length > 0 ? (
                    c.insigniasGanadas.map((ins) => {
                      const IconComp = ICON_MAP[ins.icono] || Sparkles;
                      return (
                        <span
                          key={ins.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${ins.color_badge}`}
                        >
                          <IconComp className="w-3 h-3" />
                          {ins.nombre}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold italic">
                      Consumidor Ocasional
                    </span>
                  )}
                </div>

                {/* Métricas Resumidas */}
                {c.metricas && (
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/60">
                    <span>Visitas: <strong>{c.metricas.atencionesHistoricas}</strong></span>
                    <span className="font-mono text-emerald-400 font-bold">
                      S/ {c.metricas.consumoTotalHistorico.toFixed(2)}
                    </span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ficha Detalle del Cliente */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{clienteSeleccionado.nombre}</h4>
                  <p className="text-[10px] text-slate-400">Ficha CRM & Fidelización</p>
                </div>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Insignias Activas */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Insignias Ganadas</span>
              <div className="flex flex-wrap gap-1.5">
                {clienteSeleccionado.insigniasGanadas.length > 0 ? (
                  clienteSeleccionado.insigniasGanadas.map((ins) => {
                    const IconComp = ICON_MAP[ins.icono] || Sparkles;
                    return (
                      <span
                        key={ins.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${ins.color_badge}`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        {ins.nombre}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">Consumidor sin insignias ganadas aún.</span>
                )}
              </div>
            </div>

            {/* Datos de Contacto & Métricas */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">DNI:</span>
                <span className="font-bold">{clienteSeleccionado.dni || 'No registrado'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Celular:</span>
                <span className="font-bold">{clienteSeleccionado.celular || 'No registrado'}</span>
              </div>
              {clienteSeleccionado.metricas && (
                <>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Atenciones Totales:</span>
                    <span className="font-bold text-indigo-400">{clienteSeleccionado.metricas.atencionesHistoricas}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Consumo Histórico:</span>
                    <span className="font-mono font-black text-emerald-400">
                      S/ {clienteSeleccionado.metricas.consumoTotalHistorico.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Notas Técnicas / Antecedentes */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notas Técnicas de Bolsillo</span>
              <p className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs text-slate-300 italic">
                "{clienteSeleccionado.notasTecnicas}"
              </p>
            </div>

            {/* Acciones de Contacto */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {clienteSeleccionado.celular ? (
                <>
                  <a
                    href={`https://wa.me/51${clienteSeleccionado.celular.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`tel:${clienteSeleccionado.celular}`}
                    className="p-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" /> Llamar
                  </a>
                </>
              ) : (
                <div className="col-span-2 text-center text-slate-500 text-[11px] py-1">
                  Sin número celular registrado para contacto directo.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal Crear Nuevo Cliente */}
      {modalRegistroOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white">Nuevo Cliente en Cartera</h4>
              </div>
              <button onClick={() => setModalRegistroOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearCliente} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Carmen Salazar"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">DNI</label>
                  <input
                    type="text"
                    value={nuevoDni}
                    onChange={(e) => setNuevoDni(e.target.value)}
                    placeholder="8 dígitos"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Celular</label>
                  <input
                    type="tel"
                    value={nuevoCelular}
                    onChange={(e) => setNuevoCelular(e.target.value)}
                    placeholder="999..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Notas Técnicas / Diagnóstico</label>
                <textarea
                  rows={2}
                  value={nuevasNotas}
                  onChange={(e) => setNuevasNotas(e.target.value)}
                  placeholder="Ej. Tinte 7.1 con 20 volúmenes, porosidad media..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 resize-none font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalRegistroOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition active:scale-95"
                >
                  Guardar en Mi Cartera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
