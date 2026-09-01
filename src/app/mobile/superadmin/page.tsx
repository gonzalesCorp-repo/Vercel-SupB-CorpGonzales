'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, MapPin, ChevronDown, RefreshCw, LogOut, 
  Sparkles, Sliders, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { SuperAdminNav, SuperAdminTab } from '@/components/mobile/superadmin/SuperAdminNav';
import { TabKpisMando } from '@/components/mobile/superadmin/TabKpisMando';
import { TabDestrabeFixes } from '@/components/mobile/superadmin/TabDestrabeFixes';
import { TabLogsAuditoria } from '@/components/mobile/superadmin/TabLogsAuditoria';
import { GlobalUI } from '@/components/ui/GlobalUI';
import Link from 'next/link';

export default function MobileSuperAdminPage() {
  const router = useRouter();
  const { sedeActiva, setSedeActiva, clearSede } = useAppStore();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('mando');
  const [misSedes, setMisSedes] = useState<Sede[]>([]);
  const [showSedesModal, setShowSedesModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de datos de la sede activa
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [totalComprobantesHoy, setTotalComprobantesHoy] = useState(0);
  const [oatcsActivas, setOatcsActivas] = useState<any[]>([]);
  const [staffPresente, setStaffPresente] = useState<any[]>([]);
  const [staffAusente, setStaffAusente] = useState<any[]>([]);

  // 1. Validar permisos de SuperAdmin
  useEffect(() => {
    const rol = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_rol') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') : null;

    if (!rol || (rol.toUpperCase() !== 'SUPERADMIN' && !(email && email.includes('cristian')))) {
      router.replace('/login');
    }
  }, [router]);

  // 2. Cargar sedes disponibles
  useEffect(() => {
    async function loadSedes() {
      const email = typeof window !== 'undefined' ? (localStorage.getItem('vaikuntha_user_email') || 'cristian@gonzales.page') : 'cristian@gonzales.page';
      const sedes = await obtenerSedesUsuario(email);
      setMisSedes(sedes);
      if (sedes.length > 0 && !sedeActiva) {
        setSedeActiva(sedes[0]);
      }
    }
    loadSedes();
  }, [sedeActiva, setSedeActiva]);

  // 3. Cargar KPIs y estado de la sede en vivo
  const cargarDatosSede = useCallback(async () => {
    if (!sedeActiva?.id) return;
    setLoading(true);
    const supabase = createClient();

    try {
      // A. Ventas y Comprobantes de hoy
      const hoyLimaStr = new Date().toISOString().split('T')[0];
      const { data: comps } = await supabase
        .from('comprobantes_pago')
        .select('total, created_at')
        .gte('created_at', `${hoyLimaStr}T00:00:00Z`);

      const ventas = (comps || []).reduce((acc: number, c: any) => acc + Number(c.total || 0), 0);
      setTotalVentasHoy(ventas);
      setTotalComprobantesHoy((comps || []).length);

      // B. Órdenes Activas
      const { data: oatcs } = await supabase
        .from('oatc')
        .select('*')
        .eq('sede_id', sedeActiva.id)
        .neq('estado_proceso', 'FINALIZADO')
        .neq('estado_proceso', 'CANCELADO')
        .order('created_at', { ascending: false });

      setOatcsActivas(oatcs || []);

      // C. Staff y Asistencias de hoy
      const { data: agentesSede } = await supabase
        .from('sedes_usuarios')
        .select('agentes(*)')
        .eq('sede_id', sedeActiva.id);

      const listaAgentes = (agentesSede || []).map((s: any) => s.agentes).filter(Boolean);

      const { data: asistencias } = await supabase
        .from('asistencias_turnos')
        .select('agente_id, tipo_marcacion')
        .eq('sede_id', sedeActiva.id)
        .gte('created_at', `${hoyLimaStr}T00:00:00Z`);

      const agentesConEntrada = new Set((asistencias || []).filter((a: any) => a.tipo_marcacion === 'ENTRADA').map((a: any) => a.agente_id));

      const presentes = listaAgentes.filter((a: any) => agentesConEntrada.has(a.id));
      const ausentes = listaAgentes.filter((a: any) => !agentesConEntrada.has(a.id));

      setStaffPresente(presentes);
      setStaffAusente(ausentes);

    } catch (e) {
      console.warn('Error cargando KPIs de superadmin:', e);
    } finally {
      setLoading(false);
    }
  }, [sedeActiva?.id]);

  useEffect(() => {
    cargarDatosSede();

    // Suscripción Realtime a OATCs para actualización reactiva
    const supabase = createClient();
    const channel = supabase.channel('superadmin-live-oatc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        cargarDatosSede();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarDatosSede]);

  const handleLogout = async () => {
    const supabase = createClient();
    clearSede();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vaikuntha_user_email');
      localStorage.removeItem('vaikuntha_user_rol');
      localStorage.removeItem('vaikuntha_user_name');
    }
    router.push('/login');
  };

  const handleSelectTab = (tab: SuperAdminTab) => {
    if (tab === 'config') {
      router.push('/mobile/config');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-200">
      <GlobalUI />

      {/* Header Fijo SuperAdmin */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 transition-colors">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                <span>VAIKUNTHA</span>
                <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 px-1.5 py-0.2 rounded font-black">
                  SUPERADMIN
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Auditoría Remota Multi-Sede</p>
            </div>
          </div>

          {/* Selector de Sede */}
          <button onClick={() => setShowSedesModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-purple-500/40 transition active:scale-95 shadow-sm cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="truncate max-w-[110px]">{sedeActiva?.nombre || 'Elegir Sede'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Contenido Principal según Pestaña Activa */}
      <main className="max-w-md mx-auto p-4">
        {activeTab === 'mando' && (
          <TabKpisMando
            sedeActivaNombre={sedeActiva?.nombre || 'Sede Principal'}
            totalVentasHoy={totalVentasHoy}
            totalComprobantesHoy={totalComprobantesHoy}
            oatcsActivas={oatcsActivas}
            staffPresente={staffPresente}
            staffAusente={staffAusente}
            onRefresh={cargarDatosSede}
            loading={loading}
          />
        )}

        {activeTab === 'destrabe' && (
          <TabDestrabeFixes
            sedeId={sedeActiva?.id}
            oatcsActivas={oatcsActivas}
            onActionComplete={cargarDatosSede}
          />
        )}

        {activeTab === 'logs' && (
          <TabLogsAuditoria
            sedeId={sedeActiva?.id}
          />
        )}
      </main>

      {/* Modal Selector de Sede */}
      <AnimatePresence>
        {showSedesModal && (
          <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 dark:bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Cambiar Sede Activa
                </h3>
                <button onClick={() => setShowSedesModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-2">
                {misSedes.map((sede) => (
                  <button key={sede.id}
                    onClick={() => {
                      setSedeActiva(sede);
                      setShowSedesModal(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      sede.id === sedeActiva?.id
                        ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{sede.nombre}</p>
                      <p className="text-[10px] text-slate-500">{sede.direccion || 'Sede Operativa'}</p>
                    </div>
                    {sede.id === sedeActiva?.id && (
                      <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                        Activa
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Barra de Navegación Adaptada SuperAdmin */}
      <SuperAdminNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onLogout={handleLogout}
      />
    </div>
  );
}
