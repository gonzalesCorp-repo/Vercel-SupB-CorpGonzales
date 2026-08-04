import { OATC } from '@/services/recepcion';

export interface OatcCaja extends OATC {
  total_calculado?: number;
}

export interface PagoMixto {
  metodo: string;
  monto: number;
}

export interface Emisor {
  id: string;
  razon_social: string;
  ruc: string;
}

export interface SerieComprobante {
  id: string;
  emisor_id: string;
  tipo_comprobante: string;
  serie: string;
  correlativo_actual: number;
}
