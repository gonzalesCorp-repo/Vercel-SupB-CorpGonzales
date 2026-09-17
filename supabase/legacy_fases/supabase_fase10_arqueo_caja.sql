-- FASE 10: ARQUEO DE CAJA
-- Este script crea la tabla para gestionar las sesiones de caja (turnos) de los agentes.

CREATE TABLE IF NOT EXISTS public.caja_sesiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    cajero_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    fondo_inicial NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    efectivo_sistema NUMERIC(10,2) DEFAULT 0,
    efectivo_real NUMERIC(10,2) DEFAULT 0,
    descuadre NUMERIC(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA'))
);

-- Modificamos la tabla de pagos para vincular los pagos a una sesión de caja específica
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS caja_sesion_id UUID REFERENCES public.caja_sesiones(id) ON DELETE SET NULL;

ALTER TABLE public.caja_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sesiones visibles por todos" ON public.caja_sesiones FOR SELECT USING (true);
CREATE POLICY "Cajeros pueden gestionar sus sesiones" ON public.caja_sesiones FOR ALL USING (true);
