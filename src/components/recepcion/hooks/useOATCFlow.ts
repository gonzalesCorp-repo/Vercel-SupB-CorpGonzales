'use client';

import { useState, useEffect } from 'react';
import { OATC, MotivoCancelacion, obtenerOatcsActivosDelDia, obtenerMotivosCancelacion } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';

export function useOATCFlow() {
  const [oatcs, setOatcs] = useState<OATC[]>([]);
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const cargarDatos = async () => {
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
  };

  useEffect(() => {
    cargarDatos();

    const supabase = createClient();
    const channel = supabase.channel('realtime-oatc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        cargarDatos();
      })
      .subscribe();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return {
    oatcs,
    motivos,
    isLoading,
    now,
    cargarDatos
  };
}
