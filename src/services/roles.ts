// ============================================================================
// roles.ts - Servicio de Gestión Dinámica de Roles
// Permite a ADMIN y SUPERADMIN administrar roles del sistema dinámicamente
// ============================================================================

import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';

const supabase = createClient();

export interface RolSistema {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  es_sistema: boolean;
  created_at: string;
}

export async function obtenerRolesSistema(): Promise<RolSistema[]> {
  try {
    const { data, error } = await supabase
      .from('config_roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback con roles base normalizados
      return [
        { id: '1', codigo: 'SUPERADMIN', nombre: 'Super Administrador', descripcion: 'Control total y debug', es_sistema: true, created_at: '' },
        { id: '2', codigo: 'ADMIN', nombre: 'Administrador de Sede', descripcion: 'Gestión y delegación', es_sistema: true, created_at: '' },
        { id: '3', codigo: 'JEFE_OPERACIONES', nombre: 'Jefe Operativo / Piso', descripcion: 'Supervisión de piso, SLA y reasignación', es_sistema: true, created_at: '' },
        { id: '4', codigo: 'SOPORTE', nombre: 'Personal de Soporte', descripcion: 'Acceso base + herramientas', es_sistema: true, created_at: '' },
        { id: '5', codigo: 'STAFF', nombre: 'Staff Operativo en Estación', descripcion: 'Atención física en estación', es_sistema: true, created_at: '' },
        { id: '6', codigo: 'KIOSKO', nombre: 'Tótem Kiosko Dedicado', descripcion: 'Terminal fija por sede', es_sistema: true, created_at: '' },
        { id: '7', codigo: 'CLIENTE', nombre: 'Cliente / Consumidor', descripcion: 'Autoservicio', es_sistema: true, created_at: '' }
      ];
    }

    return data;
  } catch {
    return [
      { id: '1', codigo: 'SUPERADMIN', nombre: 'Super Administrador', descripcion: 'Control total y debug', es_sistema: true, created_at: '' },
      { id: '2', codigo: 'ADMIN', nombre: 'Administrador de Sede', descripcion: 'Gestión y delegación', es_sistema: true, created_at: '' },
      { id: '3', codigo: 'JEFE_OPERACIONES', nombre: 'Jefe Operativo / Piso', descripcion: 'Supervisión de piso, SLA y reasignación', es_sistema: true, created_at: '' },
      { id: '4', codigo: 'SOPORTE', nombre: 'Personal de Soporte', descripcion: 'Acceso base + herramientas', es_sistema: true, created_at: '' },
      { id: '5', codigo: 'STAFF', nombre: 'Staff Operativo en Estación', descripcion: 'Atención física en estación', es_sistema: true, created_at: '' },
      { id: '6', codigo: 'KIOSKO', nombre: 'Tótem Kiosko Dedicado', descripcion: 'Terminal fija por sede', es_sistema: true, created_at: '' },
      { id: '7', codigo: 'CLIENTE', nombre: 'Cliente / Consumidor', descripcion: 'Autoservicio', es_sistema: true, created_at: '' }
    ];
  }
}

export async function crearRolPersonalizado(codigo: string, nombre: string, descripcion: string): Promise<boolean> {
  const codigoNormalizado = codigo.toUpperCase().trim();

  const { error } = await supabase
    .from('config_roles')
    .insert([
      {
        codigo: codigoNormalizado,
        nombre,
        descripcion,
        es_sistema: false
      }
    ]);

  if (error) {
    console.error('[Roles] Error creando rol:', error);
    return false;
  }

  await registrarLog('SISTEMA', `Creó rol personalizado ${codigoNormalizado}`, { nombre, descripcion });
  return true;
}
