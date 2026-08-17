'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Sliders, Cpu, Clock, Sparkles, Receipt, 
  Save, ShieldCheck, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { SedeFeatureToggles, obtenerConfiguracionSede, guardarConfiguracionSede } from '@/services/sedesConfig';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';

export default function MobileConfigPage() {
  const router = useRouter();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const [toggles, setToggles] = useState<SedeFeatureToggles>({
    moduloLaboratorioGramos: true,
    usarComisionesEscalonadas: true,
    modoEstaciones: 'SEMI_AUTOMATICO_BUZON',
    kioskoAutoservicioHabilitado: true,
    pluginLuminaHqActivo: false,
    cronAutoAprobacionNfc: true,
    cronAutoCierreOatcFueraHorario: true,
    autoImpresionTermicaTickets: true,
    balanzaIotLecturaExacta: true,
    sunatRuc: '',
    sunatRazonSocial: '',
    sunatSerieBoleta: 'B001',
    sunatSerieFactura: 'F001'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'OPERATIVO' | 'CRONJOBS' | 'LUMINA' | 'SUNAT'>('OPERATIVO');

  useEffect(() => {
    cargarConfig();
  }, [sedeActiva?.id]);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      const data = await obtenerConfiguracionSede();
      setToggles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ok = await guardarConfiguracionSede(toggles);
      if (ok) {
        showAlert('Configuración de sede actualizada', 'success');
      } else {
        showAlert('Error al guardar configuración', 'error');
      }
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-emerald-400">Cargando permisos de sede...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28">
      {/* Mobile Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/mobile/operacion"
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Configuración Sede</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full">
                Admin
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {sedeActiva?.nombre || 'Sede Central'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50 active:scale-95 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? '...' : 'Guardar'}</span>
        </button>
      </header>

      {/* Segmented Tab Controls */}
      <div className="px-4 pt-3 pb-1">
        <div className="grid grid-cols-4 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('OPERATIVO')}
            className={`py-2 rounded-xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'OPERATIVO' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Módulos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CRONJOBS')}
            className={`py-2 rounded-xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'CRONJOBS' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cronjobs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LUMINA')}
            className={`py-2 rounded-xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'LUMINA' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lumina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUNAT')}
            className={`py-2 rounded-xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'SUNAT' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-purple-400" />
            <span>SUNAT</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="p-4 space-y-4">

        {/* Tab 1: Operativos */}
        {activeTab === 'OPERATIVO' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider">Módulos de Hardware & Piso</h2>

              {/* Módulo Laboratorio */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Módulo Laboratorio (Gramos)</p>
                  <p className="text-[10px] text-slate-400">Descuenta pesaje real de tintes y químicos.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.moduloLaboratorioGramos}
                  onChange={(e) => setToggles(prev => ({ ...prev, moduloLaboratorioGramos: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Kiosko Autoservicio */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Tótem Kiosko Autoservicio</p>
                  <p className="text-[10px] text-slate-400">Check-in táctil de clientes y staff.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.kioskoAutoservicioHabilitado}
                  onChange={(e) => setToggles(prev => ({ ...prev, kioskoAutoservicioHabilitado: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Propuesta Visual del Kiosko */}
              {toggles.kioskoAutoservicioHabilitado && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <span>🎨 Propuesta Visual del Tótem Kiosko</span>
                    </p>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">Admin Theme</span>
                  </div>
                  <select
                    value={toggles.kioskTheme || 'lumina'}
                    onChange={(e) => setToggles(prev => ({ ...prev, kioskTheme: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none"
                  >
                    <option value="lumina">💎 Lumina VIP Luxury (Predeterminado)</option>
                    <option value="eva-01">🧬 EVA-01 Mech Kiosk (Protocolo NERV)</option>
                    <option value="cyberpunk">⚡ Cyberpunk Neon Hub</option>
                    <option value="luxury">🌿 Vaikuntha Minimal Zen</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    Define la estética de la pantalla táctil de entrada física para los clientes de esta sede.
                  </p>
                </div>
              )}

              {/* Modo Estaciones */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-slate-200 text-xs">Modo Gestión de Estaciones</p>
                <select
                  value={toggles.modoEstaciones}
                  onChange={(e) => setToggles(prev => ({ ...prev, modoEstaciones: e.target.value as any }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none"
                >
                  <option value="SEMI_AUTOMATICO_BUZON">📩 Semi-Automático (Buzón A ➔ B)</option>
                  <option value="AUTOMATICO_IOT">📡 Automático (Web NFC / IoT)</option>
                  <option value="MANUAL">🖐️ Manual (Recepción Directa)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cronjobs Fuera de Horario */}
        {activeTab === 'CRONJOBS' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-black uppercase text-amber-400 tracking-wider">Automatizaciones Desatendidas</h2>

              {/* 1. NFC Auto */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Auto-Aprobación Web NFC</p>
                  <p className="text-[10px] text-slate-400">Entrada/salida autónoma con tag NFC fuera de turno.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.cronAutoAprobacionNfc ?? true}
                  onChange={(e) => setToggles(prev => ({ ...prev, cronAutoAprobacionNfc: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* 2. Auto-Cierre OATC */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Auto-Cierre Pre-Cobradas</p>
                  <p className="text-[10px] text-slate-400">Cierre nocturno de órdenes 100% pre-cobradas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.cronAutoCierreOatcFueraHorario ?? true}
                  onChange={(e) => setToggles(prev => ({ ...prev, cronAutoCierreOatcFueraHorario: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* 3. Impresión Térmica */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Auto-Impresión Térmica</p>
                  <p className="text-[10px] text-slate-400">Emisión física de comandas y comprobantes 80mm.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.autoImpresionTermicaTickets ?? true}
                  onChange={(e) => setToggles(prev => ({ ...prev, autoImpresionTermicaTickets: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* 4. Balanza IoT con Auto-Impresión */}
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-200 text-xs">Balanza IoT + Ticket ODI</p>
                  <p className="text-[10px] text-slate-400">Pesaje Bluetooth y comanda de taller automática.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.balanzaIotLecturaExacta ?? true}
                  onChange={(e) => setToggles(prev => ({ ...prev, balanzaIotLecturaExacta: e.target.checked }))}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: LuminaHQ */}
        {activeTab === 'LUMINA' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Plug-in Oficial
                </h2>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20">
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-bold text-slate-100 text-xs">Habilitar LuminaHQ AI Suite</p>
                  <p className="text-[10px] text-slate-400">Despliega Diagnóstico IA, Fichas Clínicas y V.AI en el menú.</p>
                </div>
                <input
                  type="checkbox"
                  checked={toggles.pluginLuminaHqActivo || false}
                  onChange={(e) => setToggles(prev => ({ ...prev, pluginLuminaHqActivo: e.target.checked }))}
                  className="w-6 h-6 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Facturación SUNAT */}
        {activeTab === 'SUNAT' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-xs font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Datos Fiscales SUNAT
              </h2>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">RUC Sede</label>
                  <input
                    type="text"
                    value={toggles.sunatRuc || ''}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatRuc: e.target.value }))}
                    placeholder="20601234567"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={toggles.sunatRazonSocial || ''}
                    onChange={(e) => setToggles(prev => ({ ...prev, sunatRazonSocial: e.target.value }))}
                    placeholder="Vaikuntha Salon & Spa S.A.C."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Serie Boleta</label>
                    <input
                      type="text"
                      value={toggles.sunatSerieBoleta || 'B001'}
                      onChange={(e) => setToggles(prev => ({ ...prev, sunatSerieBoleta: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Serie Factura</label>
                    <input
                      type="text"
                      value={toggles.sunatSerieFactura || 'F001'}
                      onChange={(e) => setToggles(prev => ({ ...prev, sunatSerieFactura: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Floating Save Action on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 flex gap-2 z-40">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Permisos de Sede'}</span>
        </button>
      </div>
    </div>
  );
}
