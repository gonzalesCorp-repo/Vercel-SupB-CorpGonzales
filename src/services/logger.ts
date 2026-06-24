import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

export async function registrarLog(modulo: string, accion: string, detalles: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return false;

    const sedeId = useAppStore.getState().sedeActiva?.id;

    const { error } = await supabase.from('system_logs').insert([{
      modulo,
      accion,
      usuario_email: user.email,
      detalles,
      sede_id: sedeId || null
    }]);

    if (error) {
      console.error("Error registrando log:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Excepción en logger:", error);
    return false;
  }
}

export async function obtenerLogs(limit = 100) {
  const { data, error } = await supabase
    .from('system_logs')
    .select('*, sedes(nombre)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error obteniendo logs:", error);
    return [];
  }
  return data;
}
