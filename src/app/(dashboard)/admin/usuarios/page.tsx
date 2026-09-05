'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Shield, Edit2, CheckCircle, XCircle, Plus, Search, Zap, Check, Lock, 
  Sliders, Sparkles, Building2, ChevronRight, Filter, ShieldCheck, Briefcase, 
  CreditCard, Inbox, Beaker, Calendar, FileText, Calculator, BarChart3, 
  PackageSearch, Layers, Activity, Award, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { 
  obtenerTodosLosAgentes, 
  guardarAgente, 
  obtenerTodasLasSedes,
  obtenerSedesPermitidasAgente 
} from '@/services/admin';
import { createClient } from '@/lib/supabase/client';
import { Agente } from '@/services/recepcion';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/store/useAppStore';
import { 
  CATALOGO_HERRAMIENTAS, 
  obtenerHerramientasAgente, 
  concederHerramienta, 
  revocarHerramienta,
  HerramientaDefinicion
} from '@/services/permisos';
import { obtenerRolesSistema, RolSistema } from '@/services/roles';

interface AgenteAdmin extends Agente {
  email?: string;
  password?: string;
  rol?: string;
  especialidad?: string;
  sedes_ids?: string[];
  herramientas_count?: number;
  regimen_laboral?: string;
  sueldo_base?: number;
  tipo_pension?: string;
  asignacion_familiar?: boolean;
  porcentaje_comision?: number;
  tarifa_hora?: number;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<AgenteAdmin[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolSistema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sedeFilter, setSedeFilter] = useState('ALL');
  
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const userRol = useAppStore((state) => state.userRol);
  
  // Modal de usuario (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AgenteAdmin>>({
    nombre: '',
    email: '',
    password: '',
    rol: 'SOPORTE',
    especialidad: '',
    estado: 'ACTIVO',
    sedes_ids: [],
    regimen_laboral: 'HONORARIOS_RHE',
    sueldo_base: 0,
    tipo_pension: 'AFP',
    asignacion_familiar: false,
    porcentaje_comision: 40,
    tarifa_hora: 0
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [todasSedes, setTodasSedes] = useState<{id: string, nombre: string}[]>([]);

  // Modal de Delegación Quirúrgica
  const [isDelegarModalOpen, setIsDelegarModalOpen] = useState(false);
  const [agenteDelegando, setAgenteDelegando] = useState<AgenteAdmin | null>(null);
  const [herramientasActivas, setHerramientasActivas] = useState<string[]>([]);
  const [loadingHerramientas, setLoadingHerramientas] = useState(false);
  const [herramientaSearch, setHerramientaSearch] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const userEmail = useAppStore.getState().userEmail;
      let sedesPermitidas: string[] | undefined = undefined;

      if (userRol !== 'SUPERADMIN') {
        const { data: { user } } = await supabase.auth.getUser();
        let agenteId: string | undefined = undefined;

        if (user?.id) {
          const { data: agById } = await supabase.from('agentes').select('id').eq('id', user.id).maybeSingle();
          if (agById?.id) agenteId = agById.id;
        }

        const emailToSearch = user?.email || userEmail;
        if (!agenteId && emailToSearch) {
          const { data: agByEmail } = await supabase.from('agentes').select('id').ilike('email', emailToSearch.trim()).maybeSingle();
          if (agByEmail?.id) agenteId = agByEmail.id;
        }

        if (agenteId) {
          sedesPermitidas = await obtenerSedesPermitidasAgente(agenteId);
        }

        if ((!sedesPermitidas || sedesPermitidas.length === 0) && sedeActiva?.id) {
          sedesPermitidas = [sedeActiva.id];
        }
      }

      const [usuariosData, sedesData, rolesData] = await Promise.all([
        obtenerTodosLosAgentes(sedesPermitidas),
        obtenerTodasLasSedes(sedesPermitidas),
        obtenerRolesSistema()
      ]);
      
      const filtrados = (usuariosData || []).filter(u => {
        if (userRol !== 'SUPERADMIN' && u.rol === 'SUPERADMIN') return false;
        return true;
      });

      const rolesFiltrados = userRol === 'SUPERADMIN' 
        ? (rolesData || []) 
        : (rolesData || []).filter(r => r.codigo !== 'SUPERADMIN' && r.codigo !== 'ADMIN');

      setUsuarios(filtrados as AgenteAdmin[]);
      setTodasSedes(sedesData || []);
      setRolesDisponibles(rolesFiltrados);
    } catch (e) {
      console.error('Error cargando datos de usuarios:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeActiva?.id, userRol]);


  // Contadores de Métricas
  const stats = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter(u => u.rol === 'ADMIN' || u.rol === 'SUPERADMIN').length;
    const jefes = usuarios.filter(u => u.rol === 'JEFE_OPERATIVO' || u.rol === 'JEFE_OPERACIONES').length;
    const soporte = usuarios.filter(u => u.rol === 'SOPORTE').length;
    const staff = usuarios.filter(u => u.rol === 'STAFF').length;
    return { total, admins, jefes, soporte, staff };
  }, [usuarios]);

  // Filtro de Usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        u.nombre.toLowerCase().includes(search) || 
        (u.email || '').toLowerCase().includes(search) ||
        (u.especialidad || '').toLowerCase().includes(search);
      
      const matchRole = roleFilter === 'ALL' || u.rol === roleFilter;
      const matchSede = sedeFilter === 'ALL' || (u.sedes_ids && u.sedes_ids.includes(sedeFilter));

      return matchSearch && matchRole && matchSede;
    });
  }, [usuarios, searchTerm, roleFilter, sedeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const exito = await guardarAgente({ ...formData, id: editId }, formData.sedes_ids || []);
      if (exito) {
        await cargarDatos();
        closeModal();
      }
    } catch (err) {
      console.error('Error guardando usuario:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const openNewUserModal = () => {
    setEditId(null);
    const defaultSedeId = todasSedes.length === 1 
      ? [todasSedes[0].id] 
      : (sedeActiva?.id && todasSedes.some(s => s.id === sedeActiva.id) ? [sedeActiva.id] : (todasSedes[0]?.id ? [todasSedes[0].id] : []));

    setFormData({ 
      nombre: '', 
      email: '', 
      password: '', 
      rol: 'STAFF', 
      especialidad: '', 
      estado: 'ACTIVO', 
      sedes_ids: defaultSedeId,
      regimen_laboral: 'HONORARIOS_RHE',
      sueldo_base: 0,
      tipo_pension: 'AFP',
      asignacion_familiar: false,
      porcentaje_comision: 40,
      tarifa_hora: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AgenteAdmin) => {
    // Si el usuario objetivo es ADMIN y el usuario logueado no es SUPERADMIN, bloquear apertura
    if (user.rol === 'ADMIN' && userRol !== 'SUPERADMIN') return;

    setEditId(user.id!);
    setFormData({
      nombre: user.nombre,
      email: user.email || '',
      rol: user.rol || 'STAFF',
      especialidad: user.especialidad || '',
      estado: user.estado,
      sedes_ids: user.sedes_ids || [],
      regimen_laboral: user.regimen_laboral || 'HONORARIOS_RHE',
      sueldo_base: Number(user.sueldo_base || 0),
      tipo_pension: user.tipo_pension || 'AFP',
      asignacion_familiar: Boolean(user.asignacion_familiar),
      porcentaje_comision: Number(user.porcentaje_comision || 40),
      tarifa_hora: Number(user.tarifa_hora || 0)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ 
      nombre: '', email: '', password: '', rol: 'STAFF', especialidad: '', estado: 'ACTIVO', sedes_ids: [],
      regimen_laboral: 'HONORARIOS_RHE', sueldo_base: 0, tipo_pension: 'AFP', asignacion_familiar: false, porcentaje_comision: 40, tarifa_hora: 0
    });
  };

  // Abrir Modal de Delegación Quirúrgica
  const openDelegarModal = async (user: AgenteAdmin) => {
    if (user.rol === 'ADMIN' && userRol !== 'SUPERADMIN') return;
    setAgenteDelegando(user);
    setIsDelegarModalOpen(true);
    setLoadingHerramientas(true);
    setHerramientaSearch('');
    if (user.id) {
      const keys = await obtenerHerramientasAgente(user.id);
      setHerramientasActivas(keys);
    }
    setLoadingHerramientas(false);
  };


  const toggleHerramienta = async (herramientaKey: string) => {
    if (!agenteDelegando?.id) return;

    const tieneActiva = herramientasActivas.includes(herramientaKey);
    if (tieneActiva) {
      const ok = await revocarHerramienta(agenteDelegando.id, herramientaKey);
      if (ok) {
        setHerramientasActivas(prev => prev.filter(k => k !== herramientaKey));
      }
    } else {
      const ok = await concederHerramienta(agenteDelegando.id, herramientaKey);
      if (ok) {
        setHerramientasActivas(prev => [...prev, herramientaKey]);
      }
    }
  };

  // Presets Rápidos de 1 Clic
  const aplicarPreset = async (keysDeseadas: string[]) => {
    if (!agenteDelegando?.id) return;
    setSavingPreset(true);

    try {
      const currentKeys = [...herramientasActivas];
      
      // Revocar las que no están en el preset
      for (const k of currentKeys) {
        if (!keysDeseadas.includes(k)) {
          await revocarHerramienta(agenteDelegando.id, k);
        }
      }

      // Conceder las que faltan
      for (const k of keysDeseadas) {
        if (!currentKeys.includes(k)) {
          await concederHerramienta(agenteDelegando.id, k);
        }
      }

      setHerramientasActivas(keysDeseadas);
    } catch (e) {
      console.error('Error aplicando preset:', e);
    } finally {
      setSavingPreset(false);
    }
  };

  const PRESETS = [
    {
      id: 'recepcion',
      nombre: '🛎️ Recepcionista',
      desc: 'Workspace Recepción, Agenda, CRM & OATCs',
      keys: ['ws_recepcion', 'crm_agenda', 'crm_clientes', 'crm_oatc_historial', 'ws_caja'],
      color: 'hover:border-indigo-400 bg-indigo-50/40 text-indigo-700'
    },
    {
      id: 'caja',
      nombre: '💵 Workspace Venta (Cajero)',
      desc: 'Punto de Venta, Arqueos & Facturación SUNAT',
      keys: ['ws_caja', 'caja_arqueo', 'caja_reportes', 'ws_recepcion'],
      color: 'hover:border-emerald-400 bg-emerald-50/40 text-emerald-700'
    },
    {
      id: 'lab',
      nombre: '🧪 Workspace Taller (ODI / WMS)',
      desc: 'Despacho de Insumos, Fórmulas & Kardex',
      keys: ['ws_despacho', 'lab_almacen', 'lab_kardex'],
      color: 'hover:border-purple-400 bg-purple-50/40 text-purple-700'
    },
    {
      id: 'jefe',
      nombre: '🎯 Supervisor Piso',
      desc: 'Panel Jefe, WFM Turnos & Comisiones',
      keys: ['jefe_piso_panel', 'wfm_turnos', 'wfm_comisiones', 'ws_recepcion'],
      color: 'hover:border-cyan-400 bg-cyan-50/40 text-cyan-700'
    },
    {
      id: 'full',
      nombre: '⚡ Full Soporte',
      desc: 'Todos los Workspaces y CRM',
      keys: CATALOGO_HERRAMIENTAS.map(h => h.key),
      color: 'hover:border-amber-400 bg-amber-50/40 text-amber-700'
    },
    {
      id: 'clear',
      nombre: '🧹 Limpiar Todo',
      desc: 'Sin herramientas delegadas',
      keys: [],
      color: 'hover:border-rose-400 bg-rose-50/40 text-rose-700'
    }
  ];

  // Herramientas agrupadas por categoría
  const categoriasHerramientas = useMemo(() => {
    const map: Record<string, HerramientaDefinicion[]> = {
      WORKSPACE: [],
      OPERACIONES: [],
      CRM: [],
      FINANZAS: [],
      LOGISTICA: [],
      SISTEMA: []
    };

    CATALOGO_HERRAMIENTAS.forEach(h => {
      const match = !herramientaSearch || 
        h.nombre.toLowerCase().includes(herramientaSearch.toLowerCase()) ||
        h.descripcion.toLowerCase().includes(herramientaSearch.toLowerCase());
      
      if (match && map[h.categoria]) {
        map[h.categoria].push(h);
      }
    });

    return map;
  }, [herramientaSearch]);

  const CATEGORIA_INFO: Record<string, { label: string; icon: any; color: string }> = {
    WORKSPACE: { label: 'Workspaces Principales', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    OPERACIONES: { label: 'Operaciones & Piso', icon: Activity, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    CRM: { label: 'CRM & Front Desk', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    FINANZAS: { label: 'Finanzas & Caja', icon: Calculator, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    LOGISTICA: { label: 'Logística & Almacén', icon: PackageSearch, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    SISTEMA: { label: 'Configuración & Reglas', icon: Sliders, color: 'text-slate-600 bg-slate-100 border-slate-200' }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 min-h-[calc(100vh-4rem)] bg-slate-50">
      
      {/* Header Enterprise */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">Directorio de Personal & Delegación</h1>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {userRol === 'SUPERADMIN' 
                ? 'Administra roles jerárquicos globales, asignación multi-sede y delega herramientas quirúrgicas al personal.'
                : `Administrando ${todasSedes.length} sede(s) autorizada(s): ${todasSedes.map(s => s.nombre).join(', ') || 'Sede asignada'}.`}
            </p>
          </div>
        </div>

        <button 
          onClick={openNewUserModal} 
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 rounded-2xl transition-all shadow-md shadow-indigo-600/30 font-bold active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* Tarjetas Métricas Superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Personal</span>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <span className="text-[10px] text-slate-500 block">En sedes autorizadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Admins / Root</span>
          <p className="text-2xl font-black text-purple-700">{stats.admins}</p>
          <span className="text-[10px] text-purple-500 block">SuperAdmin & Admins</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Jefes Operativos</span>
          <p className="text-2xl font-black text-cyan-700">{stats.jefes}</p>
          <span className="text-[10px] text-cyan-500 block">Supervisión de piso</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Soporte Delegado</span>
          <p className="text-2xl font-black text-emerald-700">{stats.soporte}</p>
          <span className="text-[10px] text-emerald-500 block">Caja & Recepción</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Staff en Estación</span>
          <p className="text-2xl font-black text-amber-700">{stats.staff}</p>
          <span className="text-[10px] text-amber-500 block">Estilistas & Cosmiatras</span>
        </div>
      </div>

      {/* Barra de Filtros y Segmentación */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo, cargo o especialidad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="w-full md:w-64">
            <select 
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white cursor-pointer"
            >
              <option value="ALL">{userRol === 'SUPERADMIN' ? '🏢 Todas las Sedes' : '🏢 Todas mis Sedes'}</option>
              {todasSedes.map(s => (
                <option key={s.id} value={s.id}>📍 {s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Role Segmented Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { key: 'ALL', label: 'Todos' },
            ...(userRol === 'SUPERADMIN' ? [{ key: 'SUPERADMIN', label: '👑 SuperAdmin' }] : []),
            { key: 'ADMIN', label: '🏢 Admin' },
            { key: 'JEFE_OPERATIVO', label: '🎯 Jefe Operativo' },
            { key: 'SOPORTE', label: '🛠️ Soporte' },
            { key: 'STAFF', label: '💈 Staff' },
            { key: 'KIOSKO', label: '🪪 Kiosko' }
          ].map(tab => (

            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Principal del Directorio */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Colaboradores Registrados</span>
            <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-700 font-black">
              {usuariosFiltrados.length}
            </span>
          </h3>
          <button 
            onClick={cargarDatos}
            title="Recargar directorio"
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-bold">Cargando directorio de colaboradores...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-bold">No se encontraron colaboradores con los filtros seleccionados.</p>
              <button 
                onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setSedeFilter('ALL'); }}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-[11px] text-slate-400 uppercase font-black bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Colaborador</th>
                  <th className="px-6 py-4">Rol Jerárquico</th>
                  <th className="px-6 py-4">Sedes Asignadas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Delegación & Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map(u => {
                  const esSoporte = u.rol === 'SOPORTE';
                  const esAdmin = u.rol === 'ADMIN' || u.rol === 'SUPERADMIN';
                  const esJefe = u.rol === 'JEFE_OPERATIVO' || u.rol === 'JEFE_OPERACIONES';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-600 border border-indigo-500/30 flex items-center justify-center font-black text-sm shadow-sm">
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.nombre}</span>
                              {u.rol === 'SUPERADMIN' && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-black">ROOT</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{u.email || 'Sin correo de login'}</p>
                            {u.especialidad && (
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                                {u.especialidad}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border block w-fit ${
                            u.rol === 'SUPERADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.rol === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            u.rol === 'JEFE_OPERATIVO' || u.rol === 'JEFE_OPERACIONES' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            u.rol === 'SOPORTE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            u.rol === 'STAFF' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {u.rol || 'SOPORTE'}
                          </span>
                          
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border block w-fit ${
                            u.regimen_laboral === 'PLANILLA_5TA'
                              ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200'
                              : 'bg-amber-50/70 text-amber-700 border-amber-200'
                          }`}>
                            {u.regimen_laboral === 'PLANILLA_5TA' ? '📄 Planilla 5ta' : '🧾 RHE 4ta'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {u.sedes_ids && u.sedes_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.sedes_ids.map(sid => {
                              const sObj = todasSedes.find(s => s.id === sid);
                              return (
                                <span key={sid} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                                  {sObj?.nombre || 'Sede'}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ⚠️ Sin sede fija
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {u.estado === 'INACTIVO' ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" /> Activo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.rol === 'ADMIN' && userRol !== 'SUPERADMIN' ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Solo Lectura</span>
                            </span>
                          ) : (
                            <>
                              {/* Botón de Delegación Quirúrgica */}
                              <button 
                                onClick={() => openDelegarModal(u)} 
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                                  esSoporte
                                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-700 border-emerald-300 shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title="Delegar herramientas quirúrgicas"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                                <span>Herramientas</span>
                              </button>

                              <button 
                                onClick={() => openEditModal(u)} 
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                title="Editar usuario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal 1: Crear / Editar Usuario */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        title={editId ? 'Editar Colaborador' : 'Nuevo Colaborador'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nombre Completo *</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
              placeholder="Ej. Tales de Mileto"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Correo Electrónico (Login)</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="tales@vaikuntha.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Especialidad / Cargo</label>
            <input 
              type="text" 
              value={formData.especialidad}
              onChange={e => setFormData({...formData, especialidad: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej. Cajero & POS / Especialista Capilar"
            />
          </div>
          
          {!editId && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Contraseña Inicial *</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required={!editId}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Rol Jerárquico</label>
              <select 
                value={formData.rol}
                onChange={e => setFormData({...formData, rol: e.target.value})}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                {rolesDisponibles.map(r => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Estado de Cuenta</label>
              <select 
                value={formData.estado || 'ACTIVO'}
                onChange={e => setFormData({...formData, estado: e.target.value})}
                className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="ACTIVO">ACTIVO (Habilitado)</option>
                <option value="INACTIVO">INACTIVO (Suspendido)</option>
              </select>
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              💼 Régimen Laboral & Compensación
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, regimen_laboral: 'HONORARIOS_RHE'})}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                  formData.regimen_laboral === 'HONORARIOS_RHE'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-sm mb-0.5">🧾 Honorarios RHE</span>
                <span className="text-[10px] text-slate-500 font-normal">Comisiones + 4ta Cat.</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, regimen_laboral: 'PLANILLA_5TA'})}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                  formData.regimen_laboral === 'PLANILLA_5TA'
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-sm mb-0.5">📄 Planilla de Sueldos</span>
                <span className="text-[10px] text-slate-500 font-normal">Sueldo Base + 5ta Cat.</span>
              </button>
            </div>

            {formData.regimen_laboral === 'PLANILLA_5TA' ? (
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Sueldo Base Mensual (S/):</label>
                    <input 
                      type="number"
                      value={formData.sueldo_base || ''}
                      onChange={e => setFormData({...formData, sueldo_base: Number(e.target.value)})}
                      placeholder="1500"
                      min={0}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Régimen Pensionario:</label>
                    <select
                      value={formData.tipo_pension || 'AFP'}
                      onChange={e => setFormData({...formData, tipo_pension: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                    >
                      <option value="AFP">AFP (Integra / Prima / Profuturo / Habitat)</option>
                      <option value="ONP">ONP (13% Ley)</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.asignacion_familiar || false}
                    onChange={e => setFormData({...formData, asignacion_familiar: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Percibe Asignación Familiar (+10% RMV)</span>
                </label>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">% Comisión por Servicios:</label>
                    <input 
                      type="number"
                      value={formData.porcentaje_comision || ''}
                      onChange={e => setFormData({...formData, porcentaje_comision: Number(e.target.value)})}
                      placeholder="40"
                      min={0}
                      max={100}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Tarifa por Hora / Turno (S/):</label>
                    <input 
                      type="number"
                      value={formData.tarifa_hora || ''}
                      onChange={e => setFormData({...formData, tarifa_hora: Number(e.target.value)})}
                      placeholder="0"
                      min={0}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-700">Liquidación quincenal/mensual con emisión de Recibo por Honorarios Electrónico (RHE).</p>
              </div>
            )}
          </div>
          
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Sedes Asignadas</label>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {todasSedes.map(sede => (
                <label key={sede.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors">
                  <input 
                    type="checkbox"
                    checked={formData.sedes_ids?.includes(sede.id) || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const current = formData.sedes_ids || [];
                      if (checked) {
                        setFormData({...formData, sedes_ids: [...current, sede.id]});
                      } else {
                        setFormData({...formData, sedes_ids: current.filter(id => id !== sede.id)});
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="font-bold">{sede.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={closeModal}
              className="w-1/2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving || !formData.nombre}
              className="w-1/2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isSaving ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Matriz Visual de Delegación Quirúrgica con Presets de 1 Clic */}
      <Modal
        isOpen={isDelegarModalOpen}
        onClose={() => setIsDelegarModalOpen(false)}
        title={`Delegación Quirúrgica: ${agenteDelegando?.nombre || ''}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5 mt-2">
          
          {/* Header del Agente */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-black uppercase">
                  {agenteDelegando?.rol || 'SOPORTE'}
                </span>
                <h4 className="text-base font-black">{agenteDelegando?.nombre}</h4>
              </div>
              <p className="text-xs text-slate-300">{agenteDelegando?.email || 'Sin correo'}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                {herramientasActivas.length} Herramientas Delegadas
              </span>
            </div>
          </div>

          {/* Barra de Presets Rápidos */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              ⚡ Presets Rápidos de 1 Clic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={savingPreset}
                  onClick={() => aplicarPreset(preset.keys)}
                  className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${preset.color}`}
                >
                  <span className="text-xs font-black block">{preset.nombre}</span>
                  <span className="text-[9px] text-slate-500 font-medium block mt-0.5 leading-tight">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buscador interno de herramientas */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtrar herramientas por nombre o módulo..." 
              value={herramientaSearch}
              onChange={(e) => setHerramientaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Matriz Categorizada */}
          {loadingHerramientas ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-bold">Cargando permisos del colaborador...</p>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-5 pr-1">
              {Object.entries(categoriasHerramientas).map(([catKey, items]) => {
                if (items.length === 0) return null;
                const catMeta = CATEGORIA_INFO[catKey] || { label: catKey, icon: Briefcase, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                const IconCat = catMeta.icon;

                return (
                  <div key={catKey} className="space-y-2.5">
                    {/* Header de Categoría */}
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                      <div className={`p-1.5 rounded-lg border text-xs ${catMeta.color}`}>
                        <IconCat className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {catMeta.label}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">
                        ({items.filter(h => herramientasActivas.includes(h.key)).length}/{items.length} activas)
                      </span>
                    </div>

                    {/* Cards de Herramientas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {items.map((h) => {
                        const isActivo = herramientasActivas.includes(h.key);
                        return (
                          <div 
                            key={h.key} 
                            onClick={() => toggleHerramienta(h.key)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                              isActivo 
                                ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <h5 className={`text-xs font-bold transition-colors ${
                                isActivo ? 'text-emerald-900' : 'text-slate-800 group-hover:text-indigo-600'
                              }`}>
                                {h.nombre}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-snug">{h.descripcion}</p>
                              <span className="text-[9px] font-mono text-slate-400 block pt-0.5">{h.ruta}</span>
                            </div>

                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                              isActivo 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                                : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                            }`}>
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Los cambios se guardan automáticamente en tiempo real.
            </span>
            <button
              type="button"
              onClick={() => setIsDelegarModalOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Cerrar & Guardar
            </button>
          </div>

        </div>
      </Modal>

    </div>
  );
}
