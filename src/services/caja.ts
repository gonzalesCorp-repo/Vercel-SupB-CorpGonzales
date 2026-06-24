import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { OATC } from './recepcion';

const supabase = createClient();

export interface Factura {
  id?: string;
  oatc_id: string;
  cliente_nombre: string;
  total: number;
  metodo_pago: string;
  detalles?: any;
  created_at?: string;
}

export async function obtenerTicketsAbiertos(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('estado_pago', 'Pendiente')
    .eq('sede_id', sedeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo tickets abiertos:", error);
    return [];
  }
  return data as OATC[];
}

// Procesar el pago y guardar factura
export async function procesarPago(factura: Factura): Promise<boolean> {
  const sedeId = useAppStore.getState().sedeActiva?.id;

  // 1. Guardar factura
  const { error: facturaError } = await supabase
    .from('facturas')
    .insert([
      {
        oatc_id: factura.oatc_id,
        cliente_nombre: factura.cliente_nombre,
        total: factura.total,
        metodo_pago: factura.metodo_pago,
        detalles: factura.detalles,
        sede_id: sedeId
      }
    ]);

  if (facturaError) {
    console.error("Error registrando factura:", facturaError);
    return false;
  }

  // 2. Actualizar OATC a Pagado
  const { error: oatcError } = await supabase
    .from('oatc')
    .update({ estado_pago: 'Pagado' })
    .eq('id', factura.oatc_id);

  if (oatcError) {
    console.error("Error actualizando OATC:", oatcError);
    return false;
  }

  return true;
}
