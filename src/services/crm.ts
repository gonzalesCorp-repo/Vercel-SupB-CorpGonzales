import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';

export interface CrmLead {
  id?: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_id?: string;
  servicio_interes?: string;
  agente_preferido_id?: string;
  agente_preferido_nombre?: string;
  origen?: string;
  estado?: 'NUEVO' | 'CONTACTADO' | 'AGENDADO' | 'DESCARTADO';
  motivo_abandono?: string;
  notas?: string;
  sede_id?: string;
  created_at?: string;
}

export async function crearLeadRecuperacion(lead: CrmLead): Promise<CrmLead | null> {
  const supabase = createClient();
  try {
    const payload = {
      cliente_nombre: lead.cliente_nombre || 'Cliente sin nombre',
      cliente_telefono: lead.cliente_telefono || null,
      cliente_id: lead.cliente_id || null,
      servicio_interes: lead.servicio_interes || 'Servicio General',
      agente_preferido_id: lead.agente_preferido_id || null,
      agente_preferido_nombre: lead.agente_preferido_nombre || null,
      origen: lead.origen || 'ABANDONO_TIEMPO_ESPERA',
      estado: lead.estado || 'NUEVO',
      motivo_abandono: lead.motivo_abandono || 'Cliente no pudo esperar turno de atención.',
      notas: lead.notas || `Lead generado automáticamente desde Vaikuntha Mobile para ${lead.agente_preferido_nombre || 'Staff'}.`,
      sede_id: lead.sede_id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('crm_leads')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creando lead de recuperación en CRM:', error);
      return null;
    }

    await registrarLog('CRM', `Lead de recuperación creado: ${lead.cliente_nombre} (Estilista: ${lead.agente_preferido_nombre})`, {
      cliente: lead.cliente_nombre,
      agente: lead.agente_preferido_nombre,
      motivo: lead.motivo_abandono
    });

    return data as CrmLead;
  } catch (err) {
    console.error('Fallo en crearLeadRecuperacion:', err);
    return null;
  }
}

export async function obtenerLeadsPorAgente(agenteId?: string, agenteNombre?: string): Promise<CrmLead[]> {
  const supabase = createClient();
  try {
    let query = supabase.from('crm_leads').select('*').order('created_at', { ascending: false });

    if (agenteId || agenteNombre) {
      query = query.or(`agente_preferido_id.eq.${agenteId},agente_preferido_nombre.ilike.%${agenteNombre}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CrmLead[];
  } catch (e) {
    console.warn('Error obteniendo leads de CRM:', e);
    return [];
  }
}
