'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ComisionesGranularesEditor } from '@/components/admin/ComisionesGranularesEditor';
import { RolSistema } from '@/services/roles';
import { ShieldCheck } from 'lucide-react';
import { AgenteAdmin } from './types';

export interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  editId: string | null;
  formData: Partial<AgenteAdmin>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<AgenteAdmin>>>;
  rolesDisponibles: RolSistema[];
  todasSedes: { id: string; nombre: string }[];
  comisionesOverride: Record<string, number>;
  setComisionesOverride: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isSaving: boolean;
}

export function UsuarioFormModal({
  isOpen,
  onClose,
  onSubmit,
  editId,
  formData,
  setFormData,
  rolesDisponibles,
  todasSedes,
  comisionesOverride,
  setComisionesOverride,
  isSaving
}: UsuarioFormModalProps) {
  return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        title={editId ? 'Editar Colaborador' : 'Nuevo Colaborador'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div>
            <label htmlFor="usuario-nombre-input" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nombre Completo *</label>
            <input 
              type="text" 
              id="usuario-nombre-input"
              name="nombre"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
              placeholder="Ej. Tales de Mileto"
            />
          </div>

          <div>
            <label htmlFor="usuario-email-input" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Correo Electrónico (Login)</label>
            <input 
              type="email" 
              id="usuario-email-input"
              name="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="tales@vaikuntha.com"
            />
          </div>

          <div>
            <label htmlFor="usuario-especialidad-input" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Especialidad / Cargo</label>
            <input 
              type="text" 
              id="usuario-especialidad-input"
              name="especialidad"
              value={formData.especialidad}
              onChange={e => setFormData({...formData, especialidad: e.target.value})}
              className="w-full text-sm text-slate-900 bg-white border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej. Cajero & POS / Especialista Capilar"
            />
          </div>
          
          {!editId && (
            <div>
              <label htmlFor="usuario-password-input" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Contraseña Inicial *</label>
              <input 
                type="password" 
                id="usuario-password-input"
                name="password"
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
              <label htmlFor="usuario-rol-select" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Rol Jerárquico</label>
              <select 
                id="usuario-rol-select"
                name="rol"
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
              <label htmlFor="usuario-estado-select" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Estado de Cuenta</label>
              <select 
                id="usuario-estado-select"
                name="estado"
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
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              💼 Régimen Laboral & Compensación
            </span>
            
            {/* Tríada de Regímenes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData, 
                  regimen_laboral: 'FREELANCER_COMISION',
                  frecuencia_corte: formData.frecuencia_corte === 'SEMANAL' || formData.frecuencia_corte === 'QUINCENAL' || formData.frecuencia_corte === 'MENSUAL' ? 'DIARIA' : (formData.frecuencia_corte || 'DIARIA'),
                  sueldo_base: 0
                })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                  formData.regimen_laboral === 'FREELANCER_COMISION'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs mb-0.5 font-black">⚡ Freelancer / Destajo</span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight block">Comisión diaria al cierre</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData, 
                  regimen_laboral: 'HONORARIOS_RHE',
                  frecuencia_corte: formData.frecuencia_corte === 'DIARIA' || formData.frecuencia_corte === 'POR_SERVICIO' ? 'QUINCENAL' : (formData.frecuencia_corte || 'QUINCENAL'),
                  sueldo_base: 0
                })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                  formData.regimen_laboral === 'HONORARIOS_RHE'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 ring-2 ring-amber-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs mb-0.5 font-black">🧾 Honorarios RHE</span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight block">Locación + 4ta Cat.</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData, 
                  regimen_laboral: 'PLANILLA_5TA',
                  frecuencia_corte: 'MENSUAL',
                  dia_pago: formData.dia_pago || '30'
                })}
                className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                  formData.regimen_laboral === 'PLANILLA_5TA'
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs mb-0.5 font-black">📄 Planilla 5ta</span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight block">Sueldo Base + Beneficios</span>
              </button>
            </div>

            {/* Configuración contextual según régimen */}
            {formData.regimen_laboral === 'FREELANCER_COMISION' && (
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="usuario-porcentaje-comision-freelancer" className="block text-[10px] font-bold text-slate-600 mb-1">% Comisión General:</label>
                    <input 
                      type="number"
                      step="any"
                      min={0}
                      max={100}
                      id="usuario-porcentaje-comision-freelancer"
                      name="porcentaje_comision"
                      value={formData.porcentaje_comision ?? ''}
                      onChange={e => setFormData({...formData, porcentaje_comision: e.target.value})}
                      placeholder="40"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="usuario-frecuencia-freelancer" className="block text-[10px] font-bold text-slate-600 mb-1">Frecuencia Liquidación:</label>
                    <select
                      id="usuario-frecuencia-freelancer"
                      name="frecuencia_corte"
                      value={formData.frecuencia_corte || 'DIARIA'}
                      onChange={e => setFormData({...formData, frecuencia_corte: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                    >
                      <option value="DIARIA">Diaria (Al cierre de jornada)</option>
                      <option value="POR_SERVICIO">Por Servicio (Inmediata)</option>
                    </select>
                  </div>
                </div>

                {/* Banner de Blindaje Jurídico */}
                <div className="p-3 bg-white/90 rounded-lg border border-emerald-300 text-emerald-900 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Blindaje Legal & Prevención de Laboralidad (SUNAFIL)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                    Al registrar <strong>SALIDA</strong> o cierre masivo de tienda, se emitirá de inmediato la solicitud de liquidación en Caja/POS para extinguir los saldos pendientes antes del retiro del colaborador. Si no atendió servicios, se registrará constancia formal de S/ 0.00.
                  </p>
                </div>
              </div>
            )}

            {formData.regimen_laboral === 'HONORARIOS_RHE' && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="usuario-porcentaje-comision-rhe" className="block text-[10px] font-bold text-slate-600 mb-1">% Comisión por Servicios:</label>
                    <input 
                      type="number"
                      step="any"
                      min={0}
                      max={100}
                      id="usuario-porcentaje-comision-rhe"
                      name="porcentaje_comision"
                      value={formData.porcentaje_comision ?? ''}
                      onChange={e => setFormData({...formData, porcentaje_comision: e.target.value})}
                      placeholder="40"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="usuario-tarifa-hora-rhe" className="block text-[10px] font-bold text-slate-600 mb-1">Tarifa por Turno / Hora (S/):</label>
                    <input 
                      type="number"
                      step="any"
                      min={0}
                      id="usuario-tarifa-hora-rhe"
                      name="tarifa_hora"
                      value={formData.tarifa_hora ?? ''}
                      onChange={e => setFormData({...formData, tarifa_hora: e.target.value})}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="usuario-frecuencia-rhe" className="block text-[10px] font-bold text-slate-600 mb-1">Frecuencia de Pago (Corte RHE):</label>
                  <select
                    id="usuario-frecuencia-rhe"
                    name="frecuencia_corte"
                    value={formData.frecuencia_corte || 'QUINCENAL'}
                    onChange={e => setFormData({...formData, frecuencia_corte: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  >
                    <option value="QUINCENAL">Quincenal (Corte cada 15 días - Estándar)</option>
                    <option value="SEMANAL">Semanal (Corte cada 7 días)</option>
                    <option value="MENSUAL">Mensual (Fin de mes)</option>
                  </select>
                </div>

                <p className="text-[10px] text-amber-700 leading-tight">
                  Locación de servicios con emisión obligatoria de Recibo por Honorarios Electrónico (RHE) y retención del 8% de 4ta Categoría según calendario SUNAT.
                </p>
              </div>
            )}

            {formData.regimen_laboral === 'PLANILLA_5TA' && (
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="usuario-sueldo-base-input" className="block text-[10px] font-bold text-slate-600 mb-1">Sueldo Base Mensual (S/):</label>
                    <input 
                      type="number"
                      step="any"
                      min={0}
                      id="usuario-sueldo-base-input"
                      name="sueldo_base"
                      value={formData.sueldo_base ?? ''}
                      onChange={e => setFormData({...formData, sueldo_base: e.target.value})}
                      placeholder="1500"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="usuario-tipo-pension-select" className="block text-[10px] font-bold text-slate-600 mb-1">Régimen Pensionario:</label>
                    <select
                      id="usuario-tipo-pension-select"
                      name="tipo_pension"
                      value={formData.tipo_pension || 'AFP'}
                      onChange={e => setFormData({...formData, tipo_pension: e.target.value})}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                    >
                      <option value="AFP">AFP (Integra / Prima / Profuturo / Habitat)</option>
                      <option value="ONP">ONP (13% Ley)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="usuario-dia-pago-select" className="block text-[10px] font-bold text-slate-600 mb-1">Día de Pago en Planilla:</label>
                  <select
                    id="usuario-dia-pago-select"
                    name="dia_pago"
                    value={formData.dia_pago || '30'}
                    onChange={e => setFormData({...formData, dia_pago: e.target.value})}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  >
                    <option value="30">Fin de Mes (Día 30/31)</option>
                    <option value="28">Día 28 de cada mes</option>
                    <option value="15">Quincena (Día 15 de cada mes)</option>
                    <option value="15_30">Quincena y Fin de Mes (Días 15 y 30)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    id="usuario-asignacion-familiar-checkbox"
                    name="asignacion_familiar"
                    checked={formData.asignacion_familiar || false}
                    onChange={e => setFormData({...formData, asignacion_familiar: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Percibe Asignación Familiar (+10% RMV)</span>
                </label>
              </div>
            )}
          </div>

          {/* Excepciones Granulares de Comisión por Servicio */}
          <div className="pt-3 border-t border-slate-100">
            <ComisionesGranularesEditor
              overrides={comisionesOverride}
              onChange={setComisionesOverride}
              comisionGeneral={formData.porcentaje_comision || 40}
              disabled={isSaving}
            />
          </div>
          
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Sedes Asignadas</span>
            <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {todasSedes.map(sede => (
                <label key={sede.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-2 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors">
                  <input 
                    type="checkbox"
                    id={`usuario-sede-${sede.id}`}
                    name={`usuario_sede_${sede.id}`}
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
              onClick={onClose}
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
  );
}
