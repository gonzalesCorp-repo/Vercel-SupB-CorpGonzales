export type CanvasModo = 'PIPELINE_BIZAGI' | 'CATALOGO_OBSIDIAN' | 'HARDWARE_ARCHIFY';

export interface PosicionCanvas {
  x: number;
  y: number;
}

export interface NodoPipelineData {
  id: string;
  etapa: 'CHECKIN' | 'ASESORIA' | 'LAB_DESPACHO' | 'SILLA_SERVICIO' | 'BAR_LOUNGE' | 'CAJA_POS';
  nombre: string;
  subtitulo: string;
  icono: string;
  color: string;
  carril: 'FOH_ANFITRIONAJE' | 'BOH_LABORATORIO' | 'STAFF_TECNICO' | 'CAJA_ADMIN';
  activo: boolean;
  tiempoEstimadoMin: number;
  perfilResponsable: string;
  requiereHardware: string[];
  orden: number;
}

export interface NodoBienCanvasData {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto' | 'insumo';
  categoria: string;
  linea?: string;
  precio_venta: number;
  costo_base: number;
  comision_porcentaje: number;
  margen_bruto_porcentaje: number;
  receta_insumos: Array<{
    insumo_id: string;
    nombre: string;
    cantidad_gramos: number;
    costo_gramo: number;
  }>;
  duracion_minutos?: number;
  tara_gramos?: number;
  peso_neto_gramos?: number;
  color: string;
}

export interface AristaCanvas {
  id: string;
  from: string;
  to: string;
  label?: string;
  tipo: 'secuencia' | 'insumo_receta' | 'comanda' | 'hardware';
  animated?: boolean;
}

export interface MisionDidactica {
  id: string;
  titulo: string;
  objetivo: string;
  descripcion: string;
  completada: boolean;
  xp: number;
  requisitoValidacion: (estado: any) => boolean;
}
