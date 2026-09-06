import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fábrica de herramientas operativas (Tool Calling) para V.AI Copilot
 * Todas las consultas se ejecutan con la instancia de Supabase del usuario autenticado,
 * heredando automáticamente las políticas de Row-Level Security (RLS).
 */
export function createCopilotTools(supabase: SupabaseClient, sedeId?: string) {
  return {
    consultarStockLaboratorio: tool({
      description:
        'Consulta las existencias y stock de insumos técnicos de laboratorio (tintes, oxidantes, decolorantes, tratamientos capilares) o productos en almacén.',
      inputSchema: z.object({
        busqueda: z
          .string()
          .optional()
          .describe('Término de búsqueda opcional (ej: "tinte 7.1", "oxigenta 20v", "decolorante")'),
        categoria: z
          .string()
          .optional()
          .describe('Categoría opcional del insumo (ej: "Tinte", "Oxigenta", "Tratamiento")'),
      }),
      execute: async ({ busqueda, categoria }: { busqueda?: string; categoria?: string }) => {
        try {
          let query = supabase
            .from('bienes')
            .select('id, nombre, categoria, tipo_bien, sku')
            .limit(15);

          if (busqueda) {
            query = query.ilike('nombre', `%${busqueda}%`);
          }
          if (categoria) {
            query = query.ilike('categoria', `%${categoria}%`);
          }

          const { data: bienes, error: bienesErr } = await query;

          if (bienesErr) {
            return { error: `No se pudo consultar el stock: ${bienesErr.message}` };
          }

          if (!bienes || bienes.length === 0) {
            return {
              resultado: 'No se encontraron insumos que coincidan con los criterios de búsqueda.',
              items: [],
            };
          }

          // Consultar stock en almacen_principal si está disponible
          const bienIds = bienes.map((b) => b.id);
          const { data: stockItems } = await supabase
            .from('almacen_principal')
            .select('bien_id, stock, stock_minimo, marca, presentacion')
            .in('bien_id', bienIds);

          const stockMap = new Map((stockItems || []).map((s) => [s.bien_id, s]));

          const reporte = bienes.map((b) => {
            const stockInfo = stockMap.get(b.id);
            return {
              id: b.id,
              nombre: b.nombre,
              categoria: b.categoria,
              tipo: b.tipo_bien,
              stock_actual: stockInfo?.stock ?? 'Consultar en laboratorio',
              stock_minimo: stockInfo?.stock_minimo ?? 0,
              marca: stockInfo?.marca ?? 'General',
              presentacion: stockInfo?.presentacion ?? 'Unidad',
            };
          });

          return {
            total_encontrados: reporte.length,
            insumos: reporte,
          };
        } catch (err: any) {
          return { error: `Excepción consultando insumos: ${err.message}` };
        }
      },
    }),

    consultarOATCActivas: tool({
      description:
        'Consulta las Órdenes de Atención Técnica y Comercial (OATC) activas en el salón y su estado en piso.',
      inputSchema: z.object({
        estado: z
          .enum(['TODAS', 'EN_ESPERA', 'ASESORIA', 'EN_PROCESO', 'FINALIZADO'])
          .default('TODAS')
          .describe('Filtrar por estado específico de atención'),
      }),
      execute: async ({ estado }: { estado: 'TODAS' | 'EN_ESPERA' | 'ASESORIA' | 'EN_PROCESO' | 'FINALIZADO' }) => {
        try {
          let query = supabase
            .from('oatc')
            .select('id, cliente_nombre, estado, total, created_at, sede_id')
            .order('created_at', { ascending: false })
            .limit(10);

          if (sedeId) {
            query = query.eq('sede_id', sedeId);
          }

          if (estado !== 'TODAS') {
            query = query.eq('estado', estado);
          } else {
            query = query.in('estado', ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO']);
          }

          const { data: ordenes, error } = await query;

          if (error) {
            return { error: `Error consultando OATCs: ${error.message}` };
          }

          if (!ordenes || ordenes.length === 0) {
            return {
              resultado: 'No hay órdenes de atención activas en este momento para la sede seleccionada.',
              ordenes: [],
            };
          }

          return {
            total_activas: ordenes.length,
            ordenes: ordenes.map((o) => ({
              id: o.id,
              cliente: o.cliente_nombre,
              estado: o.estado,
              monto_acumulado: o.total,
              hora: o.created_at,
            })),
          };
        } catch (err: any) {
          return { error: `Excepción consultando OATCs: ${err.message}` };
        }
      },
    }),

    buscarClienteCRM: tool({
      description:
        'Busca en el CRM un cliente por nombre, apellido, DNI o número de teléfono celular para revisar sus datos de contacto y notas técnicas.',
      inputSchema: z.object({
        termino: z
          .string()
          .describe('Nombre, DNI o celular a buscar en el CRM'),
      }),
      execute: async ({ termino }: { termino: string }) => {
        try {
          const cleanTerm = termino.trim();
          const { data: clientes, error } = await supabase
            .from('clientes')
            .select('id, nombre, apellidos, dni, celular, email, notas, saldo_credito')
            .or(`nombre.ilike.%${cleanTerm}%,apellidos.ilike.%${cleanTerm}%,dni.ilike.%${cleanTerm}%,celular.ilike.%${cleanTerm}%`)
            .limit(5);

          if (error) {
            return { error: `Error buscando cliente: ${error.message}` };
          }

          if (!clientes || clientes.length === 0) {
            return {
              resultado: `No se encontraron clientes que coincidan con "${cleanTerm}".`,
              clientes: [],
            };
          }

          return {
            total: clientes.length,
            clientes: clientes.map((c) => ({
              id: c.id,
              nombre_completo: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
              dni: c.dni || 'No registrado',
              celular: c.celular || 'No registrado',
              notas_tecnicas: c.notas || 'Sin notas técnicas',
              saldo_credito: c.saldo_credito ?? 0,
            })),
          };
        } catch (err: any) {
          return { error: `Excepción en CRM: ${err.message}` };
        }
      },
    }),

    consultarTurnosAsistencia: tool({
      description:
        'Consulta el personal de la sede, su rol asignado y su estado operativo en vivo (DISPONIBLE, ATENDIENDO, EN_REFRIGERIO, etc.).',
      inputSchema: z.object({
        rol: z
          .string()
          .optional()
          .describe('Filtrar por rol de colaborador (ej: "ESTILISTA", "COLORISTA", "RECEPCION", "ASISTENTE")'),
      }),
      execute: async ({ rol }: { rol?: string }) => {
        try {
          let query = supabase
            .from('agentes')
            .select('id, nombre, rol, estado_operativo, sede_id')
            .order('nombre');

          if (sedeId) {
            query = query.eq('sede_id', sedeId);
          }
          if (rol) {
            query = query.ilike('rol', `%${rol}%`);
          }

          const { data: agentes, error } = await query;

          if (error) {
            return { error: `Error consultando colaboradores: ${error.message}` };
          }

          if (!agentes || agentes.length === 0) {
            return {
              resultado: 'No se encontraron colaboradores registrados para esta sede.',
              colaboradores: [],
            };
          }

          return {
            total_colaboradores: agentes.length,
            colaboradores: agentes.map((a) => ({
              id: a.id,
              nombre: a.nombre,
              rol: a.rol,
              estado_operativo: a.estado_operativo || 'DISPONIBLE',
            })),
          };
        } catch (err: any) {
          return { error: `Excepción consultando asistencia: ${err.message}` };
        }
      },
    }),
  };
}
