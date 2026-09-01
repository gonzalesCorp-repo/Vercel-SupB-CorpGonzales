'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, QrCode, Calendar, Clock, Heart, 
  User, Phone, Gift, Star, ChevronRight, ShieldCheck, 
  CheckCircle2, RefreshCw, LogOut, Edit3, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { calcularEtiquetasCliente, ReglaEtiquetaCliente } from '@/services/reglasClientes';

export interface ClientePerfilViewProps {
  cliente: {
    id: string;
    nombre: string;
    dni?: string;
    telefono?: string;
    email?: string;
    fecha_nacimiento?: string;
    puntos_lumina?: number;
    rango_vip?: string;
  };
  onCerrarSesion?: () => void;
  onActualizarCliente?: (clienteActualizado: any) => void;
}

export default function ClientePerfilView({
  cliente,
  onCerrarSesion,
  onActualizarCliente
}: ClientePerfilViewProps) {
  const { showAlert } = useUIStore();
  const supabase = createClient();

  const [insignias, setInsignias] = useState<ReglaEtiquetaCliente[]>([]);
  const [historialAtenciones, setHistorialAtenciones] = useState<any[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editandoDatos, setEditandoDatos] = useState(false);

  // Form de edición de datos personales
  const [telefono, setTelefono] = useState(cliente.telefono || '');
  const [fechaNacimiento, setFechaNacimiento] = useState(cliente.fecha_nacimiento || '');
  const [email, setEmail] = useState(cliente.email || '');
  const [guardando, setGuardando] = useState(false);

  // Cargar insignias desde el motor de reglas y últimas atenciones
  useEffect(() => {
    async function cargarDetalles() {
      if (!cliente?.id) return;
      setLoadingDatos(true);
      try {
        // 1. Cargar insignias desde admin/reglas-clientes
        const tags = await calcularEtiquetasCliente(cliente.id);
        setInsignias(tags);

        // 2. Cargar historial de OATC del cliente
        const { data: oatcs } = await supabase
          .from('oatc')
          .select('id, created_at, estado_proceso, total, agente_nombre, oatc_tickets(descripcion, precio_total, agentes(nombre))')
          .eq('cliente_id', cliente.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setHistorialAtenciones(oatcs || []);
      } catch (err) {
        console.error('Error cargando perfil cliente:', err);
      } finally {
        setLoadingDatos(false);
      }
    }

    cargarDetalles();
  }, [cliente?.id]);

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          telefono,
          fecha_nacimiento: fechaNacimiento || null,
          email: email || null
        })
        .eq('id', cliente.id);

      if (error) {
        showAlert('Error al actualizar tus datos', 'error');
        return;
      }

      showAlert('Tus datos han sido actualizados con éxito 🎉', 'success');
      setEditandoDatos(false);
      if (onActualizarCliente) {
        onActualizarCliente({
          ...cliente,
          telefono,
          fecha_nacimiento: fechaNacimiento,
          email
        });
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al guardar.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const puntosLumina = cliente.puntos_lumina || (insignias.length * 150) || 350;
  const rango = cliente.rango_vip || (puntosLumina > 500 ? 'Platino VIP' : puntosLumina > 250 ? 'Oro VIP' : 'Miembro Frecuente');

  return (
    <div className="space-y-5 max-w-md mx-auto font-sans pb-12">
      
      {/* Header Cliente */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px]">
            <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-black text-white">MI CUENTA VIP</h2>
            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Club de Fidelidad & Citas</p>
          </div>
        </div>

        {onCerrarSesion && (
          <button 
            onClick={onCerrarSesion}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 💳 TARJETA VIP DIGITAL */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border border-white/15"
      >
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-300 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
                {rango}
              </span>
              <h3 className="text-xl font-black mt-2 tracking-tight">{cliente.nombre}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">DNI: {cliente.dni || 'Sin registrar'}</p>
            </div>

            <button 
              onClick={() => setShowQrModal(true)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white transition shadow-lg flex flex-col items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-6 h-6 text-pink-300" />
              <span className="text-[9px] font-bold">Auto-Checkin</span>
            </button>
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Saldo de Fidelidad</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-black text-amber-300">{puntosLumina}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">LuminaCoins</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Beneficio Activo</span>
              <span className="text-xs font-bold text-emerald-400">10% Off en Retail</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🏆 INSIGNIAS Y REGLAS DE FIDELIZACIÓN (Desde admin/reglas-clientes) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Tus Insignias & Logros de Consumo
            </h3>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
            {insignias.length} ganadas
          </span>
        </div>

        {insignias.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
            <Gift className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>¡Realiza tu próxima visita para desbloquear tus primeras medallas VIP!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {insignias.map(ins => (
              <div 
                key={ins.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate">{ins.nombre}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ins.descripcion || 'Regla cumplida'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 DATOS PERSONALES & CUMPLEAÑOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Datos Personales & Beneficios
            </h3>
          </div>
          <button 
            onClick={() => setEditandoDatos(!editandoDatos)}
            className="text-xs text-pink-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editandoDatos ? 'Cancelar' : 'Editar'}</span>
          </button>
        </div>

        {editandoDatos ? (
          <form onSubmit={handleGuardarDatos} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">WhatsApp / Teléfono</label>
              <input 
                type="tel"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="+51 999 999 999"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Fecha de Cumpleaños (Regalos VIP)</label>
              <input 
                type="date"
                value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Correo Electrónico</label>
              <input 
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <button 
              type="submit"
              disabled={guardando}
              className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-pink-600/30 transition cursor-pointer"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> WhatsApp
              </span>
              <span className="font-black text-white">{cliente.telefono || 'No registrado'}</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-pink-400" /> Cumpleaños
              </span>
              <span className="font-black text-pink-300">{cliente.fecha_nacimiento || 'Regístralo para tu regalo'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 🕒 ÚLTIMAS ATENCIONES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Historial de Visitas
            </h3>
          </div>
        </div>

        {historialAtenciones.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 italic">
            No registras atenciones previas en el sistema.
          </div>
        ) : (
          <div className="space-y-2.5">
            {historialAtenciones.map(oatc => (
              <div key={oatc.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {oatc.agente_nombre ? `Atendido por ${oatc.agente_nombre}` : 'Servicio en Salón'}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(oatc.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">
                    S/ {Number(oatc.total || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Completado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL QR AUTO-CHECKIN PARA KIOSKO */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                <QrCode className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">Tu Pase de Auto-Checkin</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Muestra este código ante la cámara del Kiosko al llegar para ingresar a la cola.</p>
              </div>

              {/* QR Render Visual */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
                <div className="w-44 h-44 border-4 border-slate-900 rounded-xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-white font-mono p-2">
                  <QrCode className="w-24 h-24 text-white mb-2" />
                  <span className="text-[10px] font-black tracking-widest text-pink-400">DNI:{cliente.dni}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar Pase
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
