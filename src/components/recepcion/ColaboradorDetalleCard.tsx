'use client';

import React, { useState } from 'react';
import { 
  User, Clock, CheckCircle2, XCircle, Coffee, Shield, Activity, 
  Sparkles, Award, Scissors, UserCheck, AlertTriangle, Wifi, UserX, AlertCircle
} from 'lucide-react';
import { Agente, EstadoOperativoTurno } from '@/services/recepcion';
import { darDeBajaColaborador } from '@/services/agentes';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/useUIStore';

interface ColaboradorDetalleCardProps {
  agente: Agente;
  onClose?: () => void;
  onAgenteActualizado?: () => void;
}

export default function ColaboradorDetalleCard({ agente, onClose, onAgenteActualizado }: ColaboradorDetalleCardProps) {
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('Fin de contrato / Cese voluntario');
  const [isSubmittingBaja, setIsSubmittingBaja] = useState(false);

  const { showAlert } = useUIStore();
  const isStaff = agente.rol === 'STAFF' || !agente.rol;

  const horaIngreso = agente.horaUltimaMarcacion || 'Sin marcación hoy';

  const handleConfirmarBaja = async () => {
    setIsSubmittingBaja(true);
    try {
      await darDeBajaColaborador(agente.id, motivoBaja, 'Administración');
      showAlert(`Colaborador ${agente.nombre} dado de baja exitosamente.`, 'success');
      setModalBajaOpen(false);
      if (onAgenteActualizado) onAgenteActualizado();
      if (onClose) onClose();
    } catch (e: any) {
      showAlert('Error al dar de baja: ' + e.message, 'error');
    } finally {
      setIsSubmittingBaja(false);
    }
  };

  const getBadgeColors = (op?: EstadoOperativoTurno) => {
    switch (op) {
      case 'DISPONIBLE': return 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'OCUPADO': return 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'EN_REFRIGERIO': return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100">
      
      {/* Header Perfil Colaborador */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
            {agente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              {agente.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                isStaff 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {agente.rol || 'STAFF'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {agente.especialidad || 'Especialista General'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${getBadgeColors(agente.estadoOperativo)}`}>
            <span className={`w-2 h-2 rounded-full ${agente.estadoOperativo === 'DISPONIBLE' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`} />
            {agente.estadoOperativo || 'FUERA_DE_TURNO'}
          </span>
          <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
            Contrato: {agente.estado || 'ACTIVO'}
          </span>
        </div>
      </div>

      {/* Trazabilidad Horaria del Turno */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-500" /> Registro de Horarios del Turno (Web NFC)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Hora de Ingreso</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{horaIngreso}</p>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Wifi className="w-2.5 h-2.5" /> Validado NFC
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Inicio Refrigerio</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {agente.ultimoMovimientoAsistencia === 'INICIO_REFRIGERIO' ? (agente.horaUltimaMarcacion || 'Activo') : '01:30 PM'}
            </p>
            <span className="text-[9px] text-slate-400">
              {agente.ultimoMovimientoAsistencia === 'INICIO_REFRIGERIO' ? 'En pausa ahora' : 'Programado'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Fin Refrigerio</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">02:15 PM</p>
            <span className="text-[9px] text-slate-400">45 min máx</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Hora de Salida</span>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {agente.ultimoMovimientoAsistencia === 'SALIDA' ? (agente.horaUltimaMarcacion || 'Finalizado') : '08:00 PM'}
            </p>
            <span className="text-[9px] text-slate-400">
              {agente.ultimoMovimientoAsistencia === 'SALIDA' ? 'Turno Finalizado' : 'Estimada'}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen Operativo de Piso */}
      {isStaff && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" /> Resumen de Atenciones de Hoy (Piso)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-center">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">Por Turno (Cola)</span>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">4</p>
              <span className="text-[10px] text-slate-400">Asignadas</span>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-900/40 text-center">
              <span className="text-[10px] font-bold text-purple-600 uppercase block">Clientes Directos</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">2</p>
              <span className="text-[10px] text-slate-400">Citas / Preferencia</span>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center">
              <span className="text-[10px] font-bold text-rose-600 uppercase block">Rechazos</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">0</p>
              <span className="text-[10px] text-slate-400">Cancelaciones</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer de Acciones & Baja Laboral */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => setModalBajaOpen(true)}
          className="px-3 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1.5"
          title="Dar de baja o cesar al colaborador administrativamente"
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Dar de Baja</span>
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
        >
          Cerrar
        </button>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BAJA LABORAL */}
      {modalBajaOpen && (
        <Modal
          isOpen={modalBajaOpen}
          onClose={() => setModalBajaOpen(false)}
          title={`Confirmar Baja Laboral`}
        >
          <div className="space-y-4 text-slate-800 dark:text-slate-100">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Al dar de baja a <strong>{agente.nombre}</strong>, su estado laboral pasará a <strong>INACTIVO</strong>, se bloqueará su acceso al login y dejará de figurar en el monitor de disponibilidad.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Motivo de Cese / Baja</label>
              <input
                type="text"
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej. Fin de contrato, renuncia voluntaria..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalBajaOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarBaja}
                disabled={isSubmittingBaja}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmittingBaja ? 'Procesando...' : 'Confirmar Cese Laboral'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
