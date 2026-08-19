'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ZonaProximidad,
  ConfiguracionProximidadSede,
  EventoProximidadPayload,
  calcularDistanciaHaversine,
  clasificarZonaProximidad,
  obtenerConfiguracionProximidadSede,
  emitirEventoProximidad
} from '@/services/proximidad';

interface UseClientProximityOptions {
  sedeId: string;
  clienteId?: string;
  clienteNombre: string;
  clienteDni?: string;
  citaId?: string;
  horaCita?: string;
  servicioNombre?: string;
  estilistaId?: string;
  estilistaNombre?: string;
  autoBroadcast?: boolean;
}

export function useClientProximity({
  sedeId,
  clienteId,
  clienteNombre,
  clienteDni,
  citaId,
  horaCita,
  servicioNombre,
  estilistaId,
  estilistaNombre,
  autoBroadcast = true
}: UseClientProximityOptions) {
  const [config, setConfig] = useState<ConfiguracionProximidadSede | null>(null);
  const [distanciaMetros, setDistanciaMetros] = useState<number | null>(null);
  const [zonaActual, setZonaActual] = useState<ZonaProximidad>('FUERA_DE_RANGO');
  const [geolocalizacionActiva, setGeolocalizacionActiva] = useState(false);
  const [errorGeo, setErrorGeo] = useState<string | null>(null);
  const [ultimaNotificacion, setUltimaNotificacion] = useState<string | null>(null);

  const prevZonaRef = useRef<ZonaProximidad>('FUERA_DE_RANGO');

  // 1. Cargar configuración de la sede
  useEffect(() => {
    if (!sedeId) return;
    obtenerConfiguracionProximidadSede(sedeId).then(cfg => {
      setConfig(cfg);
    });
  }, [sedeId]);

  // 2. Evaluar y emitir notificación cuando cambia de zona
  const procesarCambioZona = useCallback(
    async (nuevaDistancia: number, metodo: 'GPS_GEOFENCE' | 'BLE_BEACON' | 'CHECKIN_MANUAL' = 'GPS_GEOFENCE') => {
      if (!config) return;

      const nuevaZona = clasificarZonaProximidad(
        nuevaDistancia,
        config.radioCercanoMetros,
        config.radioPuertaMetros
      );

      setDistanciaMetros(nuevaDistancia);
      setZonaActual(nuevaZona);

      // Si cambió de zona significativa o se fuerza la notificación
      if (nuevaZona !== prevZonaRef.current && nuevaZona !== 'FUERA_DE_RANGO') {
        prevZonaRef.current = nuevaZona;

        if (autoBroadcast) {
          const payload: EventoProximidadPayload = {
            clienteId,
            clienteNombre,
            clienteDni,
            citaId,
            horaCita,
            servicioNombre,
            estilistaId,
            estilistaNombre,
            sedeId: config.sedeId,
            sedeNombre: config.nombre,
            distanciaMetros: nuevaDistancia,
            zona: nuevaZona,
            metodoDeteccion: metodo,
            timestamp: new Date().toISOString()
          };

          await emitirEventoProximidad(payload);
          setUltimaNotificacion(nuevaZona);
        }
      }
    },
    [
      config,
      autoBroadcast,
      clienteId,
      clienteNombre,
      clienteDni,
      citaId,
      horaCita,
      servicioNombre,
      estilistaId,
      estilistaNombre
    ]
  );

  // 3. Iniciar escucha de Geolocation nativa del navegador
  const iniciarTrackingGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation || !config) {
      setErrorGeo('Geolocalización no disponible en este dispositivo');
      return;
    }

    setGeolocalizacionActiva(true);
    setErrorGeo(null);

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const dist = calcularDistanciaHaversine(
          latitude,
          longitude,
          config.latitud,
          config.longitud
        );
        procesarCambioZona(dist, 'GPS_GEOFENCE');
      },
      err => {
        console.warn('[useClientProximity] Error en GPS:', err.message);
        setErrorGeo(err.message);
        setGeolocalizacionActiva(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setGeolocalizacionActiva(false);
    };
  }, [config, procesarCambioZona]);

  // 4. Simulador de distancias para demostraciones Sandbox
  const simularDistancia = useCallback(
    (metros: number, metodo: 'GPS_GEOFENCE' | 'BLE_BEACON' | 'CHECKIN_MANUAL' = 'GPS_GEOFENCE') => {
      procesarCambioZona(metros, metodo);
    },
    [procesarCambioZona]
  );

  return {
    config,
    distanciaMetros,
    zonaActual,
    geolocalizacionActiva,
    errorGeo,
    ultimaNotificacion,
    iniciarTrackingGps,
    simularDistancia
  };
}
