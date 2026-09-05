'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { 
  AgenteConfigRemunerativa, 
  TipoRemuneracion, 
  FrecuenciaCorte 
} from '@/types/liquidaciones';
import { 
  obtenerConfiguracionRemunerativa, 
  guardarConfiguracionRemunerativa 
} from '@/services/liquidaciones';
import { useUIStore } from '@/store/useUIStore';
import { Sliders, DollarSign, Percent, Calendar, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ComisionesGranularesEditor } from '@/components/admin/ComisionesGranularesEditor';

interface ConfiguracionRemuneracionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agente: {
    id: string;
    nombre: string;
    rol: string;
    especialidad?: string;
  };
  onConfiguracionGuardada: () => void;
}

export function ConfiguracionRemuneracionModal({
  isOpen,
  onClose,
  agente,
  onConfiguracionGuardada
}: ConfiguracionRemuneracionModalProps) {
  const [tipoRemuneracion, setTipoRemuneracion] = useState<TipoRemuneracion>('SOLO_COMISIONES');
  const [sueldoBase, setSueldoBase] = useState<number | string>(0);
  const [comisionServicios, setComisionServicios] = useState<number | string>(40);
  const [comisionProductos, setComisionProductos] = useState<number | string>(10);
  const [comisionesOverride, setComisionesOverride] = useState<Record<string, number>>({});
  const [frecuenciaCorte, setFrecuenciaCorte] = useState<FrecuenciaCorte>('DIARIA');
  const [permiteSolicitudManual, setPermiteSolicitudManual] = useState<boolean>(true);
  const [cuentaBancaria, setCuentaBancaria] = useState('');
  const [bancoPreferido, setBancoPreferido] = useState('BCP');
  const [documentoPago, setDocumentoPago] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { showAlert } = useUIStore();

  useEffect(() => {
    async function cargar() {
      setIsLoading(true);
      try {
        const conf = await obtenerConfiguracionRemunerativa(agente.id, agente.rol);
        setTipoRemuneracion(conf.tipo_remuneracion);
        setSueldoBase(conf.sueldo_base);
        setComisionServicios(conf.porcentaje_comision_servicios);
        setComisionProductos(conf.porcentaje_comision_productos);
        setFrecuenciaCorte(conf.frecuencia_corte);
        setPermiteSolicitudManual(conf.permite_solicitud_manual);
        setCuentaBancaria(conf.cuenta_bancaria_pago_preferida || '');
        setBancoPreferido(conf.banco_preferido || 'BCP');
        setDocumentoPago(conf.numero_documento_pago || '');
        setComisionesOverride(conf.comisiones_servicios_override || {});
      } catch (e) {
        console.error('Error cargando configuración remunerativa:', e);
      } finally {
        setIsLoading(false);
      }
    }
    if (isOpen) cargar();
  }, [isOpen, agente.id, agente.rol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await guardarConfiguracionRemunerativa({
        agente_id: agente.id,
        tipo_remuneracion: tipoRemuneracion,
        sueldo_base: sueldoBase === '' ? 0 : Number(sueldoBase || 0),
        porcentaje_comision_servicios: comisionServicios === '' ? 0 : Number(comisionServicios || 0),
        porcentaje_comision_productos: comisionProductos === '' ? 0 : Number(comisionProductos || 0),
        frecuencia_corte: frecuenciaCorte,
        permite_solicitud_manual: permiteSolicitudManual,
        cuenta_bancaria_pago_preferida: cuentaBancaria,
        banco_preferido: bancoPreferido,
        numero_documento_pago: documentoPago,
        comisiones_servicios_override: comisionesOverride
      });

      showAlert(`¡Contrato remunerativo de ${agente.nombre} actualizado con éxito!`, 'success');
      onConfiguracionGuardada();
      onClose();
    } catch (err: any) {
      showAlert('Error al guardar contrato: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`💼 Contrato Remunerativo: ${agente.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Tipo de Remuneración */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Esquema de Remuneración
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipoRemuneracion('SOLO_COMISIONES')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                tipoRemuneracion === 'SOLO_COMISIONES'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>% Solo Comisiones</span>
              <span className="text-[9px] font-normal opacity-80">Común en Staff de piso</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoRemuneracion('SOLO_SUELDO_BASE')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                tipoRemuneracion === 'SOLO_SUELDO_BASE'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>💵 Solo Sueldo Fijo</span>
              <span className="text-[9px] font-normal opacity-80">Común en Soporte/Recepción</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoRemuneracion('SUELDO_BASE_MAS_COMISIONES')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                tipoRemuneracion === 'SUELDO_BASE_MAS_COMISIONES'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>⚖️ Mixto (Fijo + %)</span>
              <span className="text-[9px] font-normal opacity-80">Sueldo Base + Comisión</span>
            </button>
          </div>
        </div>

        {/* Sueldo Base & Frecuencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="config-remun-sueldo-base" className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Sueldo Base Acordado (S/.)
            </label>
            <input
              id="config-remun-sueldo-base"
              name="sueldo_base"
              type="number"
              step="any"
              min="0"
              disabled={tipoRemuneracion === 'SOLO_COMISIONES'}
              value={sueldoBase ?? ''}
              onChange={(e) => setSueldoBase(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none disabled:opacity-40"
            />
          </div>

          <div>
            <label htmlFor="config-remun-frecuencia-corte" className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Frecuencia de Corte Negociada
            </label>
            <select
              id="config-remun-frecuencia-corte"
              name="frecuencia_corte"
              value={frecuenciaCorte}
              onChange={(e) => setFrecuenciaCorte(e.target.value as FrecuenciaCorte)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              <option value="DIARIA">📅 Diaria (Cierre diario de caja)</option>
              <option value="SEMANAL">📆 Semanal (Domingos / Lunes)</option>
              <option value="QUINCENAL">🌓 Quincenal (Día 15 y fin de mes)</option>
              <option value="MENSUAL">🗓️ Mensual (Planilla / RHE)</option>
              <option value="A_DEMANDA">⚡ A Demanda del Colaborador</option>
            </select>
          </div>
        </div>

        {/* Porcentajes de Comisiones */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="config-remun-comision-servicios" className="text-xs font-bold text-slate-500 uppercase block mb-1">
              % Comisión Servicios
            </label>
            <div className="relative">
              <input
                id="config-remun-comision-servicios"
                name="comision_servicios"
                type="number"
                step="any"
                min="0"
                max="100"
                disabled={tipoRemuneracion === 'SOLO_SUELDO_BASE'}
                value={comisionServicios ?? ''}
                onChange={(e) => setComisionServicios(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none disabled:opacity-40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          <div>
            <label htmlFor="config-remun-comision-productos" className="text-xs font-bold text-slate-500 uppercase block mb-1">
              % Comisión Productos Retail
            </label>
            <div className="relative">
              <input
                id="config-remun-comision-productos"
                name="comision_productos"
                type="number"
                step="any"
                min="0"
                max="100"
                value={comisionProductos ?? ''}
                onChange={(e) => setComisionProductos(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Excepciones Granulares por Servicio */}
        <ComisionesGranularesEditor
          overrides={comisionesOverride}
          onChange={setComisionesOverride}
          comisionGeneral={comisionServicios}
          disabled={tipoRemuneracion === 'SOLO_SUELDO_BASE' || isSubmitting}
        />

        {/* Datos Bancarios de Pago del Colaborador */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Datos Bancarios / Yape para Abonos
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="config-remun-banco" className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Banco / App</label>
              <input
                id="config-remun-banco"
                name="banco_preferido"
                type="text"
                value={bancoPreferido}
                onChange={(e) => setBancoPreferido(e.target.value)}
                placeholder="BCP, BBVA, Yape..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="config-remun-cuenta-bancaria" className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">N° Cuenta / CCI / Celular Yape</label>
              <input
                id="config-remun-cuenta-bancaria"
                name="cuenta_bancaria"
                type="text"
                value={cuentaBancaria}
                onChange={(e) => setCuentaBancaria(e.target.value)}
                placeholder="Ej. 193-XXXXXXXX-0-XX o 987654321"
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Permite Solicitud Manual en Móvil */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <label htmlFor="config-remun-permite-solicitud" className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
            <input
              id="config-remun-permite-solicitud"
              name="permite_solicitud_manual"
              type="checkbox"
              checked={permiteSolicitudManual}
              onChange={(e) => setPermiteSolicitudManual(e.target.checked)}
              className="rounded border-slate-400 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>Permitir al colaborador solicitar liquidación desde su móvil</span>
          </label>
          <span className="text-[10px] text-slate-400 font-bold">App Móvil</span>
        </div>

        {/* Botones de Acción */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Contrato'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
