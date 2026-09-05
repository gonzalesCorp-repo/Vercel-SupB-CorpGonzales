'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardDrive, Plus, Check, Trash2, Edit3, Shield, Folder, 
  Video, FileText, Image, Sparkles, RefreshCw, Key, CheckCircle2, Lock
} from 'lucide-react';
import { 
  DriveCuenta, 
  obtenerCuentasDrive, 
  guardarCuentaDrive, 
  eliminarCuentaDrive, 
  formatearTamanoBytes,
  PropositoDrive,
  TipoAutenticacionDrive
} from '@/services/drive';

export function MultiDriveConfigPanel() {
  const [cuentas, setCuentas] = useState<DriveCuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Partial<DriveCuenta> | null>(null);
  const [feedback, setFeedback] = useState('');

  // Form State
  const [nombreDescriptivo, setNombreDescriptivo] = useState('');
  const [emailCuenta, setEmailCuenta] = useState('');
  const [tipoAuth, setTipoAuth] = useState<TipoAutenticacionDrive>('SERVICE_ACCOUNT');
  const [rootFolderId, setRootFolderId] = useState('');
  const [proposito, setProposito] = useState<PropositoDrive>('MULTIMEDIA');
  const [esDefault, setEsDefault] = useState(false);
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  const cargarCuentas = async () => {
    setLoading(true);
    const data = await obtenerCuentasDrive();
    setCuentas(data);
    setLoading(false);
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const abrirModalCrear = () => {
    setEditingCuenta(null);
    setNombreDescriptivo('');
    setEmailCuenta('');
    setTipoAuth('SERVICE_ACCOUNT');
    setRootFolderId('');
    setProposito('MULTIMEDIA');
    setEsDefault(false);
    setServiceAccountJson('');
    setModalOpen(true);
  };

  const abrirModalEditar = (c: DriveCuenta) => {
    setEditingCuenta(c);
    setNombreDescriptivo(c.nombre_descriptivo);
    setEmailCuenta(c.email_cuenta);
    setTipoAuth(c.tipo_autenticacion);
    setRootFolderId(c.root_folder_id);
    setProposito(c.proposito);
    setEsDefault(c.es_default);
    setServiceAccountJson(c.service_account_json || '');
    setModalOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreDescriptivo.trim() || !emailCuenta.trim()) return;

    const payload: Partial<DriveCuenta> = {
      id: editingCuenta?.id || `drive-${Date.now()}`,
      nombre_descriptivo: nombreDescriptivo.trim(),
      email_cuenta: emailCuenta.trim(),
      tipo_autenticacion: tipoAuth,
      root_folder_id: rootFolderId.trim() || 'root',
      proposito,
      es_default: esDefault,
      service_account_json: serviceAccountJson.trim() || undefined,
      roles_permitidos: ['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'],
      sedes_asignadas: ['TODAS'],
      is_active: true,
      espacio_usado_bytes: editingCuenta?.espacio_usado_bytes || 0,
      espacio_total_bytes: editingCuenta?.espacio_total_bytes || 107374182400
    };

    const ok = await guardarCuentaDrive(payload);
    if (ok) {
      setFeedback('¡Cuenta de Google Drive configurada con éxito!');
      setModalOpen(false);
      cargarCuentas();
      setTimeout(() => setFeedback(''), 3500);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Seguro que deseas desvincular esta cuenta de Google Drive?')) return;
    const ok = await eliminarCuentaDrive(id);
    if (ok) {
      setFeedback('Cuenta desvinculada correctamente.');
      cargarCuentas();
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Gobernanza Multi-Cuenta Google Drive</h2>
              <p className="text-xs text-slate-400">
                Administra múltiples cuentas de Drive corporativas y Shared Drives para archivos pesados.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Conectar Nuevo Drive / Shared Drive
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Lista de Cuentas Configuradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cuentas.map((c) => {
          const pct = Math.min(100, Math.round((c.espacio_usado_bytes / c.espacio_total_bytes) * 100)) || 5;

          return (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    c.proposito === 'MULTIMEDIA'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : c.proposito === 'DOCUMENTOS'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {c.proposito} {c.es_default && '• DEFAULT'}
                  </span>

                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {c.tipo_autenticacion === 'SERVICE_ACCOUNT' ? '🤖 Service Account' : '🔑 OAuth 2.0'}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white line-clamp-1">{c.nombre_descriptivo}</h3>
                <p className="text-[11px] text-slate-400 truncate">{c.email_cuenta}</p>
              </div>

              {/* Barra de Almacenamiento */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Uso: {formatearTamanoBytes(c.espacio_usado_bytes)}</span>
                  <span>{formatearTamanoBytes(c.espacio_total_bytes)}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[10px] text-slate-500">Folder ID: {c.root_folder_id}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(c)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                    title="Editar cuenta"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(c.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg transition"
                    title="Eliminar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Conectar / Editar Drive */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-black text-white">
                    {editingCuenta ? 'Editar Cuenta de Google Drive' : 'Conectar Cuenta / Shared Drive'}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGuardar} className="space-y-3.5">
                <div>
                  <label htmlFor="drive-nombre-descriptivo" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                    Nombre Descriptivo
                  </label>
                  <input
                    type="text"
                    id="drive-nombre-descriptivo"
                    name="nombre_descriptivo"
                    required
                    placeholder="Ej. Drive Videos 4K & Campañas"
                    value={nombreDescriptivo}
                    onChange={(e) => setNombreDescriptivo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="drive-email-cuenta" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                      Email de la Cuenta
                    </label>
                    <input
                      type="email"
                      id="drive-email-cuenta"
                      name="email_cuenta"
                      required
                      placeholder="multimedia@empresa.com"
                      value={emailCuenta}
                      onChange={(e) => setEmailCuenta(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="drive-tipo-auth" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                      Tipo de Autenticación
                    </label>
                    <select
                      id="drive-tipo-auth"
                      name="tipo_autenticacion"
                      value={tipoAuth}
                      onChange={(e) => setTipoAuth(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="SERVICE_ACCOUNT">🤖 Service Account Key</option>
                      <option value="OAUTH_CLIENT">🔑 OAuth 2.0 User Auth</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="drive-proposito" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                      Propósito del Drive
                    </label>
                    <select
                      id="drive-proposito"
                      name="proposito"
                      value={proposito}
                      onChange={(e) => setProposito(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="MULTIMEDIA">🎬 Multimedia (Videos & Fotos)</option>
                      <option value="DOCUMENTOS">📄 Fichas Técnicas & Clientes</option>
                      <option value="MARCAS">🏷️ Marcas & Campañas</option>
                      <option value="GENERAL">🌐 General / Backups</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="drive-root-folder-id" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                      Root Folder ID (Google Drive)
                    </label>
                    <input
                      type="text"
                      id="drive-root-folder-id"
                      name="root_folder_id"
                      placeholder="1A2B3C... o 'root'"
                      value={rootFolderId}
                      onChange={(e) => setRootFolderId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {tipoAuth === 'SERVICE_ACCOUNT' && (
                  <div>
                    <label htmlFor="drive-service-account-json" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 cursor-pointer">
                      Service Account Credentials (JSON)
                    </label>
                    <textarea
                      rows={3}
                      id="drive-service-account-json"
                      name="service_account_json"
                      placeholder='{"type": "service_account", "project_id": "...", ...}'
                      value={serviceAccountJson}
                      onChange={(e) => setServiceAccountJson(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="esDefault"
                    name="es_default"
                    checked={esDefault}
                    onChange={(e) => setEsDefault(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="esDefault" className="text-xs text-slate-300 font-bold cursor-pointer">
                    Establecer como cuenta predeterminada para {proposito}
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
