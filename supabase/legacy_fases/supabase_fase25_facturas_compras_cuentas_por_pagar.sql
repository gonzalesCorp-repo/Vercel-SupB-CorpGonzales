-- ==============================================================================
-- FASE 25: FACTURAS DE COMPRAS, CUENTAS POR PAGAR (15, 30, 45, 60D) & CUADRE DEL DÍA
-- ==============================================================================

-- 1. Tabla de Facturas de Compras
CREATE TABLE IF NOT EXISTS public.facturas_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id VARCHAR NOT NULL,
  proveedor_ruc VARCHAR NOT NULL,
  proveedor_razon_social VARCHAR NOT NULL,
  tipo_comprobante VARCHAR NOT NULL, -- 'FACTURA', 'BOLETA', 'RECIBO_HONORARIOS', 'NOTA_CREDITO'
  serie VARCHAR NOT NULL,
  numero VARCHAR NOT NULL,
  fecha_emision DATE NOT NULL,
  condicion_pago VARCHAR NOT NULL, -- 'CONTADO', 'CREDITO_15D', 'CREDITO_30D', 'CREDITO_45D', 'CREDITO_60D', 'CREDITO_CUOTAS'
  fecha_vencimiento DATE NOT NULL,
  moneda VARCHAR DEFAULT 'PEN',
  subtotal NUMERIC DEFAULT 0.00,
  igv NUMERIC DEFAULT 0.00,
  total NUMERIC NOT NULL,
  monto_pagado NUMERIC DEFAULT 0.00,
  saldo_pendiente NUMERIC NOT NULL,
  estado_pago VARCHAR DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO_TOTAL', 'VENCIDO'
  cuenta_pago_id UUID REFERENCES public.cuentas_financieras(id),
  categoria_gasto VARCHAR DEFAULT 'PAGO_PROVEEDOR',
  comprobante_adjunto_url VARCHAR DEFAULT NULL,
  notas TEXT DEFAULT NULL,
  registrado_por VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Cuotas de Facturas a Crédito
CREATE TABLE IF NOT EXISTS public.cuotas_facturas_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_compra_id UUID NOT NULL REFERENCES public.facturas_compras(id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL,
  monto_cuota NUMERIC NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado VARCHAR DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'PAGADO'
  movimiento_tesoreria_id UUID REFERENCES public.movimientos_tesoreria(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Campos para Bandeja de Cuadre del Día en movimientos_tesoreria
ALTER TABLE public.movimientos_tesoreria 
ADD COLUMN IF NOT EXISTS incluido_en_cuadre BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_cuadre_dia DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS aceptado_por_cuadre VARCHAR DEFAULT NULL;

-- RLS
ALTER TABLE public.facturas_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_facturas_compras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RLS_FacturasCompras_Select" ON public.facturas_compras FOR SELECT TO authenticated USING (true);
CREATE POLICY "RLS_FacturasCompras_Admin" ON public.facturas_compras FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "RLS_CuotasFacturas_Select" ON public.cuotas_facturas_compras FOR SELECT TO authenticated USING (true);
CREATE POLICY "RLS_CuotasFacturas_Admin" ON public.cuotas_facturas_compras FOR ALL TO authenticated USING (true) WITH CHECK (true);
