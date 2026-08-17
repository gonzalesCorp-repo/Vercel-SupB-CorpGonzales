'use client';

import { useState } from 'react';
import { OATC } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';

interface UseOATCActionsProps {
  onSuccess?: () => void;
  oatcs?: OATC[];
  onOptimisticUpdate?: (id: string, partialData: Partial<OATC>) => void;
  onOptimisticRemove?: (id: string) => void;
}

export function useOATCActions({
  onSuccess,
  oatcs = [],
  onOptimisticUpdate,
  onOptimisticRemove
}: UseOATCActionsProps = {}) {
  const [isCanceling, setIsCanceling] = useState(false);
  const supabase = createClient();
  const { showAlert } = useUIStore();

  const handleApprove = async (oatc: OATC) => {
    if (!oatc.id) return;
    const oatcId = oatc.id;

    // 📸 1. Snapshot para Rollback Seguro
    const prevSnapshot: Partial<OATC> = {
      estado_proceso: oatc.estado_proceso,
      cambios_pendientes: oatc.cambios_pendientes,
      hora_fin_atencion: oatc.hora_fin_atencion
    };

    if (oatc.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION' || oatc.estado_proceso === 'PENDIENTE_CANCELACION') {
      // ⚡ Mutación Optimista Instantánea (0ms)
      if (onOptimisticUpdate) {
        onOptimisticUpdate(oatcId, {
          estado_proceso: 'CANCELADO',
          cambios_pendientes: null,
          hora_fin_atencion: new Date().toISOString()
        });
      }

      try {
        const { error } = await supabase
          .from('oatc')
          .update({ 
            estado_proceso: 'CANCELADO',
            hora_fin_atencion: new Date().toISOString(),
            cambios_pendientes: null,
            motivo_cancelacion_id: oatc.cambios_pendientes?.motivo_id || null,
            detalle_cancelacion: oatc.cambios_pendientes?.detalle || 'Cancelado por el staff'
          })
          .eq('id', oatcId);

        if (error) throw error;

        if (oatc.agente_id) {
          await supabase.from('agentes').update({ estado_operativo: 'DISPONIBLE' }).eq('id', oatc.agente_id);
        }

        showAlert('Solicitud de cancelación aprobada con éxito', 'info');
        if (onSuccess) onSuccess();
      } catch (err: any) {
        // 🛡️ Rollback Automático ante fallos
        if (onOptimisticUpdate) onOptimisticUpdate(oatcId, prevSnapshot);
        showAlert(`Error al procesar cancelación: ${err.message}`, 'error');
      }
      return;
    }

    let nuevoEstado = 'POR_COBRAR';
    if (oatc.estado_proceso === 'PENDIENTE_INICIO' || oatc.estado_proceso === 'EN_ESPERA') {
      nuevoEstado = 'EN_PROCESO';
    } else if (oatc.estado_proceso === 'PENDIENTE_PRE_COBRO') {
      nuevoEstado = 'PRE_COBRADO';
    }
    
    // ⚡ Mutación Optimista Instantánea (0ms)
    if (onOptimisticUpdate) {
      onOptimisticUpdate(oatcId, {
        estado_proceso: nuevoEstado,
        cambios_pendientes: null
      });
    }

    try {
      const { error } = await supabase
        .from('oatc')
        .update({ 
          estado_proceso: nuevoEstado,
          cambios_pendientes: null
        })
        .eq('id', oatcId);

      if (error) throw error;

      showAlert(`Orden actualizada a ${nuevoEstado}`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // 🛡️ Rollback Automático
      if (onOptimisticUpdate) onOptimisticUpdate(oatcId, prevSnapshot);
      showAlert(`Error al actualizar estado: ${err.message}`, 'error');
    }
  };

  const submitReject = async (oatcToReject: OATC | null, rejectReason: string) => {
    if (!oatcToReject?.id) return { error: 'Invalid parameters' };
    const oatcId = oatcToReject.id;

    const prevSnapshot: Partial<OATC> = {
      estado_proceso: oatcToReject.estado_proceso,
      cambios_pendientes: oatcToReject.cambios_pendientes
    };

    let estadoAnterior = oatcToReject.estado_proceso === 'PENDIENTE_INICIO' ? 'ASESORIA' : 'EN_PROCESO';
    if (oatcToReject.estado_proceso === 'PENDIENTE_PRE_COBRO') {
      estadoAnterior = 'EN_PROCESO';
    }
    
    // ⚡ Mutación Optimista Instantánea (0ms)
    if (onOptimisticUpdate) {
      onOptimisticUpdate(oatcId, {
        estado_proceso: estadoAnterior,
        cambios_pendientes: null
      });
    }

    try {
      const { error } = await supabase
        .from('oatc')
        .update({ 
          estado_proceso: estadoAnterior,
          cambios_pendientes: null
        })
        .eq('id', oatcId);

      if (error) throw error;

      showAlert('Solicitud rechazada. Orden restituida a su fase previa.', 'info');
      if (onSuccess) onSuccess();
      return { error: null };
    } catch (err: any) {
      // 🛡️ Rollback Automático
      if (onOptimisticUpdate) onOptimisticUpdate(oatcId, prevSnapshot);
      showAlert(`Error al rechazar solicitud: ${err.message}`, 'error');
      return { error: err.message };
    }
  };

  const handleCancelar = async (oatcId: string, selectedMotivoId: string, detalleCancelacion: string) => {
    if (!selectedMotivoId) {
      showAlert('Por favor, selecciona un motivo de cancelación.', 'warning');
      return { error: 'No reason provided' };
    }
    
    if (!confirm('¿Estás seguro de que deseas cancelar esta atención?')) return { error: 'Cancelled by user' };
    
    setIsCanceling(true);

    const oatc = oatcs.find(o => o.id === oatcId);
    const prevSnapshot: Partial<OATC> = oatc ? {
      estado_proceso: oatc.estado_proceso,
      hora_fin_atencion: oatc.hora_fin_atencion
    } : {};

    // ⚡ Mutación Optimista Instantánea (0ms)
    if (onOptimisticUpdate) {
      onOptimisticUpdate(oatcId, {
        estado_proceso: 'CANCELADO',
        hora_fin_atencion: new Date().toISOString()
      });
    }

    try {
      if (oatc?.agente_id) {
        await supabase.from('agentes').update({ estado_operativo: 'DISPONIBLE' }).eq('id', oatc.agente_id);
      }
      
      const { error } = await supabase
        .from('oatc')
        .update({ 
          estado_proceso: 'CANCELADO', 
          hora_fin_atencion: new Date().toISOString(),
          motivo_cancelacion_id: selectedMotivoId,
          detalle_cancelacion: detalleCancelacion.trim() || null
        })
        .eq('id', oatcId);

      if (error) throw error;

      showAlert('Atención cancelada correctamente', 'info');
      if (onSuccess) onSuccess();
      setIsCanceling(false);
      return { error: null };
    } catch (err: any) {
      // 🛡️ Rollback Automático
      if (onOptimisticUpdate) onOptimisticUpdate(oatcId, prevSnapshot);
      showAlert(`Error al cancelar atención: ${err.message}`, 'error');
      setIsCanceling(false);
      return { error: err.message };
    }
  };

  return {
    isCanceling,
    handleApprove,
    submitReject,
    handleCancelar
  };
}
