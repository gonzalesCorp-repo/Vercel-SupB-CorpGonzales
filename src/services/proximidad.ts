import { createClient } from '@/lib/supabase/client';

export type ZonaProximidad = 'EN_CAMINO' | 'CERCANO' | 'EN_PUERTA' | 'FUERA_DE_RANGO';

export interface EventoProximidadPayload {
  clienteId?: string;
  clienteNombre: string;
  clienteDni?: string;
  clienteFoto?: string;
  citaId?: string;
  horaCita?: string;
  servicioNombre?: string;
  estilistaId?: string;
  estilistaNombre?: string;
  sedeId: string;
  sedeNombre?: string;
  distanciaMetros: number;
  zona: ZonaProximidad;
  metodoDeteccion: 'GPS_GEOFENCE' | 'BLE_BEACON' | 'CHECKIN_MANUAL';
  timestamp: string;
}

export interface ConfiguracionProximidadSede {
  sedeId: string;
  nombre: string;
  latitud: number;
  longitud: number;
  radioGeofenceMetros: number;
  radioCercanoMetros: number;
  radioPuertaMetros: number;
  beaconUuid?: string;
  beaconMajor?: number;
  beaconMinor?: number;
}

// Coordenadas predeterminadas por sede (Sandbox demo para San Isidro y Miraflores)
export const SEDES_COORDINATES_DEFAULT: Record<string, { lat: number; lng: number; nombre: string }> = {
  'd954b259-69a0-4546-9156-2f6ad392853f': {
    lat: -12.096528,
    lng: -77.035417,
    nombre: 'Sede San Isidro (Principal)'
  },
  'sede-miraflores': {
    lat: -12.121944,
    lng: -77.029722,
    nombre: 'Sede Miraflores'
  }
};

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas utilizando la fórmula de Haversine
 */
export function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distancia redondeada en metros
}

/**
 * Determina la zona de proximidad según la distancia calculada en metros
 */
export function clasificarZonaProximidad(
  distanciaMetros: number,
  radioCercano: number = 300,
  radioPuerta: number = 25
): ZonaProximidad {
  if (distanciaMetros <= radioPuerta) return 'EN_PUERTA';
  if (distanciaMetros <= radioCercano) return 'CERCANO';
  if (distanciaMetros <= 1500) return 'EN_CAMINO';
  return 'FUERA_DE_RANGO';
}

/**
 * Obtiene la configuración de geofencing de una sede
 */
export async function obtenerConfiguracionProximidadSede(
  sedeId: string
): Promise<ConfiguracionProximidadSede> {
  const fallback = SEDES_COORDINATES_DEFAULT[sedeId] || {
    lat: -12.096528,
    lng: -77.035417,
    nombre: 'Sede Principal'
  };

  try {
    const supabase = createClient();
    const { data: sede, error } = await supabase
      .from('sedes')
      .select('id, nombre, atributos')
      .eq('id', sedeId)
      .maybeSingle();

    if (error || !sede) {
      return {
        sedeId,
        nombre: fallback.nombre,
        latitud: fallback.lat,
        longitud: fallback.lng,
        radioGeofenceMetros: 500,
        radioCercanoMetros: 300,
        radioPuertaMetros: 25,
        beaconUuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
        beaconMajor: 1,
        beaconMinor: 101
      };
    }

    const attrs = sede.atributos || {};
    return {
      sedeId: sede.id,
      nombre: sede.nombre || fallback.nombre,
      latitud: Number(attrs.latitud || fallback.lat),
      longitud: Number(attrs.longitud || fallback.lng),
      radioGeofenceMetros: Number(attrs.radio_geofence_metros || 500),
      radioCercanoMetros: Number(attrs.radio_cercano_metros || 300),
      radioPuertaMetros: Number(attrs.radio_puerta_metros || 25),
      beaconUuid: attrs.beacon_uuid || 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
      beaconMajor: attrs.beacon_major || 1,
      beaconMinor: attrs.beacon_minor || 101
    };
  } catch (err) {
    console.warn('[obtenerConfiguracionProximidadSede] Fallback aplicado:', err);
    return {
      sedeId,
      nombre: fallback.nombre,
      latitud: fallback.lat,
      longitud: fallback.lng,
      radioGeofenceMetros: 500,
      radioCercanoMetros: 300,
      radioPuertaMetros: 25
    };
  }
}

/**
 * Notifica en tiempo real a Recepción y Staff la proximidad del cliente vía WebSockets (Supabase Realtime Broadcast)
 */
export async function emitirEventoProximidad(
  payload: EventoProximidadPayload
): Promise<boolean> {
  try {
    const supabase = createClient();
    const channelName = `realtime-proximidad-${payload.sedeId}`;
    const channel = supabase.channel(channelName);

    await channel.send({
      type: 'broadcast',
      event: 'CLIENTE_PROXIMIDAD',
      payload
    });

    return true;
  } catch (err) {
    console.error('[emitirEventoProximidad] Error enviando broadcast:', err);
    return false;
  }
}
