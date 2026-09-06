'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, ChevronDown, RefreshCw, LogOut, 
  Sliders, Users, CreditCard, BarChart3, 
  CheckCircle2, Clock, DollarSign, Sparkles, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { getBrandingForSede } from '@/config/branding';
import { MobileAccessibilityCard } from '@/components/mobile/MobileAccessibilityCard';
import CajaMobileView from '@/components/mobile/CajaMobileView';
import { AdminExecutiveBriefingStitch } from '@/components/mobile/admin/AdminExecutiveBriefingStitch';
import { AdminPersonalMobileTab } from '@/components/mobile/admin/AdminPersonalMobileTab';
import { AdminFinanzasMobileTab } from '@/components/mobile/admin/AdminFinanzasMobileTab';
import { obtenerLiquidaciones, pagarLiquidacionPersonal } from '@/services/liquidaciones';
import { obtenerCuentasFinancieras } from '@/services/finanzas';
import { LiquidacionPersonal } from '@/types/liquidaciones';
import { CuentaFinanciera } from '@/types/finanzas';

type AdminTab = 'mando' | 'personal' | 'finanzas' | 'caja' | 'ajustes';

export default function MobileAdminPage() {
  const router = useRouter();
  const { sedeActiva, setSedeActiva, clearSede } = useAppStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('mando');
  const [misSedes, setMisSedes] = useState<Sede[]>([]);
  const [showSedesModal, setShowSedesModal] = useState(false);
  const [agente, setAgente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KPIs y Data de la Sede
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [totalOatcsHoy, setTotalOatcsHoy] = useState(0);
  const [oatcsActivas, setOatcsActivas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPersonal[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);

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

  // 3. Cargar KPIs, Personal, OATCs y Liquidaciones
  const cargarDatosSede = useCallback(async () => {
    if (!sedeActiva?.id) return;
    try {
      const hoyInicio = new Date();
      hoyInicio.setHours(0, 0, 0, 0);
      const hoyIso = hoyInicio.toISOString();

      const [resOatcs, resVentas, resUsuariosSede, resLiqs, resCtas] = await Promise.all([
        supabase
          .from('oatc')
          .select('*')
          .eq('sede_id', sedeActiva.id)
          .gte('created_at', hoyIso)
          .order('created_at', { ascending: false }),
        supabase
          .from('comprobantes_pago')
          .select('total, estado')
          .eq('sede_id', sedeActiva.id)
          .gte('created_at', hoyIso),
        supabase
          .from('sedes_usuarios')
          .select('agentes(*)')
          .eq('sede_id', sedeActiva.id),
        obtenerLiquidaciones({ rolGrupo: 'STAFF', sedeId: sedeActiva.id }),
        obtenerCuentasFinancieras(sedeActiva.id)
      ]);

      if (resOatcs.data) {
        setTotalOatcsHoy(resOatcs.data.length);
        const activas = resOatcs.data.filter((o: any) => o.estado_proceso !== 'FINALIZADO' && o.estado_proceso !== 'CANCELADO' && o.estado_proceso !== 'COBRADO');
        setOatcsActivas(activas);
      }

      if (resVentas.data) {
        const total = (resVentas.data as any[])
          .filter((v: any) => v.estado !== 'ANULADO')
          .reduce((acc: number, v: any) => acc + (Number(v.total) || 0), 0);
        setTotalVentasHoy(total);
      }

      if (resUsuariosSede.data) {
        const lista = resUsuariosSede.data
          .map((u: any) => u.agentes)
          .filter(Boolean)
          .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
        setColaboradores(lista);
      }

      setLiquidaciones(resLiqs || []);
      setCuentas(resCtas || []);
    } catch (e) {
      console.error('Error cargando métricas admin:', e);
    }
  }, [sedeActiva?.id]);

  useEffect(() => {
    cargarDatosSede();
  }, [cargarDatosSede]);

  // Pago de liquidación confirmado con PIN
  const handlePagarLiquidacion = async (liq: LiquidacionPersonal) => {
    const cta = cuentas[0];
    await pagarLiquidacionPersonal({
      liquidacionId: liq.id,
      cuentaPagoId: cta?.id || '',
      cuentaPagoNombre: cta?.nombre || 'Caja Chica',
      adminNombre: agente?.nombre || 'Administrador',
      sedeId: sedeActiva?.id
    });
    await cargarDatosSede();
  };

  const colabsEnAtencion = colaboradores.filter((c: any) => (c.estado_operativo || (c.esta_ocupado ? 'EN_ATENCION' : 'DISPONIBLE')) === 'EN_ATENCION').length;
  const colabsActivos = colaboradores.length || 1;
  const liquidacionesPendientes = liquidaciones.filter(l => l.estado !== 'PAGADO' && l.estado !== 'ANULADO');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-start w-full pb-24 font-sans select-none transition-colors duration-200">
      
      {/* 📱 TOP BAR EJECUTIVO CON LOGO DE MARCA */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSedesModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-pink-500/50 transition active:scale-95 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                {sedeActiva?.nombre || 'Seleccionar Sede'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cargarDatosSede}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition active:scale-95 cursor-pointer"
              title="Recargar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="p-4 space-y-4 flex-1">
        
        {/* ================= PESTAÑA 1: MANDO EJECUTIVO (STITCH + OPAL) ================= */}
        {activeTab === 'mando' && (
          <div className="space-y-4">
            {/* Tarjeta Ejecutiva Opal Copilot */}
            <AdminExecutiveBriefingStitch
              input={{
                sede_id: sedeActiva?.id,
                sede_nombre: sedeActiva?.nombre || 'Sede Principal',
                total_ventas_hoy: totalVentasHoy,
                meta_ventas_hoy: 2500,
                oatcs_activas_count: oatcsActivas.length,
                colaboradores_activos_count: colabsActivos,
                colaboradores_en_atencion_count: colabsEnAtencion,
                clientes_en_espera_count: oatcsActivas.filter((o: any) => o.estado_proceso === 'EN_ESPERA').length,
                liquidaciones_pendientes_count: liquidacionesPendientes.length
              }}
              onRefrescar={cargarDatosSede}
            />

            {/* Fila de Micro-KPIs Stitch */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ventas Hoy</span>
                <p className="text-xl font-black text-emerald-500 font-mono mt-0.5">
                  S/ {totalVentasHoy.toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-500">Recaudo facturado</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Atenciones Hoy</span>
                <p className="text-xl font-black text-indigo-500 font-mono mt-0.5">
                  {totalOatcsHoy} clientes
                </p>
                <span className="text-[10px] text-slate-500">{oatcsActivas.length} activas ahora</span>
              </div>
            </div>

            {/* OATCs en Curso en Salón */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
                Órdenes en Sillón ({oatcsActivas.length})
              </span>

              {oatcsActivas.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No hay atenciones en curso en este momento.
                </div>
              ) : (
                oatcsActivas.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {o.cliente_nombre || 'Cliente VIP'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Atendido por: <strong>{o.agente_nombre || 'Especialista'}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase">
                      {o.estado_proceso || 'EN CURSO'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: PERSONAL & TURNOS (STITCH) ================= */}
        {activeTab === 'personal' && (
          <AdminPersonalMobileTab
            colaboradores={colaboradores}
            onRefrescar={cargarDatosSede}
          />
        )}

        {/* ================= PESTAÑA 3: FINANZAS & APROBACIONES (OPAL + PIN) ================= */}
        {activeTab === 'finanzas' && (
          <AdminFinanzasMobileTab
            sedeId={sedeActiva?.id || ''}
            agenteId={agente?.id || ''}
            liquidaciones={liquidaciones}
            onRefrescar={cargarDatosSede}
            onPagarLiquidacion={handlePagarLiquidacion}
          />
        )}

        {/* ================= PESTAÑA 4: CAJA & AUDITORÍA ================= */}
        {activeTab === 'caja' && (
          <CajaMobileView agente={agente} sedeId={sedeActiva?.id || ''} />
        )}

        {/* ================= PESTAÑA 5: AJUSTES & ACCESIBILIDAD ================= */}
        {activeTab === 'ajustes' && (
          <div className="space-y-4">
            <MobileAccessibilityCard userId={agente?.id} />

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

      {/* 🧭 BOTTOM NAVIGATION BAR MÓVIL (STITCH 5 PESTAÑAS) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 w-full px-2 py-1.5 transition-colors">
        <div className="grid grid-cols-5 gap-1">
          <button onClick={() => setActiveTab('mando')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'mando'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Mando</span>
          </button>

          <button onClick={() => setActiveTab('personal')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'personal'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Personal</span>
          </button>

          <button onClick={() => setActiveTab('finanzas')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer relative active:scale-95 ${
              activeTab === 'finanzas'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Finanzas</span>
            {liquidacionesPendientes.length > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {liquidacionesPendientes.length}
              </span>
            )}
          </button>

          <button onClick={() => setActiveTab('caja')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
              activeTab === 'caja'
                ? 'text-pink-600 dark:text-pink-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Caja</span>
          </button>

          <button onClick={() => setActiveTab('ajustes')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl transition cursor-pointer active:scale-95 ${
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
