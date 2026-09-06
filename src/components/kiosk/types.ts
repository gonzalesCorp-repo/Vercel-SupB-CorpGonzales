import { ClienteVipPerfil } from '@/services/clientes';
import { TipoMovimientoAsistencia } from '@/services/asistencias';

export type KioskModo = 'HOME' | 'CLIENTE' | 'STAFF';
export type KioskStaffTab = 'oatc' | 'lab' | 'bar' | 'turno';

export interface ColaboradorKiosk {
  id: string;
  nombre: string;
  rol: string;
  especialidad?: string;
  estado: string; // 'ACTIVO' | 'INACTIVO'
  estado_operativo?: string; // 'DISPONIBLE' | 'OCUPADO' | 'EN_REFRIGERIO' | 'FUERA_DE_TURNO'
  pin?: string;
  email?: string;
  ultimo_cambio_estado?: string;
}

export interface KioskConciergeInput {
  cliente_id?: string;
  nombre_cliente?: string;
  hora_ingreso: string;
  puntos_actuales?: number;
  nivel_vip?: string;
  estilistas_disponibles?: Array<{
    agente_id: string;
    nombre: string;
    especialidad?: string;
    estado_operativo: string;
  }>;
}

export interface KioskConciergeOutput {
  saludo_personalizado: string;
  bebida_sugerida: {
    nombre: string;
    temperatura: 'FRIA' | 'CALIENTE';
    descripcion: string;
  };
  servicios_sugeridos: Array<{
    nombre: string;
    tiempo_estimado_minutos: number;
    motivo: string;
  }>;
  tiempo_espera_estimado_minutos: number;
}
