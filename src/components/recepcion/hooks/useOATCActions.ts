'use client';

import { useState } from 'react';
import { OATC } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';

interface UseOATCActionsProps {
  onSuccess?: () => void;
  oatcs?: OATC[];
}

export function useOATCActions({ onSuccess, oatcs = [] }: UseOATCActionsProps = {}) {
  const [isCanceling, setIsCanceling] = useState(false);
  const supabase = createClient();

  const handleApprove = async (oatc: OATC) => {
    let nuevoEstado = oatc.estado_proceso === 'PENDIENTE_INICIO' ? 'EN_CURSO' : 'POR_COBRAR';
    if (oatc.estado_proceso === 'PENDIENTE_PRE_COBRO') {
      nuevoEstado = 'PRE_COBRADO';
    }
    
    const { error } = await supabase
      .from('oatc')
      .update({ 
        estado_proceso: nuevoEstado,
        cambios_pendientes: null
      })
      .eq('id', oatc.id);
      
    if (!error && onSuccess) onSuccess();
  };

  const submitReject = async (oatcToReject: OATC | null, rejectReason: string) => {
    if (!oatcToReject || !rejectReason.trim()) return { error: 'Invalid parameters' };

    let estadoAnterior = oatcToReject.estado_proceso === 'PENDIENTE_INICIO' ? 'ASESORIA' : 'EN_CURSO';
    if (oatcToReject.estado_proceso === 'PENDIENTE_PRE_COBRO') {
      estadoAnterior = 'EN_CURSO';
    }
    
    const { error } = await supabase
      .from('oatc')
      .update({ 
        estado_proceso: estadoAnterior,
        cambios_pendientes: { motivo_rechazo: rejectReason }
      })
      .eq('id', oatcToReject.id);

    if (!error && onSuccess) {
      onSuccess();
    }
    return { error };
  };

  const handleCancelar = async (oatcId: string, selectedMotivoId: string, detalleCancelacion: string) => {
    if (!selectedMotivoId) {
      alert('Por favor, selecciona un motivo de cancelación.');
      return { error: 'No reason provided' };
    }
    
    if (!confirm('¿Estás seguro de que deseas cancelar esta atención?')) return { error: 'Cancelled by user' };
    
    setIsCanceling(true);

    const oatc = oatcs.find(o => o.id === oatcId);
    if (oatc?.agente_id) {
      await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', oatc.agente_id);
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
      
    if (!error && onSuccess) {
      onSuccess();
    }
    setIsCanceling(false);
    return { error };
  };

  return {
    isCanceling,
    handleApprove,
    submitReject,
    handleCancelar
  };
}
