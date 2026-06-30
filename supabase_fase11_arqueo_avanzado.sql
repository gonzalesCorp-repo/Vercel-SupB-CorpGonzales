-- FASE 11: ARQUEO AVANZADO Y MOVIMIENTOS MANUALES

CREATE TABLE IF NOT EXISTS public.caja_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_sesion_id UUID REFERENCES public.caja_sesiones(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO', 'ADELANTO')),
    monto NUMERIC(10,2) NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.caja_movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movimientos visibles por todos" ON public.caja_movimientos FOR SELECT USING (true);
CREATE POLICY "Cajeros pueden gestionar movimientos" ON public.caja_movimientos FOR ALL USING (true);
