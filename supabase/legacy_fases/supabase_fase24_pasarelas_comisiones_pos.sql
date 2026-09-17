-- ==============================================================================
-- FASE 24: MATRIZ DE RUTEO DE PAGOS, COMISIONES DE PASARELAS POS & CONCILIACIÓN
-- ==============================================================================

-- 1. Matriz de Configuración de Pasarelas y Tasas de Comisión
CREATE TABLE IF NOT EXISTS public.config_pasarelas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL, -- ej. 'Izipay POS Mostrador', 'Niubiz Terminal 1', 'Yape Comercial', 'Efectivo Caja'
  medio_pago VARCHAR NOT NULL, -- 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'BILLETERA_DIGITAL', 'EFECTIVO', 'TRANSFERENCIA'
  cuenta_puente_id UUID REFERENCES public.cuentas_financieras(id), -- Para fondos en tránsito (D+1)
  cuenta_destino_id UUID NOT NULL REFERENCES public.cuentas_financieras(id), -- Cuenta bancaria final
  porcentaje_comision NUMERIC DEFAULT 0.00, -- ej. 3.25 (%)
  costo_fijo_transaccion NUMERIC DEFAULT 0.00, -- ej. S/ 0.00
  aplica_igv_comision BOOLEAN DEFAULT true, -- true = + 18% IGV sobre la comisión
  dias_liquidacion INTEGER DEFAULT 1, -- 0 = Inmediato, 1 = D+1, 2 = D+2
  tipo_acreditacion VARCHAR DEFAULT 'EN_TRANSITO_LOTE', -- 'INMEDIATA' o 'EN_TRANSITO_LOTE'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lotes de Conciliación POS y Liquidaciones de Pasarela (En Tránsito -> Depositado)
CREATE TABLE IF NOT EXISTS public.lotes_liquidaciones_pos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id VARCHAR NOT NULL,
  pasarela_id UUID NOT NULL REFERENCES public.config_pasarelas_pago(id),
  pasarela_nombre VARCHAR NOT NULL,
  fecha_lote DATE NOT NULL,
  cantidad_transacciones INTEGER DEFAULT 0,
  monto_bruto_total NUMERIC DEFAULT 0.00,
  comision_estimada NUMERIC DEFAULT 0.00,
  monto_neto_estimado NUMERIC DEFAULT 0.00,
  monto_neto_real_depositado NUMERIC DEFAULT NULL,
  diferencia_varianza NUMERIC DEFAULT 0.00,
  estado VARCHAR DEFAULT 'EN_TRANSITO', -- 'EN_TRANSITO', 'CONCILIADO_DEPOSITADO', 'OBSERVADO'
  numero_operacion_bancaria VARCHAR DEFAULT NULL,
  comprobante_deposito_url VARCHAR DEFAULT NULL,
  conciliado_por VARCHAR DEFAULT NULL,
  fecha_conciliacion TIMESTAMPTZ DEFAULT NULL,
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.config_pasarelas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_liquidaciones_pos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RLS_Pasarelas_Select" ON public.config_pasarelas_pago FOR SELECT TO authenticated USING (true);
CREATE POLICY "RLS_Pasarelas_Admin" ON public.config_pasarelas_pago FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "RLS_LotesPOS_Select" ON public.lotes_liquidaciones_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "RLS_LotesPOS_Admin" ON public.lotes_liquidaciones_pos FOR ALL TO authenticated USING (true) WITH CHECK (true);
