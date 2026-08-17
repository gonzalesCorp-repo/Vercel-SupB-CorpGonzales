'use client';

import { useState, useEffect, useCallback } from 'react';
import { OATC, MotivoCancelacion, obtenerOatcsActivosDelDia, obtenerMotivosCancelacion } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';

export function useOATCFlow() {
  const [oatcs, setOatcs] = useState<OATC[]>([]);
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dataOatcs, dataMotivos] = await Promise.all([
        obtenerOatcsActivosDelDia(),
        obtenerMotivosCancelacion()
      ]);
      setOatcs(dataOatcs);
      setMotivos(dataMotivos);
    } catch (error) {
      console.error('Error loading OATC data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mutación Optimista Instantánea (0ms de latencia)
  const optimisticUpdateOatc = useCallback((id: string, partialData: Partial<OATC>) => {
    setOatcs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...partialData } : o))
    );
  }, []);

  const optimisticRemoveOatc = useCallback((id: string) => {
    setOatcs((prev) => prev.filter((o) => o.id !== id));
  }, []);

  useEffect(() => {
    cargarDatos();

    const supabase = createClient();
    const channelName = `realtime-oatc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        cargarDatos();
      })
      .subscribe();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Error removiendo canal realtime-oatc:', e);
      }
      clearInterval(interval);
    };
  }, [cargarDatos]);

  return {
    oatcs,
    setOatcs,
    motivos,
    isLoading,
    now,
    cargarDatos,
    optimisticUpdateOatc,
    optimisticRemoveOatc
  };
}
