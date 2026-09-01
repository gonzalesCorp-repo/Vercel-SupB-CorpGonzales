'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { liveFeedService } from '@/services/liveFeed';

export interface NfcPayloadParsed {
  raw: string;
  serialNumber?: string;
  tipo: 'SEDE' | 'ESTACION' | 'STAFF' | 'DESCONOCIDO';
  id?: string;
  nombre?: string;
  metodoMarcacion: 'WEB_NFC' | 'DIGITAL_1TAP';
}

interface UseNfcBackgroundListenerOptions {
  enabled?: boolean;
  onTagScanned?: (payload: NfcPayloadParsed) => void | Promise<void>;
}

export function useNfcBackgroundListener({
  enabled = true,
  onTagScanned
}: UseNfcBackgroundListenerOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastScannedTag, setLastScannedTag] = useState<NfcPayloadParsed | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastReadTimestampRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const tagHistoryRef = useRef<Map<string, number>>(new Map());
  const onTagScannedRef = useRef(onTagScanned);

  useEffect(() => {
    onTagScannedRef.current = onTagScanned;
  }, [onTagScanned]);

  const parseNfcRecord = useCallback((event: any): NfcPayloadParsed => {
    const serial = event.serialNumber || `TAG_${Date.now()}`;
    let rawText = '';

    if (event.message && event.message.records) {
      for (const record of event.message.records) {
        try {
          const textDecoder = new TextDecoder(record.encoding || 'utf-8');
          rawText = textDecoder.decode(record.data);
          if (rawText) break;
        } catch (e) {
          console.warn('Error decodificando registro NFC:', e);
        }
      }
    }

    const payloadRaw = rawText || serial;
    let parsed: NfcPayloadParsed = {
      raw: payloadRaw,
      serialNumber: serial,
      tipo: 'DESCONOCIDO',
      metodoMarcacion: 'WEB_NFC'
    };

    if (payloadRaw.startsWith('VKN:')) {
      const parts = payloadRaw.split(':');
      // Format: VKN:TIPO:ID:NOMBRE (e.g. VKN:SEDE:LIMA:Puerta_1 o VKN:ESTACION:SILLON_04:Estacion_Central)
      parsed.tipo = (parts[1]?.toUpperCase() as any) || 'DESCONOCIDO';
      parsed.id = parts[2] || serial;
      parsed.nombre = parts[3] ? parts[3].replace(/_/g, ' ').trim() : parts[2] || 'Punto de Control';
    } else if (payloadRaw.toLowerCase().includes('sillon') || payloadRaw.toLowerCase().includes('estacion')) {
      parsed.tipo = 'ESTACION';
      parsed.id = payloadRaw;
      parsed.nombre = payloadRaw;
    } else {
      parsed.tipo = 'SEDE';
      parsed.id = serial;
      parsed.nombre = 'Tag de Sede';
    }

    return parsed;
  }, []);

  const iniciarEscuchaNfc = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!('NDEFReader' in window)) {
      setIsSupported(false);
      setIsListening(false);
      return;
    }

    setIsSupported(true);

    // Cancelar sesión previa
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan({ signal: controller.signal });
      setIsListening(true);

      ndef.onreading = async (event: any) => {
        const ahora = Date.now();

        // 1. Candado de procesamiento activo (Mutex)
        if (isProcessingRef.current) {
          console.log('[useNfcBackgroundListener] Ignorando ráfaga: Escaneo ya en proceso.');
          return;
        }

        // 2. Cooldown anti-rebote global de 10 segundos
        if (ahora - lastReadTimestampRef.current < 10000) {
          console.log('[useNfcBackgroundListener] Ignorando ráfaga: Cooldown global activo.');
          return;
        }

        const parsed = parseNfcRecord(event);
        const tagKey = parsed.raw || parsed.id || parsed.serialNumber || 'default_tag';

        // 3. Cooldown por Tag específico (60 segundos para evitar doble marcación con el mismo tag)
        const lastScanForTag = tagHistoryRef.current.get(tagKey) || 0;
        if (ahora - lastScanForTag < 60000) {
          console.log(`[useNfcBackgroundListener] Ignorando tag ${tagKey}: Ya escaneado hace menos de 60s.`);
          return;
        }

        isProcessingRef.current = true;
        lastReadTimestampRef.current = ahora;
        tagHistoryRef.current.set(tagKey, ahora);

        // Feedback sensorial: Háptico + Chime
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([150, 80, 150]);
          }
          liveFeedService.reproducirChime('emerald');
        } catch (e) {}

        setLastScannedTag(parsed);

        try {
          if (onTagScannedRef.current) {
            await onTagScannedRef.current(parsed);
          }
        } catch (scanErr) {
          console.error('[useNfcBackgroundListener] Error procesando callback onTagScanned:', scanErr);
        } finally {
          // Desbloquear mutex tras 3 segundos adicionales de gracia
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 3000);
        }
      };

      ndef.onreadingerror = (error: any) => {
        console.warn('[useNfcBackgroundListener] Error de lectura NFC:', error);
      };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[useNfcBackgroundListener] No se pudo iniciar escáner NFC:', err);
      }
      setIsListening(false);
    }
  }, [parseNfcRecord]);

  useEffect(() => {
    if (enabled) {
      iniciarEscuchaNfc();
    } else {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {}
      }
      setIsListening(false);
    }

    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {}
      }
    };
  }, [enabled, iniciarEscuchaNfc]);

  return {
    isSupported,
    isListening,
    lastScannedTag,
    reiniciarEscucha: iniciarEscuchaNfc
  };
}
