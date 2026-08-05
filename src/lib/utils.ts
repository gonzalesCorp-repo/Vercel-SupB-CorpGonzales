import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateEstado(estado?: string): string {
  if (!estado) return 'Desconocido';
  const translations: Record<string, string> = {
    'EN_CURSO': 'En Curso',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado',
    'SOL_CANCELACION': 'Sol. Cancelación',
    'PENDIENTE': 'Pendiente',
    'PRE_COBRADO': 'Pre-Cobrado',
    'POR_COBRAR': 'Por Cobrar',
    'ASESORANDO': 'Asesorando',
    'ASESORIA': 'Asesoría',
    'PENDIENTE_INICIO': 'Pendiente Inicio',
    'PENDIENTE_PRE_COBRO': 'Pendiente Pre-Cobro',
    'SOLICITUD_ADICIONAL': 'Servicios Adicionales',
    'DISPONIBLE': 'Disponible',
    'OCUPADO': 'Ocupado'
  };
  return translations[estado.toUpperCase()] || estado;
}
