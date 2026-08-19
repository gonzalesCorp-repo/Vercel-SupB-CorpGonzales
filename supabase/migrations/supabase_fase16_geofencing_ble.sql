-- ==============================================================================
-- FASE 16: DETECCIÓN DE PROXIMIDAD BIDIRECCIONAL (GEOFENCING GPS + BLE BEACONS)
-- VAIKUNTHA ENTERPRISE ERP ENGINE
-- ==============================================================================

-- 1. Asegurar columnas de Geofencing y Beacons en la tabla sedes
ALTER TABLE public.sedes
ADD COLUMN IF NOT EXISTS latitud NUMERIC(10, 7) DEFAULT -12.096528,
ADD COLUMN IF NOT EXISTS longitud NUMERIC(10, 7) DEFAULT -77.035417,
ADD COLUMN IF NOT EXISTS radio_geofence_metros INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS radio_cercano_metros INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS radio_puerta_metros INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS beacon_uuid VARCHAR(100) DEFAULT 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
ADD COLUMN IF NOT EXISTS beacon_major INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS beacon_minor INTEGER DEFAULT 101;

-- 2. Tabla de auditoría y telemetría de eventos de proximidad
CREATE TABLE IF NOT EXISTS public.proximidad_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(255) NOT NULL,
    cita_id UUID REFERENCES public.citas(id) ON DELETE SET NULL,
    estilista_id UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
    estilista_nombre VARCHAR(255),
    distancia_metros NUMERIC(8, 2) NOT NULL,
    zona VARCHAR(50) NOT NULL CHECK (zona IN ('EN_CAMINO', 'CERCANO', 'EN_PUERTA', 'FUERA_DE_RANGO')),
    metodo_deteccion VARCHAR(50) NOT NULL CHECK (metodo_deteccion IN ('GPS_GEOFENCE', 'BLE_BEACON', 'CHECKIN_MANUAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices de alta velocidad para reporting y consultas espaciales
CREATE INDEX IF NOT EXISTS idx_proximidad_sede_created ON public.proximidad_logs(sede_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proximidad_cliente ON public.proximidad_logs(cliente_id);

-- 4. Habilitar RLS en proximidad_logs
ALTER TABLE public.proximidad_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de logs de proximidad a usuarios autenticados"
ON public.proximidad_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir insercion de logs de proximidad"
ON public.proximidad_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);
