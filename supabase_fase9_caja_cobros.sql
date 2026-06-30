-- FASE 9: CAJA, COBROS Y FACTURACIÓN PERÚ
-- Este script crea la arquitectura para soportar múltiples emisores por sede, comprobantes y pagos mixtos.

-- 1. EMISORES
CREATE TABLE IF NOT EXISTS public.emisores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    ruc VARCHAR(11) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.emisores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emisores visibles por todos" ON public.emisores FOR SELECT USING (true);
CREATE POLICY "Emisores modificables por admin" ON public.emisores FOR ALL USING (true);

-- 2. SERIES DE COMPROBANTES
CREATE TABLE IF NOT EXISTS public.emisores_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emisor_id UUID REFERENCES public.emisores(id) ON DELETE CASCADE,
    tipo_comprobante VARCHAR(20) NOT NULL CHECK (tipo_comprobante IN ('BOLETA', 'FACTURA', 'TICKET')),
    serie VARCHAR(4) NOT NULL,
    correlativo_actual INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(emisor_id, tipo_comprobante, serie)
);

ALTER TABLE public.emisores_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Series visibles por todos" ON public.emisores_series FOR SELECT USING (true);
CREATE POLICY "Series actualizables por cajeros" ON public.emisores_series FOR UPDATE USING (true);
CREATE POLICY "Series modificables por admin" ON public.emisores_series FOR ALL USING (true);

-- 3. COMPROBANTES (El documento físico/electrónico final)
CREATE TABLE IF NOT EXISTS public.comprobantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oatc_id UUID REFERENCES public.oatc(id) ON DELETE RESTRICT,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE RESTRICT,
    cajero_id UUID REFERENCES public.agentes(id) ON DELETE RESTRICT,
    emisor_id UUID REFERENCES public.emisores(id) ON DELETE RESTRICT,
    tipo_comprobante VARCHAR(20) NOT NULL,
    serie VARCHAR(4) NOT NULL,
    correlativo INTEGER NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    igv NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha_emision TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'EMITIDO' CHECK (estado IN ('EMITIDO', 'ANULADO')),
    UNIQUE(emisor_id, tipo_comprobante, serie, correlativo)
);

ALTER TABLE public.comprobantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comprobantes visibles por todos" ON public.comprobantes FOR SELECT USING (true);
CREATE POLICY "Cajeros pueden insertar comprobantes" ON public.comprobantes FOR INSERT WITH CHECK (true);

-- 4. PAGOS (Cómo se pagó el comprobante / la orden)
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID REFERENCES public.comprobantes(id) ON DELETE CASCADE,
    oatc_id UUID REFERENCES public.oatc(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE RESTRICT,
    metodo_pago VARCHAR(50) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pagos visibles por todos" ON public.pagos FOR SELECT USING (true);
CREATE POLICY "Cajeros pueden insertar pagos" ON public.pagos FOR INSERT WITH CHECK (true);

-- 5. DATOS DE PRUEBA (MOCK DATA)
-- Inyectamos Vaikunta SAC y Vaikunta Distribuciones a la primera sede que encontremos
DO $$
DECLARE
    v_sede_id UUID;
    v_emisor1_id UUID;
    v_emisor2_id UUID;
BEGIN
    SELECT id INTO v_sede_id FROM public.sedes LIMIT 1;
    
    IF v_sede_id IS NOT NULL THEN
        -- Emisor 1
        INSERT INTO public.emisores (sede_id, ruc, razon_social, nombre_comercial)
        VALUES (v_sede_id, '20123456789', 'VAIKUNTA SAC', 'Vaikuntha ERP')
        RETURNING id INTO v_emisor1_id;

        -- Series Emisor 1
        INSERT INTO public.emisores_series (emisor_id, tipo_comprobante, serie, correlativo_actual) VALUES
        (v_emisor1_id, 'BOLETA', 'B001', 100),
        (v_emisor1_id, 'FACTURA', 'F001', 50),
        (v_emisor1_id, 'TICKET', 'T001', 500);

        -- Emisor 2
        INSERT INTO public.emisores (sede_id, ruc, razon_social, nombre_comercial)
        VALUES (v_sede_id, '20987654321', 'DISTRIBUIDORA VAIKUNTA EIRL', 'Vaikuntha Distribuciones')
        RETURNING id INTO v_emisor2_id;

        -- Series Emisor 2
        INSERT INTO public.emisores_series (emisor_id, tipo_comprobante, serie, correlativo_actual) VALUES
        (v_emisor2_id, 'BOLETA', 'B002', 15),
        (v_emisor2_id, 'FACTURA', 'F002', 5);
    END IF;
END $$;
