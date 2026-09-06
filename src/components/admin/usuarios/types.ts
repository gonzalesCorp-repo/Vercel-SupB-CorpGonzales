import { Agente } from '@/services/recepcion';

export interface AgenteAdmin extends Agente {
  email?: string;
  password?: string;
  rol?: string;
  especialidad?: string;
  sedes_ids?: string[];
  herramientas_count?: number;
  regimen_laboral?: string;
  sueldo_base?: number | string;
  tipo_pension?: string;
  asignacion_familiar?: boolean;
  porcentaje_comision?: number | string;
  tarifa_hora?: number | string;
  frecuencia_corte?: string;
  dia_pago?: string;
}
