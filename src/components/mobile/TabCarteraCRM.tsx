'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Phone, Calendar, Scissors, Award, 
  Sparkles, CheckCircle2, ChevronRight, X, Shield, 
  Search, Star, FileText, ArrowRight, ArrowLeft
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { obtenerReglasEtiquetas, evaluarEtiquetas } from '@/services/reglasClientes';
import { crearCliente } from '@/services/clientes';

interface ClienteCartera {
  id: string;
  nombre: string;
  dni?: string;
  celular?: string;
  ultimoServicio?: string;
  ultimaVisita?: string;
  totalGastado?: number;
  visitasContador?: number;
  notasTecnicas?: string;
  insigniasGanadas?: string[];
}

interface TabCarteraCRMProps {
  agenteNombre?: string;
  agenteId?: string;
}

export function TabCarteraCRM({ agenteNombre = '', agenteId }: TabCarteraCRMProps) {
  const [clientes, setClientes] = useState<ClienteCartera[]>([]);
  const [query, setQuery] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCartera | null>(null);
  const [feedback, setFeedback] = useState('');

  // Estados del Wizard de 2 Pasos
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevoCelular, setNuevoCelular] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');
  const [wizardError, setWizardError] = useState('');

  const cargarCartera = async () => {
    setCargando(true);
    try {
      const supabase = createClient();

      let queryClientes = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (agenteId) {
        queryClientes = queryClientes.eq('agente_id', agenteId);
      }

      const { data: dataClientes } = await queryClientes.limit(40);
      const reglasActivas = await obtenerReglasEtiquetas(true);

      const clientesMapeados: ClienteCartera[] = (dataClientes || []).map((c: any) => {
        const metricas = {
          clienteId: c.id,
          atencionesHistoricas: Number(c.visitas_total || 1),
          visitas30d: Number(c.visitas_total || 1),
          consumoTotal30d: Number(c.total_gastado || 0),
          consumoTotalHistorico: Number(c.total_gastado || 0),
          comprasRetail30d: 0,
          consumoRetail30d: 0
        };
        const etiquetas = evaluarEtiquetas(metricas, reglasActivas);

        return {
          id: c.id,
          nombre: c.nombre,
          dni: c.dni,
          celular: c.celular || '',
          ultimoServicio: c.notas || 'Cliente Frecuente',
          ultimaVisita: 'Reciente',
          totalGastado: metricas.consumoTotalHistorico,
          visitasContador: metricas.atencionesHistoricas,
          notasTecnicas: c.notas || 'Ficha de diagnóstico registrada en salón.',
          insigniasGanadas: etiquetas.map(e => e.nombre)
        };
      });

      setClientes(clientesMapeados);
    } catch (e) {
      console.warn('Error cargando cartera CRM:', e);
      setClientes([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCartera();
  }, [agenteId, agenteNombre]);

  // Búsqueda universal por Nombre, Apellido, DNI o Celular
  const filtrados = clientes.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.dni && c.dni.includes(q)) ||
      (c.celular && c.celular.includes(q))
    );
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError('');

    if (!nuevoNombre.trim()) {
      setWizardError('El nombre del cliente es obligatorio.');
      return;
    }

    const celLimpio = nuevoCelular.replace(/\D/g, '');
    if (!celLimpio || celLimpio.length < 9) {
      setWizardError('El número de celular debe tener 9 dígitos numéricos.');
      return;
    }

    setWizardStep(2);
  };

  const handleCrearClienteFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError('');

    const nombreCompleto = nuevoApellido.trim() 
      ? `${nuevoNombre.trim()} ${nuevoApellido.trim()}`
      : nuevoNombre.trim();

    const nuevo: ClienteCartera = {
      id: `cli_${Date.now()}`,
      nombre: nombreCompleto,
      dni: nuevoDni.trim() || undefined,
      celular: nuevoCelular.trim(),
      ultimoServicio: 'Cliente Nuevo',
      ultimaVisita: 'Hoy',
      notasTecnicas: nuevasNotas.trim() || 'Ficha técnica inicial de salón.',
      insigniasGanadas: []
    };

    try {
      await crearCliente({
        nombre: nombreCompleto,
        dni: nuevoDni.trim() || undefined,
        celular: nuevoCelular.trim(),
        notas: nuevasNotas.trim() || undefined,
        agente_id: agenteId || null
      });
    } catch (e) {
      console.warn('Fallback CRM:', e);
    }

    setClientes([nuevo, ...clientes]);
    setModalRegistroOpen(false);
    setWizardStep(1);
    setNuevoNombre('');
    setNuevoApellido('');
    setNuevoCelular('');
    setNuevoDni('');
    setNuevasNotas('');
    setFeedback('¡Cliente registrado con éxito en tu Cartera!');
    setTimeout(() => setFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full">
      
      {/* Header CRM */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Mi Cartera Exclusiva
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Clientes de {agenteNombre.split(' ')[0] || 'Staff'}</h3>
        </div>

        <button onClick={() => {
            setWizardStep(1);
            setWizardError('');
            setModalRegistroOpen(true);
          }}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Nuevo</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Buscador de Cartera Universal */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, apellido, DNI o celular..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-medium shadow-xs"
        />
      </div>

      {/* Lista de Clientes de la Cartera */}
      {cargando ? (
        <div className="p-8 text-center text-slate-500 text-xs font-bold animate-pulse">
          Consultando cartera de clientes e historial técnico...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm w-full">
          <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mx-auto shadow-xs">
            👥
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Cartera en Proceso</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {query 
                ? 'No se encontraron coincidencias para la búsqueda.'
                : 'No tienes registrados servicios o productos a clientes en tu historial de atenciones.'}
            </p>
          </div>
          <button
            onClick={() => {
              setWizardStep(1);
              setWizardError('');
              setModalRegistroOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition cursor-pointer"
          >
            + Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtrados.map((c) => (
            <div
              key={c.id}
              onClick={() => setClienteSeleccionado(c)}
              className="p-3.5 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 transition cursor-pointer space-y-2.5 shadow-xs active:scale-[0.99]"
            >
              {/* Header Cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      {c.nombre}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      {c.celular ? <span>📱 {c.celular}</span> : <span>Sin celular</span>}
                      {c.dni && <span>• DNI: {c.dni}</span>}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Ficha Rápida */}
              <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 flex items-center justify-between border border-slate-200/60 dark:border-slate-800/40">
                <span className="truncate max-w-[200px]">{c.notasTecnicas}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{c.ultimaVisita}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL WIZARD DE 2 PASOS: NUEVO CLIENTE */}
      {modalRegistroOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            
            {/* Cabecera del Wizard */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                  {wizardStep}/2
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {wizardStep === 1 ? 'Paso 1: Datos de Contacto' : 'Paso 2: Perfil Fiscal & Ficha'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {wizardStep === 1 ? 'Nombres y Celular obligatorios' : 'DNI para comprobantes y diagnóstico'}
                  </p>
                </div>
              </div>

              <button onClick={() => setModalRegistroOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: wizardStep === 1 ? '50%' : '100%' }}
              />
            </div>

            {wizardError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-bold">
                ⚠️ {wizardError}
              </div>
            )}

            {/* PASO 1: CONTACTO INMEDIATO */}
            {wizardStep === 1 && (
              <form onSubmit={handleNextStep} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej. Carmen"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Apellidos (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoApellido}
                    onChange={(e) => setNuevoApellido(e.target.value)}
                    placeholder="Ej. Salazar Gómez"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Número de Celular * (9 dígitos)
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={9}
                    value={nuevoCelular}
                    onChange={(e) => setNuevoCelular(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 987654321"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalRegistroOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: PERFIL FISCAL & FICHA TÉCNICA */}
            {wizardStep === 2 && (
              <form onSubmit={handleCrearClienteFinal} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    DNI / Documento (Opcional - Comprobantes)
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={nuevoDni}
                    onChange={(e) => setNuevoDni(e.target.value.replace(/\D/g, ''))}
                    placeholder="8 dígitos para Boleta/Factura"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Ficha Técnica / Diagnóstico Capilar
                  </label>
                  <textarea
                    rows={3}
                    value={nuevasNotas}
                    onChange={(e) => setNuevasNotas(e.target.value)}
                    placeholder="Ej. Tinte 7.1 con 20 volúmenes, porosidad media, cuero cabelludo sensible..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Atrás</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Modal Detalle Cliente */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{clienteSeleccionado.nombre}</h4>
                  <p className="text-[10px] text-slate-500">Cliente de Cartera</p>
                </div>
              </div>
              <button onClick={() => setClienteSeleccionado(null)} className="p-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contacto & Celular</span>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {clienteSeleccionado.celular ? `📱 ${clienteSeleccionado.celular}` : 'Sin celular registrado'}
                </p>
                {clienteSeleccionado.dni && (
                  <p className="text-[11px] font-mono text-slate-500">DNI: {clienteSeleccionado.dni}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ficha Técnica / Notas</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {clienteSeleccionado.notasTecnicas || 'Sin notas técnicas registradas.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setClienteSeleccionado(null)}
              className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
