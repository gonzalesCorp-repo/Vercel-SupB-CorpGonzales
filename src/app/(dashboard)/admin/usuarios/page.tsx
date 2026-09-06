'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { 
  obtenerTodosLosAgentes, 
  guardarAgente, 
  obtenerTodasLasSedes,
  obtenerSedesPermitidasAgente 
} from '@/services/admin';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { 
  obtenerHerramientasAgente, 
  concederHerramienta, 
  revocarHerramienta
} from '@/services/permisos';
import { obtenerRolesSistema, RolSistema } from '@/services/roles';
import { obtenerConfiguracionRemunerativa, guardarConfiguracionRemunerativa } from '@/services/liquidaciones';
import { AgenteAdmin } from '@/components/admin/usuarios/types';
import { UsuarioFormModal } from '@/components/admin/usuarios/UsuarioFormModal';
import { UsuarioPermisosModal } from '@/components/admin/usuarios/UsuarioPermisosModal';
import { UsuariosTable } from '@/components/admin/usuarios/UsuariosTable';

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
    regimen_laboral: 'FREELANCER_COMISION',
    sueldo_base: 0,
    tipo_pension: 'AFP',
    asignacion_familiar: false,
    porcentaje_comision: 40,
    tarifa_hora: 0,
    frecuencia_corte: 'DIARIA',
    dia_pago: '30'
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [todasSedes, setTodasSedes] = useState<{id: string, nombre: string}[]>([]);
  const [comisionesOverride, setComisionesOverride] = useState<Record<string, number>>({});

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
      const payload = {
        ...formData,
        id: editId,
        sueldo_base: formData.sueldo_base === '' ? 0 : Number(formData.sueldo_base ?? 0),
        porcentaje_comision: formData.porcentaje_comision === '' ? 40 : Number(formData.porcentaje_comision ?? 40),
        tarifa_hora: formData.tarifa_hora === '' ? 0 : Number(formData.tarifa_hora ?? 0),
        frecuencia_corte: formData.frecuencia_corte,
        dia_pago: formData.dia_pago
      };
      const exito = await guardarAgente(payload, formData.sedes_ids || []);
      if (exito) {
        if (editId) {
          try {
            const confActual = await obtenerConfiguracionRemunerativa(editId, formData.rol);
            const tipoRemun = formData.regimen_laboral === 'FREELANCER_COMISION' 
              ? 'FREELANCER_COMISION' 
              : formData.regimen_laboral === 'PLANILLA_5TA' 
                ? 'SOLO_SUELDO_BASE' 
                : 'SOLO_COMISIONES';
            
            const autoLiquidar = formData.regimen_laboral === 'FREELANCER_COMISION' || 
              formData.frecuencia_corte === 'DIARIA' || 
              formData.frecuencia_corte === 'POR_SERVICIO';

            await guardarConfiguracionRemunerativa({
              ...confActual,
              agente_id: editId,
              tipo_remuneracion: tipoRemun as any,
              sueldo_base: Number(payload.sueldo_base),
              porcentaje_comision_servicios: Number(payload.porcentaje_comision),
              frecuencia_corte: (formData.frecuencia_corte || confActual.frecuencia_corte) as any,
              dia_pago: formData.dia_pago || confActual.dia_pago || '30',
              auto_liquidar_cierre: autoLiquidar,
              comisiones_servicios_override: comisionesOverride
            });
          } catch (confErr) {
            console.warn('Error sincronizando contrato remunerativo:', confErr);
          }
        }
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
    setComisionesOverride({});
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
      regimen_laboral: 'FREELANCER_COMISION',
      sueldo_base: 0,
      tipo_pension: 'AFP',
      asignacion_familiar: false,
      porcentaje_comision: 40,
      tarifa_hora: 0,
      frecuencia_corte: 'DIARIA',
      dia_pago: '30'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: AgenteAdmin) => {
    if (user.rol === 'ADMIN' && userRol !== 'SUPERADMIN') return;

    setEditId(user.id!);
    const frecDefault = user.regimen_laboral === 'FREELANCER_COMISION' 
      ? 'DIARIA' 
      : user.regimen_laboral === 'PLANILLA_5TA' 
        ? 'MENSUAL' 
        : 'QUINCENAL';

    setFormData({
      nombre: user.nombre,
      email: user.email || '',
      rol: user.rol || 'STAFF',
      especialidad: user.especialidad || '',
      estado: user.estado,
      sedes_ids: user.sedes_ids || [],
      regimen_laboral: user.regimen_laboral || 'FREELANCER_COMISION',
      sueldo_base: Number(user.sueldo_base || 0),
      tipo_pension: user.tipo_pension || 'AFP',
      asignacion_familiar: Boolean(user.asignacion_familiar),
      porcentaje_comision: Number(user.porcentaje_comision || 40),
      tarifa_hora: Number(user.tarifa_hora || 0),
      frecuencia_corte: user.frecuencia_corte || frecDefault,
      dia_pago: user.dia_pago || '30'
    });

    if (user.id) {
      obtenerConfiguracionRemunerativa(user.id, user.rol).then(conf => {
        setComisionesOverride(conf.comisiones_servicios_override || {});
        if (conf.frecuencia_corte || conf.dia_pago) {
          setFormData(prev => ({
            ...prev,
            frecuencia_corte: conf.frecuencia_corte || prev.frecuencia_corte,
            dia_pago: conf.dia_pago || prev.dia_pago || '30'
          }));
        }
      }).catch(err => {
        console.error('Error cargando excepciones de comisiones:', err);
        setComisionesOverride({});
      });
    } else {
      setComisionesOverride({});
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setComisionesOverride({});
    setFormData({ 
      nombre: '', email: '', password: '', rol: 'STAFF', especialidad: '', estado: 'ACTIVO', sedes_ids: [],
      regimen_laboral: 'FREELANCER_COMISION', sueldo_base: 0, tipo_pension: 'AFP', asignacion_familiar: false, porcentaje_comision: 40, tarifa_hora: 0,
      frecuencia_corte: 'DIARIA', dia_pago: '30'
    });
  };

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

  const aplicarPreset = async (keysDeseadas: string[]) => {
    if (!agenteDelegando?.id) return;
    setSavingPreset(true);

    try {
      const currentKeys = [...herramientasActivas];
      
      for (const k of currentKeys) {
        if (!keysDeseadas.includes(k)) {
          await revocarHerramienta(agenteDelegando.id, k);
        }
      }

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
              id="usuarios-search-input"
              name="usuarios_search"
              placeholder="Buscar por nombre, correo, cargo o especialidad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="w-full md:w-64">
            <select 
              id="usuarios-sede-filter-select"
              name="usuarios_sede_filter"
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

      {/* Tabla Modular de Usuarios */}
      <UsuariosTable
        usuarios={usuariosFiltrados}
        isLoading={isLoading}
        userRol={userRol}
        todasSedes={todasSedes}
        openEditModal={openEditModal}
        openDelegarModal={openDelegarModal}
        onRefresh={cargarDatos}
        onLimpiarFiltros={() => { setSearchTerm(''); setRoleFilter('ALL'); setSedeFilter('ALL'); }}
      />

      {/* Modal 1: Formulario de Colaborador (Crear/Editar) */}
      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editId={editId}
        formData={formData}
        setFormData={setFormData}
        rolesDisponibles={rolesDisponibles}
        todasSedes={todasSedes}
        comisionesOverride={comisionesOverride}
        setComisionesOverride={setComisionesOverride}
        isSaving={isSaving}
      />

      {/* Modal 2: Delegación Quirúrgica de Permisos */}
      <UsuarioPermisosModal
        isOpen={isDelegarModalOpen}
        onClose={() => setIsDelegarModalOpen(false)}
        agenteDelegando={agenteDelegando}
        herramientasActivas={herramientasActivas}
        toggleHerramienta={toggleHerramienta}
        aplicarPreset={aplicarPreset}
        loadingHerramientas={loadingHerramientas}
        savingPreset={savingPreset}
        herramientaSearch={herramientaSearch}
        setHerramientaSearch={setHerramientaSearch}
      />

    </div>
  );
}
