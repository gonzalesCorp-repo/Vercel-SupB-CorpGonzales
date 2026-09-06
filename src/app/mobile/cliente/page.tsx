'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flower2, Heart, Calendar, Award, 
  ArrowRight, Search, UserPlus, Dna, CheckCircle2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import { 
  PreferenciaSensorialCliente, 
  VitalidadCapilarStitch, 
  RutinaClimatologicaOpal, 
  PredictorCicloCapilarOpal, 
  LuminaHqPluginConfig 
} from '@/types/clienteLifestyle';
import { 
  cargarPreferenciaSensorial, 
  guardarPreferenciaSensorial, 
  calcularVitalidadCapilarStitch, 
  procesarRutinaClimatologicaOpal, 
  calcularPredictorCicloCapilarOpal, 
  obtenerConfiguracionLuminaHq, 
  guardarConfiguracionLuminaHq 
} from '@/services/clienteLifestyleService';
import { calcularEtiquetasCliente } from '@/services/reglasClientes';

// Subcomponentes Stitch & Opal del Cliente
import { ClienteHeaderShell } from '@/components/mobile/cliente/ClienteHeaderShell';
import { ClienteSantuarioTab } from '@/components/mobile/cliente/ClienteSantuarioTab';
import { ClienteSaludDiagnosticoTab } from '@/components/mobile/cliente/ClienteSaludDiagnosticoTab';
import { ClienteExperienciaSalonTab } from '@/components/mobile/cliente/ClienteExperienciaSalonTab';
import { ClienteClubTab } from '@/components/mobile/cliente/ClienteClubTab';

export default function MobileClientePage() {
  const supabase = createClient();
  const { showAlert } = useUIStore();
  const { sedeActiva } = useAppStore();

  // Estados de Autenticación / Sesión de Cliente
  const [dni, setDni] = useState('');
  const [clienteActivo, setClienteActivo] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  // Estados de Navegación Stitch
  const [activeTab, setActiveTab] = useState<'santuario' | 'salud' | 'salon' | 'club'>('santuario');

  // Estados de Bienestar & Lifestyle
  const [pluginLumina, setPluginLumina] = useState<LuminaHqPluginConfig>(obtenerConfiguracionLuminaHq());
  const [preferencias, setPreferencias] = useState<PreferenciaSensorialCliente | null>(null);
  const [vitalidad, setVitalidad] = useState<VitalidadCapilarStitch | null>(null);
  const [rutinaOpal, setRutinaOpal] = useState<RutinaClimatologicaOpal | null>(null);
  const [predictorOpal, setPredictorOpal] = useState<PredictorCicloCapilarOpal | null>(null);
  const [historialAtenciones, setHistorialAtenciones] = useState<any[]>([]);
  const [ordenActiva, setOrdenActiva] = useState<any>(null);
  const [insignias, setInsignias] = useState<any[]>([]);

  // 1. Cargar sesión previa del cliente
  useEffect(() => {
    const saved = localStorage.getItem('vaikuntha_cliente_sesion');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setClienteActivo(parsed);
      } catch (e) {
        console.error(e);
      }
    }
    setPluginLumina(obtenerConfiguracionLuminaHq());
  }, []);

  // 2. Cargar ecosistema de bienestar cuando el cliente está activo
  useEffect(() => {
    if (!clienteActivo?.id) return;

    async function cargarEcosistemaBienestar() {
      // a. Cargar o inicializar preferencias sensoriales
      const prefs = cargarPreferenciaSensorial(clienteActivo.id, clienteActivo.notas);
      setPreferencias(prefs);

      // b. Cargar historial de OATCs
      let atenciones: any[] = [];
      try {
        const { data: oatcs } = await supabase
          .from('oatc')
          .select('id, created_at, estado_proceso, total, agente_nombre, oatc_tickets(descripcion, precio_total)')
          .eq('cliente_id', clienteActivo.id)
          .order('created_at', { ascending: false })
          .limit(6);

        atenciones = oatcs || [];
        setHistorialAtenciones(atenciones);

        // Detectar si hay orden en atención ahora
        const enCurso = atenciones.find(o => o.estado_proceso === 'EN_ATENCION' || o.estado_proceso === 'RECEPCIONADO');
        setOrdenActiva(enCurso || null);
      } catch (err) {
        console.error('Error cargando OATCs de cliente:', err);
      }

      // c. Motores Opal & Stitch
      const diasUltimoServicio = atenciones.length > 0 && atenciones[0].created_at
        ? Math.max(0, Math.floor((Date.now() - new Date(atenciones[0].created_at).getTime()) / (1000 * 60 * 60 * 24)))
        : 20;

      setVitalidad(calcularVitalidadCapilarStitch(prefs, diasUltimoServicio));
      setRutinaOpal(procesarRutinaClimatologicaOpal(prefs.meta_principal, diasUltimoServicio));
      setPredictorOpal(calcularPredictorCicloCapilarOpal(atenciones));

      // d. Insignias de fidelidad
      try {
        const tags = await calcularEtiquetasCliente(clienteActivo.id);
        setInsignias(tags || []);
      } catch (err) {
        console.error('Error cargando insignias:', err);
      }
    }

    cargarEcosistemaBienestar();
  }, [clienteActivo?.id]);

  // Manejo de Conmutación de Plug-in LuminaHQ
  const handleTogglePluginLumina = () => {
    const nuevoEstado: LuminaHqPluginConfig = {
      ...pluginLumina,
      activo: !pluginLumina.activo
    };
    setPluginLumina(nuevoEstado);
    guardarConfiguracionLuminaHq(nuevoEstado);

    if (nuevoEstado.activo) {
      showAlert('¡Plug-in + LuminaHQ Biocare activado! Scanner y Copilot habilitados ✨', 'success');
    } else {
      showAlert('Modo Marca Blanca (Vaikuntha Core) restablecido 🏷️', 'info');
    }
  };

  // Manejo de Login / Búsqueda
  const handleBuscarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`dni.eq.${dni.trim()},celular.eq.${dni.trim()}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setClienteActivo(data);
        localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(data));
        showAlert(`¡Bienvenido(a) a tu Santuario de Bienestar, ${data.nombre}! 🌿`, 'success');
      } else {
        setMostrarRegistro(true);
        showAlert('No encontramos tu registro. Completa tu nombre para crear tu pase VIP.', 'info');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al buscar cliente.', 'error');
    } finally {
      setBuscando(false);
    }
  };

  // Manejo de Registro Exprés
  const handleRegistrarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !dni.trim()) return;

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoNombre.trim(),
          dni: dni.trim(),
          celular: nuevoTelefono.trim() || null,
          sede_id: sedeActiva?.id || null
        }])
        .select()
        .single();

      const clienteFinal = data || {
        id: `temp-${Date.now()}`,
        nombre: nuevoNombre.trim(),
        dni: dni.trim(),
        celular: nuevoTelefono.trim()
      };

      setClienteActivo(clienteFinal);
      localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(clienteFinal));
      showAlert(`¡Bienvenido(a) a tu experiencia de autocuidado, ${nuevoNombre}! ✨`, 'success');
      setMostrarRegistro(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
    }
  };

  // Manejo de Cierre de Sesión
  const handleCerrarSesion = () => {
    localStorage.removeItem('vaikuntha_cliente_sesion');
    setClienteActivo(null);
    setDni('');
    setMostrarRegistro(false);
    showAlert('Sesión cerrada con éxito.', 'info');
  };

  // Guardar cambios de preferencias
  const handleGuardarPreferencias = async (nuevas: PreferenciaSensorialCliente) => {
    setPreferencias(nuevas);
    if (clienteActivo?.id) {
      await guardarPreferenciaSensorial(clienteActivo.id, nuevas);
      // Recalcular vitalidad y rutinas
      setVitalidad(calcularVitalidadCapilarStitch(nuevas, predictorOpal?.dias_desde_ultimo_servicio || 20));
      setRutinaOpal(procesarRutinaClimatologicaOpal(nuevas.meta_principal, predictorOpal?.dias_desde_ultimo_servicio || 20));
    }
  };

  // Agendar Cita
  const handleSolicitarCita = async (servicio: string, fechaHora: string) => {
    // Si se desea insertar una cita en la BD
    console.log('Reserva solicitada:', servicio, fechaHora);
  };

  // ==========================================
  // PANTALLA DE ACCESO (LOGIN O REGISTRO)
  // ==========================================
  if (!clienteActivo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-5 font-sans transition-colors duration-300">
        <div className="space-y-6 max-w-sm mx-auto w-full pt-4">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px] mx-auto shadow-xl shadow-pink-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-3xl flex items-center justify-center">
                <Flower2 className="w-8 h-8 text-pink-500" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Santuario de Belleza & Bienestar
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sedeActiva?.nombre || 'Gloss Salón & Relax'} • Suite Lifestyle
              </p>
            </div>
          </div>

          {!mostrarRegistro ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Ingresa a tu Espacio Consciente
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingresa tu DNI o Celular para consultar tus rutinas de cuidado, citas y Pase de Auto-Checkin.
                </p>
              </div>

              <form onSubmit={handleBuscarCliente} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ingresa tu DNI o Celular..."
                  value={dni}
                  onChange={e => setDni(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-pink-500"
                  required
                />

                <button
                  type="submit"
                  disabled={buscando || !dni}
                  className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-pink-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {buscando ? 'Buscando tu perfil...' : 'Entrar a Mi Santuario'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Crear Mi Pase de Bienestar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No encontramos el DNI <strong className="text-pink-500 font-mono">{dni}</strong>. Regístrate en 10 segundos:
                </p>
              </div>

              <form onSubmit={handleRegistrarCliente} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Tu Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Valeria Mendoza"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+51 999 999 999"
                    value={nuevoTelefono}
                    onChange={e => setNuevoTelefono(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarRegistro(false)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={buscando}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 rounded-xl text-xs shadow-lg transition cursor-pointer"
                  >
                    {buscando ? 'Creando...' : 'Comenzar Mi Experiencia'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        <div className="pt-6 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
            Vaikuntha Lifestyle • Experiencia Holística de Cuidado
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SUITE MÓVIL DEL CLIENTE (4 PESTAÑAS STITCH)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* 🧭 HEADER BOUTIQUE CON CONMUTADOR MARCA BLANCA / LUMINA */}
      <ClienteHeaderShell
        nombreCliente={clienteActivo.nombre}
        pluginLumina={pluginLumina}
        onTogglePluginLumina={handleTogglePluginLumina}
        sedeNombre={sedeActiva?.nombre || 'Gloss Salón'}
      />

      {/* 📱 CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 pb-24 space-y-4">
        
        {/* TAB 1: MI SANTUARIO (BIENESTAR Y RUTINAS DIARIAS) */}
        {activeTab === 'santuario' && vitalidad && rutinaOpal && preferencias && (
          <ClienteSantuarioTab
            vitalidad={vitalidad}
            rutinaOpal={rutinaOpal}
            preferencias={preferencias}
            onExplorarDiagnostico={() => setActiveTab('salud')}
          />
        )}

        {/* TAB 2: SALUD & DIAGNÓSTICO (FICHA SENSORIAL + BIOMETRÍA LUMINA) */}
        {activeTab === 'salud' && preferencias && (
          <ClienteSaludDiagnosticoTab
            cliente={clienteActivo}
            preferencias={preferencias}
            pluginLumina={pluginLumina}
            onGuardarPreferencias={handleGuardarPreferencias}
          />
        )}

        {/* TAB 3: EXPERIENCIA SALÓN & CITAS ZEN */}
        {activeTab === 'salon' && predictorOpal && (
          <ClienteExperienciaSalonTab
            cliente={clienteActivo}
            predictorOpal={predictorOpal}
            historialAtenciones={historialAtenciones}
            ordenActiva={ordenActiva}
            onSolicitarCita={handleSolicitarCita}
            sedeNombre={sedeActiva?.nombre || 'Gloss Salón'}
          />
        )}

        {/* TAB 4: MI CLUB & AJUSTES */}
        {activeTab === 'club' && (
          <ClienteClubTab
            cliente={clienteActivo}
            insignias={insignias}
            pluginLumina={pluginLumina}
            onTogglePluginLumina={handleTogglePluginLumina}
            onCerrarSesion={handleCerrarSesion}
            onActualizarDatosCliente={async (nuevos) => {
              const actualizado = { ...clienteActivo, ...nuevos };
              setClienteActivo(actualizado);
              localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(actualizado));
              await supabase.from('clientes').update(nuevos).eq('id', clienteActivo.id);
            }}
          />
        )}

      </main>

      {/* 🧭 BOTTOM NAVIGATION BAR MÓVIL (STITCH 4 PESTAÑAS ERGONÓMICAS) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 w-full px-3 py-1.5 transition-colors">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          
          <button
            type="button"
            onClick={() => setActiveTab('santuario')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'santuario'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flower2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Santuario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salud')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 relative ${
              activeTab === 'salud'
                ? 'text-purple-600 dark:text-purple-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {pluginLumina.activo ? (
              <Dna className="w-5 h-5 text-purple-500" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
            <span className="text-[10px] mt-0.5 font-bold">
              {pluginLumina.activo ? 'Biocare AI' : 'Diagnóstico'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('salon')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 relative ${
              activeTab === 'salon'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Salón & Citas</span>
            {ordenActiva && (
              <span className="absolute top-1 right-5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('club')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'club'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-bold">Mi Club</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
