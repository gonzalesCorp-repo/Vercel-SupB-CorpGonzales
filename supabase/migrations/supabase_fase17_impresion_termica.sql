-- ==============================================================================
-- FASE 17: MOTOR DE IMPRESIÓN TÉRMICA TRI-MODAL (ESC/POS & CLOUD REALTIME)
-- VAIKUNTHA ENTERPRISE ERP ENGINE
-- ==============================================================================

-- 1. Tabla de cola de trabajos de impresión en la nube
CREATE TABLE IF NOT EXISTS public.impresiones_cola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    tipo_ticket VARCHAR(100) NOT NULL,
    ip_destino VARCHAR(50) DEFAULT '192.168.1.200',
    puerto_destino INTEGER DEFAULT 9100,
    ancho VARCHAR(20) DEFAULT '58mm',
    payload_base64 TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'IMPRESO', 'FALLIDO')),
    error_mensaje TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de alta velocidad para consulta de cola por sede
CREATE INDEX IF NOT EXISTS idx_impresiones_sede_estado ON public.impresiones_cola(sede_id, estado, created_at DESC);

-- 3. Habilitar RLS en impresiones_cola
ALTER TABLE public.impresiones_cola ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de cola de impresion"
ON public.impresiones_cola FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Permitir insercion en cola de impresion"
ON public.impresiones_cola FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de estado en cola de impresion"
ON public.impresiones_cola FOR UPDATE
TO anon, authenticated
USING (true);
