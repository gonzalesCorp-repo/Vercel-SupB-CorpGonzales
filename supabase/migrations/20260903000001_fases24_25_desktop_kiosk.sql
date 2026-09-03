-- ============================================================================
-- MIGRACIÓN CONSOLIDADA FASES 24 Y 25: PASARELAS POS Y FACTURAS DE COMPRAS
-- Vaikuntha ERP / Gloss Salón and Relax
-- ============================================================================

-- 1. TABLA: config_pasarelas_pago
CREATE TABLE IF NOT EXISTS public.config_pasarelas_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    nombre_proveedor TEXT NOT NULL, -- 'IZIPAY', 'NIUBIZ', 'CULQI', 'POS_FISICO'
    tipo_pasarela TEXT NOT NULL DEFAULT 'POS_FISICO', -- 'POS_FISICO', 'LINK_PAGO', 'GATEWAY_WEB'
    comision_tarjeta_debito NUMERIC(5,2) DEFAULT 2.50,
    comision_tarjeta_credito NUMERIC(5,2) DEFAULT 3.80,
    comision_fija_transaccion NUMERIC(5,2) DEFAULT 0.00,
    dias_deposito_banco INTEGER DEFAULT 1, -- D+1, D+2
    cuenta_financiera_destino_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA: liquidaciones_pasarelas_pos (Lotes de cierre)
CREATE TABLE IF NOT EXISTS public.liquidaciones_pasarelas_pos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    pasarela_id UUID REFERENCES public.config_pasarelas_pago(id) ON DELETE SET NULL,
    numero_lote TEXT NOT NULL,
    fecha_cierre_lote DATE NOT NULL DEFAULT CURRENT_DATE,
    total_bruto_pos NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_comisiones NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_neto_esperado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monto_abonado_banco NUMERIC(12,2) DEFAULT 0.00,
    cuenta_financiera_abono_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
    estado_conciliacion TEXT NOT NULL DEFAULT 'PENDIENTE_ABONO', -- 'PENDIENTE_ABONO', 'CONCILIADO', 'DISCREPANCIA'
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA: facturas_compras (Cuentas por Pagar a Proveedores)
CREATE TABLE IF NOT EXISTS public.facturas_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    proveedor_ruc TEXT NOT NULL,
    proveedor_razon_social TEXT NOT NULL,
    tipo_comprobante TEXT NOT NULL DEFAULT 'FACTURA', -- 'FACTURA', 'BOLETA', 'RECIBO_HONORARIOS'
    serie TEXT NOT NULL,
    numero TEXT NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    condicion_pago TEXT NOT NULL DEFAULT 'CONTADO', -- 'CONTADO', 'CREDITO_15D', 'CREDITO_30D', 'CREDITO_45D', 'CREDITO_60D'
    fecha_vencimiento DATE NOT NULL DEFAULT CURRENT_DATE,
    moneda TEXT NOT NULL DEFAULT 'PEN',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igv NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    saldo_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    estado_pago TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PARCIAL', 'PAGADO', 'ANULADO'
    categoria_gasto TEXT NOT NULL DEFAULT 'PAGO_PROVEEDOR', -- 'PAGO_PROVEEDOR', 'INSUMOS_LAB', 'SERVICIOS_BASICOS', 'ALQUILER', 'OTRO'
    registrado_por TEXT,
    cuenta_pago_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_facturas_compras_prov_doc UNIQUE (proveedor_ruc, tipo_comprobante, serie, numero)
);

-- 4. TABLA: cuotas_facturas_compras
CREATE TABLE IF NOT EXISTS public.cuotas_facturas_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_compra_id UUID NOT NULL REFERENCES public.facturas_compras(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL DEFAULT 1,
    fecha_vencimiento DATE NOT NULL,
    monto_cuota NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monto_pagado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    estado_cuota TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PARCIAL', 'PAGADA'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_config_pasarelas_sede ON public.config_pasarelas_pago(sede_id);
CREATE INDEX IF NOT EXISTS idx_liq_pasarelas_sede ON public.liquidaciones_pasarelas_pos(sede_id, fecha_cierre_lote);
CREATE INDEX IF NOT EXISTS idx_facturas_compras_sede_venc ON public.facturas_compras(sede_id, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_facturas_compras_estado ON public.facturas_compras(estado_pago);
CREATE INDEX IF NOT EXISTS idx_cuotas_factura ON public.cuotas_facturas_compras(factura_compra_id);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.config_pasarelas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones_pasarelas_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_facturas_compras ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permisivas para colaboradores y administradores de la sede
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Permitir select config_pasarelas_pago" ON public.config_pasarelas_pago;
    CREATE POLICY "Permitir select config_pasarelas_pago" ON public.config_pasarelas_pago FOR ALL USING (true);

    DROP POLICY IF EXISTS "Permitir all liquidaciones_pasarelas_pos" ON public.liquidaciones_pasarelas_pos;
    CREATE POLICY "Permitir all liquidaciones_pasarelas_pos" ON public.liquidaciones_pasarelas_pos FOR ALL USING (true);

    DROP POLICY IF EXISTS "Permitir all facturas_compras" ON public.facturas_compras;
    CREATE POLICY "Permitir all facturas_compras" ON public.facturas_compras FOR ALL USING (true);

    DROP POLICY IF EXISTS "Permitir all cuotas_facturas_compras" ON public.cuotas_facturas_compras;
    CREATE POLICY "Permitir all cuotas_facturas_compras" ON public.cuotas_facturas_compras FOR ALL USING (true);
END $$;
