'use client';

import React from 'react';
import { Users, Shield, Lock, Zap, Edit2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { AgenteAdmin } from './types';

export interface UsuariosTableProps {
  usuarios: AgenteAdmin[];
  isLoading: boolean;
  userRol?: string | null;
  todasSedes: { id: string; nombre: string }[];
  openEditModal: (u: AgenteAdmin) => void;
  openDelegarModal: (u: AgenteAdmin) => void;
  onRefresh?: () => void;
  onLimpiarFiltros?: () => void;
}

export function UsuariosTable({
  usuarios,
  isLoading,
  userRol,
  todasSedes,
  openEditModal,
  openDelegarModal,
  onRefresh,
  onLimpiarFiltros
}: UsuariosTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>Colaboradores Registrados</span>
          <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-700 font-black">
            {usuarios.length}
          </span>
        </h3>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            title="Recargar directorio"
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs font-bold">Cargando directorio de colaboradores...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-bold">No se encontraron colaboradores con los filtros seleccionados.</p>
            {onLimpiarFiltros && (
              <button 
                onClick={onLimpiarFiltros}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
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
                {usuarios.map((u: AgenteAdmin) => {
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
                            u.regimen_laboral === 'FREELANCER_COMISION'
                              ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
                              : u.regimen_laboral === 'PLANILLA_5TA'
                                ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50/70 text-amber-700 border-amber-200'
                          }`}>
                            {u.regimen_laboral === 'FREELANCER_COMISION'
                              ? '⚡ Freelancer'
                              : u.regimen_laboral === 'PLANILLA_5TA'
                                ? '📄 Planilla 5ta'
                                : '🧾 RHE 4ta'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {u.sedes_ids && u.sedes_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.sedes_ids.map((sid: string) => {
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
  );
}
