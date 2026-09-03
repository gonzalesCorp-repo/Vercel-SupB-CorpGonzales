import { createClient } from '@/lib/supabase/client';

export interface Cliente {
  id?: string;
  nombre: string;
  dni?: string;
  celular?: string;
  email?: string;
  saldo_credito?: number;
  limite_credito?: number;
  notas?: string;
  created_at?: string;
  sede_id?: string | null;
  agente_id?: string | null;
  sedes?: { nombre: string } | null;
  agentes?: { nombre: string } | null;
}

const supabase = createClient();

export async function buscarClientes(query: string, agenteId?: string | null): Promise<Cliente[]> {
  let q = supabase
    .from('clientes')
    .select('*, sedes(nombre), agentes(nombre)')
    .or(`nombre.ilike.%${query}%,dni.ilike.%${query}%,celular.ilike.%${query}%`);

  if (agenteId) {
    q = q.eq('agente_id', agenteId);
  }

  const { data, error } = await q.limit(20);

  if (error) {
    console.error("Error buscando clientes:", error);
    return [];
  }
  return data as Cliente[];
}

export async function crearCliente(cliente: Cliente): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .insert([
      {
        nombre: cliente.nombre,
        dni: cliente.dni || null,
        celular: cliente.celular || null,
        email: cliente.email || null,
        saldo_credito: cliente.saldo_credito !== undefined ? Number(cliente.saldo_credito) : 0.00,
        limite_credito: cliente.limite_credito !== undefined ? Number(cliente.limite_credito) : 500.00,
        notas: cliente.notas || null,
        sede_id: cliente.sede_id || null,
        agente_id: cliente.agente_id || null
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creando cliente:", error);
    return null;
  }
  
  return data as Cliente;
}

export async function actualizarCliente(id: string, campos: Partial<Cliente>): Promise<Cliente | null> {
  const payload: Record<string, any> = {};
  if (campos.nombre !== undefined) payload.nombre = campos.nombre;
  if (campos.dni !== undefined) payload.dni = campos.dni;
  if (campos.celular !== undefined) payload.celular = campos.celular;
  if (campos.email !== undefined) payload.email = campos.email;
  if (campos.saldo_credito !== undefined) payload.saldo_credito = Number(campos.saldo_credito);
  if (campos.limite_credito !== undefined) payload.limite_credito = Number(campos.limite_credito);
  if (campos.notas !== undefined) payload.notas = campos.notas;
  if (campos.sede_id !== undefined) payload.sede_id = campos.sede_id;
  if (campos.agente_id !== undefined) payload.agente_id = campos.agente_id;

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando cliente:", error);
    return null;
  }

  return data as Cliente;
}

export async function obtenerTodosLosClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, sedes(nombre), agentes(nombre)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo clientes:", error);
    return [];
  }
  return data as Cliente[];
}

export interface ClienteVipPerfil {
  cliente: Cliente;
  puntosVaikuntha: number;
  visitasTotales: number;
  totalGastado: number;
  oatcActiva?: any | null;
  posicionCola?: number | null;
  historialVisitas: any[];
}

export async function obtenerPerfilCompletoCliente(term: string): Promise<ClienteVipPerfil | null> {
  const supabase = createClient();
  const trimmed = term.trim();
  if (!trimmed) return null;

  try {
    // 1. Buscar cliente por DNI, Celular o Nombre
    const { data: clientes, error: errCliente } = await supabase
      .from('clientes')
      .select('*')
      .or(`dni.eq.${trimmed},celular.eq.${trimmed},nombre.ilike.%${trimmed}%`)
      .limit(1);

    if (errCliente || !clientes || clientes.length === 0) {
      return null;
    }

    const cliente = clientes[0];

    // 2. Consultar historial de OATCs del cliente
    const { data: historialOatc, error: errOatc } = await supabase
      .from('oatc')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false });

    if (errOatc) {
      console.error('[clientes] Error consultando OATCs:', errOatc);
    }

    const oatcs = historialOatc || [];
    
    // OATC activa en sala hoy
    const oatcActiva = (oatcs as any[]).find((o: any) => 
      ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO', 'POR_COBRAR', 'PRE_COBRADO'].includes(o.estado_proceso)
    ) || null;

    // Historial pasado finalizado
    const historialVisitas = (oatcs as any[]).filter((o: any) => o.estado_proceso === 'FINALIZADO' || o.estado_pago === 'Pagado');

    // Calcular gasto total y Vaikuntha Points
    let totalGastado = 0;
    historialVisitas.forEach((o: any) => {
      if (o.punto_partida && Array.isArray(o.punto_partida)) {
        o.punto_partida.forEach((p: any) => {
          totalGastado += Number(p.precio || 0);
        });
      }
    });

    // Puntos Vaikuntha = 100 de bienvenida + 1 punto por cada sol gastado
    const puntosVaikuntha = 100 + Math.round(totalGastado);
    const visitasTotales = Math.max(1, historialVisitas.length);

    // Calcular posición en sala de espera si está en espera
    let posicionCola = null;
    if (oatcActiva && oatcActiva.estado_proceso === 'EN_ESPERA') {
      const { count } = await supabase
        .from('oatc')
        .select('*', { count: 'exact', head: true })
        .eq('estado_proceso', 'EN_ESPERA')
        .lte('created_at', oatcActiva.created_at);

      posicionCola = count || 1;
    }

    return {
      cliente,
      puntosVaikuntha,
      visitasTotales,
      totalGastado,
      oatcActiva,
      posicionCola,
      historialVisitas
    };

  } catch (err) {
    console.error('Error en obtenerPerfilCompletoCliente:', err);
    return null;
  }
}
