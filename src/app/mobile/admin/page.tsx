'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, ChevronDown, RefreshCw, LogOut, 
  Sliders, Users, CreditCard, BarChart3, 
  CheckCircle2, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { getBrandingForSede } from '@/config/branding';
import { MobileAccessibilityCard } from '@/components/mobile/MobileAccessibilityCard';
import RecepcionMobileView from '@/components/mobile/RecepcionMobileView';
import CajaMobileView from '@/components/mobile/CajaMobileView';

type AdminTab = 'mando' | 'recepcion' | 'caja' | 'personal' | 'ajustes';

export default function MobileAdminPage() {
  const router = useRouter();
  const { sedeActiva, setSedeActiva, clearSede } = useAppStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('mando');
  const [misSedes, setMisSedes] = useState<Sede[]>([]);
  const [showSedesModal, setShowSedesModal] = useState(false);
  const [agente, setAgente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KPIs de la Sede
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [totalOatcsHoy, setTotalOatcsHoy] = useState(0);
  const [oatcsActivas, setOatcsActivas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  const supabase = createClient();
  const branding = getBrandingForSede(sedeActiva);

  // 1. Validar Permisos de ADMIN o SUPERADMIN
  useEffect(() => {
    const rol = typeof window !== 'undefined' ? (localStorage.getItem('vaikuntha_user_rol') || '').toUpperCase() : '';

    const esAdminAutorizado = rol === 'ADMIN' || rol === 'SUPERADMIN' || rol === 'SOPORTE';

    if (!esAdminAutorizado) {
      router.replace('/login');
    }
  }, [router]);

  // 2. Cargar Datos del Administrador y Sedes
  useEffect(() => {
    async function initAdmin() {
      setLoading(true);
      const email = typeof window !== 'undefined' ? (localStorage.getItem('vaikuntha_user_email') || '') : '';
      if (email) {
        const { data: agDb } = await supabase
          .from('agentes')
          .select('*')
          .ilike('email', email.trim())
          .maybeSingle();
        if (agDb) setAgente(agDb);

        const sedes = await obtenerSedesUsuario(email);
        setMisSedes(sedes);
        if (sedes.length > 0 && !sedeActiva) {
          setSedeActiva(sedes[0]);
        }
      }
      setLoading(false);
    }
    initAdmin();
  }, [sedeActiva, setSedeActiva]);

  // 3. Cargar KPIs y Personal en Vivo
  const cargarDatosSede = useCallback(async () => {
    if (!sedeActiva?.id) return;
    try {
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0);
      const hoyIso = hoyInicio.toISOString();

      // Cargar OATCs activas
      const { data: oatcs } = await supabase
        .from('oatc')
        .select('*')
        .eq('sede_id', sedeActiva.id)
        .gte('created_at', hoyIso)
        .order('created_at', { ascending: false });

      if (oatcs) {
        setTotalOatcsHoy(oatcs.length);
        const activas = oatcs.filter((o: any) => o.estado !== 'FINALIZADO' && o.estado !== 'CANCELADO' && o.estado !== 'COBRADO');
        setOatcsActivas(activas);
      }

      // Cargar Ventas
      const { data: ventas } = await supabase
        .from('comprobantes')
        .select('total, estado')
        .eq('sede_id', sedeActiva.id)
        .gte('created_at', hoyIso);

      if (ventas) {
        const total = (ventas as any[])
          .filter((v: any) => v.estado !== 'ANULADO')
          .reduce((acc: number, v: any) => acc + (Number(v.total) || 0), 0);
        setTotalVentasHoy(total);
      }

      // Cargar Colaboradores de esta sede
      const { data: usuariosSede } = await supabase
        .from('sedes_usuarios')
        .select('agentes(*)')
        .eq('sede_id', sedeActiva.id);

      if (usuariosSede) {
        const lista = usuariosSede
          .map((u: any) => u.agentes)
          .filter(Boolean)
          .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        setColaboradores(lista);
      }
    } catch (e) {
      console.error('Error cargando métricas admin:', e);
    }
  }, [sedeActiva?.id]);

  useEffect(() => {
    cargarDatosSede();
  }, [cargarDatosSede]);

  const staffEnTurno = colaboradores.filter((c: any) => c.estado_operativo === 'DISPONIBLE' || c.estado_operativo === 'OCUPADO');
  const staffEnRefrigerio = colaboradores.filter((c: any) => c.estado_operativo === 'EN_REFRIGERIO');
  const staffFuera = colaboradores.filter((c: any) => c.estado_operativo === 'FUERA_DE_TURNO' || !c.estado_operativo);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-start w-full  pb-24 font-sans select-none transition-colors duration-200">
      
      {/* 📱 TOP BAR EJECUTIVO CON LOGO DE MARCA */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 transition-colors">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo y Sede Activa */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-900 shadow-sm">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.brandName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-indigo-600 dark:text-white font-black text-base">{branding.logoLetter}</span>
              )}
            </div>
            
            <div 
              onClick={() => setShowSedesModal(true)}
              className="cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[150px]">
                  {sedeActiva?.nombre || branding.brandName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 block uppercase tracking-wider">
                Panel Administrativo
              </span>
            </div>
          </div>

          {/* Perfil Admin y Refresh */}
          <div className="flex items-center gap-1.5">
            <button onClick={cargarDatosSede}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right leading-tight">
              <span className="text-xs font-black text-slate-900 dark:text-white block truncate max-w-[100px]">
                {agente?.nombre?.split(' ')[0] || 'Admin'}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300">
                ADMIN
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* 🚀 CONTENIDO PRINCIPAL SEGÚN TAB */}
      <main className="p-4 space-y-4">
        
        {/* ================= PESTAÑA 1: MANDO & KPIS ================= */}
        {activeTab === 'mando' && (
          <div className="space-y-4">
            
            {/* Banner Saludo & Aniversario */}
            <div className="p-4 rounded-3xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 text-white shadow-lg space-y-1">
              <div className="flex items-center justify-between text-xs font-bold opacity-90">
                <span>🌸 {branding.brandName}</span>
                <span>✨ 17º Aniversario</span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Hola, {agente?.nombre?.split(' ')[0]}</h2>
              <p className="text-xs opacity-85">Resumen de operaciones y finanzas en tiempo real.</p>
            </div>

            {/* Grid de Métricas Principales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Ventas Hoy (S/)
                </span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  S/ {totalVentasHoy.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">Facturado en caja</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  OATCs Atendidas
                </span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                  {totalOatcsHoy}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{oatcsActivas.length} activas en piso</span>
              </div>
            </div>

            {/* Estado de Fuerza Laboral (Staff) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-pink-500" /> Fuerza Laboral ({colaboradores.length} Colaboradores)
                </h3>
                <span className="text-[10px] font-bold text-emerald-500">{staffEnTurno.length} Presentes</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="text-base font-black block">{staffEnTurno.length}</span>
                  <span className="text-[9px] uppercase">En Turno</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                  <span className="text-base font-black block">{staffEnRefrigerio.length}</span>
                  <span className="text-[9px] uppercase">Refrigerio</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <span className="text-base font-black block">{staffFuera.length}</span>
                  <span className="text-[9px] uppercase">Fuera</span>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos Operativos */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block">
                Módulos de Mostrador
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setActiveTab('recepcion')}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-400 text-left transition active:scale-98 shadow-sm flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold shrink-0">
                    🛎️
                  </div>
                  <div className="leading-tight">
                    <span className="text-xs font-black block text-slate-900 dark:text-white">Recepción</span>
                    <span className="text-[10px] text-slate-400">Clientes & Cola</span>
                  </div>
                </button>

                <button onClick={() => setActiveTab('caja')}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 text-left transition active:scale-98 shadow-sm flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    💵
                  </div>
                  <div className="leading-tight">
                    <span className="text-xs font-black block text-slate-900 dark:text-white">Caja & Cobros</span>
                    <span className="text-[10px] text-slate-400">POS & Arqueos</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= PESTAÑA 2: RECEPCIÓN ================= */}
        {activeTab === 'recepcion' && (
          <div className="space-y-4">
            <RecepcionMobileView agente={agente} sedeId={sedeActiva?.id || ''} />
          </div>
        )}

        {/* ================= PESTAÑA 3: CAJA ================= */}
        {activeTab === 'caja' && (
          <div className="space-y-4">
            <CajaMobileView agente={agente} sedeId={sedeActiva?.id || ''} />
          </div>
        )}

        {/* ================= PESTAÑA 4: PERSONAL / WFM ================= */}
        {activeTab === 'personal' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Personal en Sede ({colaboradores.length})</h3>
              <button onClick={cargarDatosSede} 
                className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualizar
              </button>
            </div>

            <div className="space-y-2">
              {colaboradores.map((col) => {
                const op = col.estado_operativo || 'FUERA_DE_TURNO';
                let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                let label = 'Fuera de Turno';
                if (op === 'DISPONIBLE') {
                  badgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
                  label = '🟢 Disponible';
                } else if (op === 'OCUPADO') {
                  badgeClass = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400';
                  label = '✂️ Atendiendo';
                } else if (op === 'EN_REFRIGERIO') {
                  badgeClass = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
                  label = '🍕 Refrigerio';
                }

                return (
                  <div 
                    key={col.id}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs"
                  >
                    <div className="leading-tight">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {col.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {col.especialidad || 'Especialista'} • PIN: <strong className="font-mono">{col.pin || '----'}</strong>
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${badgeClass}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 5: AJUSTES & ACCESIBILIDAD ================= */}
        {activeTab === 'ajustes' && (
          <div className="space-y-4">
            
            {/* Tarjeta Completa de Accesibilidad y Legibilidad Visual */}
            <MobileAccessibilityCard userId={agente?.id} />

            {/* Opciones de Cuenta y Logout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cuenta de Administrador
              </h3>
              
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{agente?.nombre}</p>
                <p className="text-slate-500 text-[11px]">{agente?.email}</p>
                <p className="text-pink-600 dark:text-pink-400 font-bold text-[10px] mt-1">ROL: {agente?.rol || 'ADMIN'}</p>
              </div>

              <button onClick={async () => {
                  await supabase.auth.signOut();
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('vaikuntha_user_email');
                    localStorage.removeItem('vaikuntha_user_rol');
                  }
                  clearSede();
                  window.location.href = '/login';
                }}
                className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión de Administrador
              </button>
            </div>

          </div>
        )}

      </main>

      {/* 🧭 BOTTOM NAVIGATION BAR MÓVIL */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 w-full  px-2 py-1.5 transition-colors">
        <div className="grid grid-cols-5 gap-1">
          <button onClick={() => setActiveTab('mando')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
              activeTab === 'mando'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Mando</span>
          </button>

          <button onClick={() => setActiveTab('recepcion')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
              activeTab === 'recepcion'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Recepción</span>
          </button>

          <button onClick={() => setActiveTab('caja')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
              activeTab === 'caja'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Caja</span>
          </button>

          <button onClick={() => setActiveTab('personal')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
              activeTab === 'personal'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Personal</span>
          </button>

          <button onClick={() => setActiveTab('ajustes')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer ${
              activeTab === 'ajustes'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Ajustes</span>
          </button>
        </div>
      </nav>

      {/* 🏢 MODAL CAMBIO DE SEDE */}
      <AnimatePresence>
        {showSedesModal && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Cambiar de Marca / Sede</h3>
                <button onClick={() => setShowSedesModal(false)} className="text-slate-400 text-sm font-bold">Cerrar</button>
              </div>

              <div className="space-y-2">
                {misSedes.map((s) => (
                  <button key={s.id}
                    onClick={() => {
                      setSedeActiva(s);
                      setShowSedesModal(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      s.id === sedeActiva?.id
                        ? 'bg-pink-50 dark:bg-pink-500/20 border-pink-500 text-pink-900 dark:text-pink-200 font-black'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs">{s.nombre}</span>
                    {s.id === sedeActiva?.id && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
