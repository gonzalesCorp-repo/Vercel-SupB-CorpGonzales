-- ==============================================================================
-- MIGRACIÓN CONSOLIDADA: FASES 20, 21, 22, CLIENTES Y COMPROBANTES DE PAGO
-- PROYECTO: Vaikuntha ERP / Gloss Salón and Relax (eeajeeufdxythnaufjcc)
-- FECHA: 2026-09-03
-- ==============================================================================

-- ==============================================================================
-- PASO 1: ENRIQUECIMIENTO DE public.clientes (Requerimiento R3)
-- ==============================================================================
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS saldo_credito NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(12, 2) DEFAULT 500.00;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notas TEXT;

-- ==============================================================================
-- PASO 2: CONSOLIDACIÓN DE public.comprobantes_pago (Requerimiento R1)
-- ==============================================================================
ALTER TABLE public.comprobantes_pago ADD COLUMN IF NOT EXISTS correlativo INTEGER;
ALTER TABLE public.comprobantes_pago ADD COLUMN IF NOT EXISTS fecha_emision TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.comprobantes_pago ADD COLUMN IF NOT EXISTS metadata_fiscal JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.comprobantes_pago ALTER COLUMN items SET DEFAULT '[]'::jsonb;
ALTER TABLE public.comprobantes_pago ALTER COLUMN pagos SET DEFAULT '[]'::jsonb;
ALTER TABLE public.comprobantes_pago ALTER COLUMN cajero_nombre SET DEFAULT 'Cajero POS';
ALTER TABLE public.comprobantes_pago ALTER COLUMN cliente_nombre SET DEFAULT 'Cliente General';

-- Sincronización de registros históricos
UPDATE public.comprobantes_pago SET correlativo = numero WHERE correlativo IS NULL;
UPDATE public.comprobantes_pago SET fecha_emision = created_at WHERE fecha_emision IS NULL;

-- Sincronizador automático de correlativo y numero
CREATE OR REPLACE FUNCTION public.fn_sync_comprobante_numero_correlativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.correlativo IS NULL AND NEW.numero IS NOT NULL THEN
    NEW.correlativo := NEW.numero;
  ELSIF NEW.numero IS NULL AND NEW.correlativo IS NOT NULL THEN
    NEW.numero := NEW.correlativo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_comprobante_numero_correlativo ON public.comprobantes_pago;
CREATE TRIGGER trg_sync_comprobante_numero_correlativo
BEFORE INSERT OR UPDATE ON public.comprobantes_pago
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_comprobante_numero_correlativo();

CREATE INDEX IF NOT EXISTS idx_comprobantes_pago_serie_numero ON public.comprobantes_pago(serie, numero);
CREATE INDEX IF NOT EXISTS idx_comprobantes_pago_serie_correlativo ON public.comprobantes_pago(serie, correlativo);

-- Restricción de Unicidad para evitar duplicados en emisión concurrente (M5 Concurrency Remediation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_comprobantes_pago_serie_correlativo'
  ) THEN
    ALTER TABLE public.comprobantes_pago 
    ADD CONSTRAINT uq_comprobantes_pago_serie_correlativo UNIQUE (serie, correlativo);
  END IF;
END $$;

-- ==============================================================================
-- PASO 3: FASE 20 - FINANZAS, TESORERÍA, CAJA Y BANCOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cuentas_financieras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  tipo_cuenta VARCHAR(50) NOT NULL,
  banco_entidad VARCHAR(100) NOT NULL,
  numero_cuenta VARCHAR(100),
  moneda VARCHAR(10) DEFAULT 'PEN',
  saldo_actual NUMERIC(12, 2) DEFAULT 0.00,
  sede_id VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'ACTIVO',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimientos_tesoreria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
  tipo_movimiento VARCHAR(20) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  monto NUMERIC(12, 2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'PEN',
  descripcion TEXT NOT NULL,
  beneficiario_nombre VARCHAR(150),
  agente_id UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
  comprobante_adjunto_url TEXT,
  numero_operacion_voucher VARCHAR(100),
  requiere_aprobacion BOOLEAN DEFAULT false,
  estado_aprobacion VARCHAR(30) DEFAULT 'APROBADO',
  autorizado_por VARCHAR(150),
  registrado_por VARCHAR(150) NOT NULL,
  sede_id VARCHAR(100),
  fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transferencias_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_origen_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE RESTRICT,
  cuenta_destino_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE RESTRICT,
  monto NUMERIC(12, 2) NOT NULL,
  comision_transferencia NUMERIC(12, 2) DEFAULT 0.00,
  descripcion TEXT,
  numero_operacion VARCHAR(100),
  registrado_por VARCHAR(150) NOT NULL,
  sede_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semillas iniciales Gloss Salón
INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'Caja Chica (Fondo Fijo Sede)', 'CAJA_CHICA', 'Efectivo', 'CAJA-01', 'PEN', 350.00, 'c9755dbc-11e0-452d-b971-209f5476bbcb', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'Caja Chica (Fondo Fijo Sede)');

INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'BCP Cta Corriente Empresa', 'BANCO', 'BCP', '193-98231234-0-12', 'PEN', 4200.00, 'c9755dbc-11e0-452d-b971-209f5476bbcb', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'BCP Cta Corriente Empresa');

INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'Yape Comercial Empresa', 'BILLETERA_DIGITAL', 'Yape', '987-654-321', 'PEN', 890.00, 'c9755dbc-11e0-452d-b971-209f5476bbcb', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'Yape Comercial Empresa');

ALTER TABLE public.cuentas_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_tesoreria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias_cuentas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica cuentas_financieras' AND tablename = 'cuentas_financieras') THEN
    CREATE POLICY "Permitir lectura publica cuentas_financieras" ON public.cuentas_financieras FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion cuentas_financieras' AND tablename = 'cuentas_financieras') THEN
    CREATE POLICY "Permitir mutacion cuentas_financieras" ON public.cuentas_financieras FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica movimientos_tesoreria' AND tablename = 'movimientos_tesoreria') THEN
    CREATE POLICY "Permitir lectura publica movimientos_tesoreria" ON public.movimientos_tesoreria FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion movimientos_tesoreria' AND tablename = 'movimientos_tesoreria') THEN
    CREATE POLICY "Permitir mutacion movimientos_tesoreria" ON public.movimientos_tesoreria FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica transferencias_cuentas' AND tablename = 'transferencias_cuentas') THEN
    CREATE POLICY "Permitir lectura publica transferencias_cuentas" ON public.transferencias_cuentas FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion transferencias_cuentas' AND tablename = 'transferencias_cuentas') THEN
    CREATE POLICY "Permitir mutacion transferencias_cuentas" ON public.transferencias_cuentas FOR ALL USING (true);
  END IF;
END $$;

-- ==============================================================================
-- PASO 4: FASE 21 - LIQUIDACIONES DE PERSONAL Y ESQUEMAS REMUNERATIVOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.agente_configuracion_remunerativa (
  agente_id UUID PRIMARY KEY REFERENCES public.agentes(id) ON DELETE CASCADE,
  tipo_remuneracion VARCHAR(50) NOT NULL DEFAULT 'SOLO_COMISIONES',
  sueldo_base NUMERIC(12, 2) DEFAULT 0.00,
  porcentaje_comision_servicios NUMERIC(5, 2) DEFAULT 40.00,
  porcentaje_comision_productos NUMERIC(5, 2) DEFAULT 10.00,
  frecuencia_corte VARCHAR(30) DEFAULT 'DIARIA',
  permite_solicitud_manual BOOLEAN DEFAULT true,
  cuenta_bancaria_pago_preferida VARCHAR(100),
  banco_preferido VARCHAR(50),
  numero_documento_pago VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.liquidaciones_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_correlativo VARCHAR(50) NOT NULL,
  agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE RESTRICT,
  agente_nombre VARCHAR(150) NOT NULL,
  agente_rol VARCHAR(50) NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  tipo_remuneracion VARCHAR(50) NOT NULL,
  monto_sueldo_base NUMERIC(12, 2) DEFAULT 0.00,
  monto_comisiones_servicios NUMERIC(12, 2) DEFAULT 0.00,
  monto_comisiones_productos NUMERIC(12, 2) DEFAULT 0.00,
  monto_propinas NUMERIC(12, 2) DEFAULT 0.00,
  monto_adelantos_deducidos NUMERIC(12, 2) DEFAULT 0.00,
  monto_total_neto NUMERIC(12, 2) NOT NULL,
  cuenta_pago_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
  cuenta_pago_nombre VARCHAR(150),
  movimiento_tesoreria_id UUID REFERENCES public.movimientos_tesoreria(id) ON DELETE SET NULL,
  estado VARCHAR(30) DEFAULT 'SOLICITADO_STAFF',
  solicitado_por VARCHAR(150),
  aprobado_por VARCHAR(150),
  fecha_pago TIMESTAMPTZ,
  sede_id VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.liquidaciones_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidacion_id UUID NOT NULL REFERENCES public.liquidaciones_personal(id) ON DELETE CASCADE,
  tipo_item VARCHAR(30) NOT NULL,
  origen_id VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  fecha_servicio TIMESTAMPTZ NOT NULL,
  monto_venta NUMERIC(12, 2) DEFAULT 0.00,
  porcentaje_aplicado NUMERIC(5, 2) DEFAULT 0.00,
  monto_comision NUMERIC(12, 2) NOT NULL,
  cliente_nombre VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_liquidaciones_items_origen ON public.liquidaciones_items(origen_id, tipo_item);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_personal_agente_estado ON public.liquidaciones_personal(agente_id, estado);

ALTER TABLE public.agente_configuracion_remunerativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura agente_configuracion_remunerativa' AND tablename = 'agente_configuracion_remunerativa') THEN
    CREATE POLICY "Permitir lectura agente_configuracion_remunerativa" ON public.agente_configuracion_remunerativa FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion agente_configuracion_remunerativa' AND tablename = 'agente_configuracion_remunerativa') THEN
    CREATE POLICY "Permitir mutacion agente_configuracion_remunerativa" ON public.agente_configuracion_remunerativa FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura liquidaciones_personal' AND tablename = 'liquidaciones_personal') THEN
    CREATE POLICY "Permitir lectura liquidaciones_personal" ON public.liquidaciones_personal FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion liquidaciones_personal' AND tablename = 'liquidaciones_personal') THEN
    CREATE POLICY "Permitir mutacion liquidaciones_personal" ON public.liquidaciones_personal FOR ALL USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura liquidaciones_items' AND tablename = 'liquidaciones_items') THEN
    CREATE POLICY "Permitir lectura liquidaciones_items" ON public.liquidaciones_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion liquidaciones_items' AND tablename = 'liquidaciones_items') THEN
    CREATE POLICY "Permitir mutacion liquidaciones_items" ON public.liquidaciones_items FOR ALL USING (true);
  END IF;
END $$;

-- ==============================================================================
-- PASO 5: FASE 22 - STORED PROCEDURES & RPC ATÓMICOS
-- ==============================================================================

-- 1. Actualización Atómica de Saldo en Cuentas Financieras
CREATE OR REPLACE FUNCTION public.rpc_actualizar_saldo_cuenta(
  p_cuenta_id UUID,
  p_monto_delta NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_saldo_actual NUMERIC;
  v_nuevo_saldo NUMERIC;
BEGIN
  SELECT saldo_actual INTO v_saldo_actual
  FROM public.cuentas_financieras
  WHERE id = p_cuenta_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cuenta financiera con ID % no encontrada.', p_cuenta_id;
  END IF;

  v_nuevo_saldo := COALESCE(v_saldo_actual, 0) + p_monto_delta;

  UPDATE public.cuentas_financieras
  SET saldo_actual = v_nuevo_saldo,
      updated_at = NOW()
  WHERE id = p_cuenta_id;

  RETURN v_nuevo_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_actualizar_saldo_cuenta(UUID, NUMERIC) TO authenticated, anon, service_role;

-- 2. Despacho Atómico de Stock en Laboratorio & Kardex (Bug de fecha_hora y sede UUID resueltos)
CREATE OR REPLACE FUNCTION public.rpc_despachar_stock_laboratorio(
  p_sede_id VARCHAR,
  p_bien_id UUID,
  p_cantidad NUMERIC,
  p_tipo_movimiento VARCHAR DEFAULT 'DESPACHO_ODI_IOT',
  p_descripcion TEXT DEFAULT 'Despacho de laboratorio',
  p_oatc_id VARCHAR DEFAULT NULL,
  p_agente_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS NUMERIC AS $$
DECLARE
  v_stock_actual NUMERIC;
  v_nuevo_stock NUMERIC;
  v_costo_base NUMERIC;
  v_sede_uuid UUID;
BEGIN
  BEGIN
    v_sede_uuid := p_sede_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    SELECT id INTO v_sede_uuid FROM public.sedes LIMIT 1;
  END;

  SELECT COALESCE(costo_base, 0) INTO v_costo_base
  FROM public.bienes
  WHERE id = p_bien_id;

  SELECT COALESCE(stock_actual, 0) INTO v_stock_actual
  FROM public.almacen_laboratorio
  WHERE sede_id = v_sede_uuid AND bien_id = p_bien_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.almacen_laboratorio (sede_id, bien_id, stock_actual, stock_en_uso, updated_at)
    VALUES (v_sede_uuid, p_bien_id, 0, 0, NOW());
    v_stock_actual := 0;
  END IF;

  v_nuevo_stock := GREATEST(0, v_stock_actual - p_cantidad);

  UPDATE public.almacen_laboratorio
  SET stock_actual = v_nuevo_stock,
      updated_at = NOW()
  WHERE sede_id = v_sede_uuid AND bien_id = p_bien_id;

  INSERT INTO public.inventario_movimientos (
    sede_id,
    tipo_movimiento,
    bien_id,
    descripcion,
    cantidad,
    costo_unitario,
    origen,
    destino,
    agente_id,
    metadata_iot,
    fecha_hora
  ) VALUES (
    v_sede_uuid,
    p_tipo_movimiento,
    p_bien_id,
    p_descripcion,
    p_cantidad,
    v_costo_base,
    'LABORATORIO',
    COALESCE(p_oatc_id, 'ESTACION_PISO'),
    p_agente_id,
    p_metadata,
    NOW()
  );

  RETURN v_nuevo_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_despachar_stock_laboratorio(VARCHAR, UUID, NUMERIC, VARCHAR, TEXT, VARCHAR, UUID, JSONB) TO authenticated, anon, service_role;

-- 3. Generación Concurrente y Atómica de Correlativos SUNAT / POS sobre comprobantes_pago
CREATE OR REPLACE FUNCTION public.rpc_siguiente_correlativo_comprobante(
  p_sede_id VARCHAR,
  p_serie VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_ultimo_correlativo INTEGER;
  v_siguiente_correlativo INTEGER;
  v_lock_key TEXT;
BEGIN
  v_lock_key := COALESCE(p_sede_id, 'GLOBAL') || '_' || p_serie;
  PERFORM pg_advisory_xact_lock(hashtext(v_lock_key));

  SELECT COALESCE(MAX(COALESCE(correlativo, numero)), 0) INTO v_ultimo_correlativo
  FROM public.comprobantes_pago
  WHERE serie = p_serie
    AND (p_sede_id IS NULL OR sede_id IS NULL OR sede_id::text = p_sede_id);

  v_siguiente_correlativo := v_ultimo_correlativo + 1;

  RETURN v_siguiente_correlativo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_siguiente_correlativo_comprobante(VARCHAR, VARCHAR) TO authenticated, anon, service_role;

-- 4. Emisión Atómica y Concurrente de Comprobantes de Pago con Advisory Lock (M5 Remediation)
CREATE OR REPLACE FUNCTION public.rpc_emitir_comprobante_pago(
  p_sede_id VARCHAR,
  p_sesion_caja_id UUID,
  p_tipo_comprobante VARCHAR,
  p_serie VARCHAR,
  p_cliente_id UUID DEFAULT NULL,
  p_cliente_nombre VARCHAR DEFAULT 'Cliente General',
  p_cliente_doc VARCHAR DEFAULT NULL,
  p_tipo_doc VARCHAR DEFAULT 'DNI',
  p_subtotal NUMERIC DEFAULT 0.00,
  p_igv NUMERIC DEFAULT 0.00,
  p_total NUMERIC DEFAULT 0.00,
  p_descuento_total NUMERIC DEFAULT 0.00,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_pagos JSONB DEFAULT '[]'::jsonb,
  p_oatc_ids TEXT[] DEFAULT '{}',
  p_cajero_nombre VARCHAR DEFAULT 'Cajero POS',
  p_metadata_fiscal JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_correlativo INTEGER;
  v_nuevo_id UUID;
  v_sede_uuid UUID;
  v_lock_key TEXT;
  v_result JSONB;
  v_oatc_uuids UUID[] := '{}';
BEGIN
  v_lock_key := COALESCE(p_sede_id, 'GLOBAL') || '_' || p_serie;
  PERFORM pg_advisory_xact_lock(hashtext(v_lock_key));

  BEGIN
    v_sede_uuid := p_sede_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_sede_uuid := NULL;
  END;

  IF p_oatc_ids IS NOT NULL AND array_length(p_oatc_ids, 1) > 0 THEN
    BEGIN
      v_oatc_uuids := p_oatc_ids::UUID[];
    EXCEPTION WHEN OTHERS THEN
      v_oatc_uuids := ARRAY(
        SELECT elem::UUID 
        FROM unnest(p_oatc_ids) AS elem 
        WHERE elem ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      );
    END;
  END IF;

  SELECT COALESCE(MAX(COALESCE(correlativo, numero)), 0) + 1 INTO v_correlativo
  FROM public.comprobantes_pago
  WHERE serie = p_serie
    AND (p_sede_id IS NULL OR sede_id IS NULL OR sede_id::text = p_sede_id);

  INSERT INTO public.comprobantes_pago (
    sede_id, sesion_caja_id, tipo_comprobante, serie, numero, correlativo,
    cliente_id, cliente_nombre, cliente_doc, tipo_doc, subtotal, igv,
    total, descuento_total, items, pagos, oatc_ids, cajero_nombre,
    metadata_fiscal, fecha_emision, estado
  ) VALUES (
    v_sede_uuid, p_sesion_caja_id, p_tipo_comprobante, p_serie, v_correlativo, v_correlativo,
    p_cliente_id, p_cliente_nombre, p_cliente_doc, p_tipo_doc, p_subtotal, p_igv,
    p_total, p_descuento_total, p_items, p_pagos, v_oatc_uuids, p_cajero_nombre,
    p_metadata_fiscal, NOW(), 'EMITIDO'
  ) RETURNING id INTO v_nuevo_id;

  SELECT jsonb_build_object(
    'id', v_nuevo_id,
    'sede_id', v_sede_uuid,
    'sesion_caja_id', p_sesion_caja_id,
    'tipo_comprobante', p_tipo_comprobante,
    'serie', p_serie,
    'correlativo', v_correlativo,
    'numero', v_correlativo,
    'cliente_id', p_cliente_id,
    'cliente_nombre', p_cliente_nombre,
    'cliente_doc', p_cliente_doc,
    'tipo_doc', p_tipo_doc,
    'subtotal', p_subtotal,
    'igv', p_igv,
    'total', p_total,
    'descuento_total', p_descuento_total,
    'items', p_items,
    'pagos', p_pagos,
    'oatc_ids', v_oatc_uuids,
    'cajero_nombre', p_cajero_nombre,
    'metadata_fiscal', p_metadata_fiscal,
    'estado', 'EMITIDO'
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_emitir_comprobante_pago TO authenticated, anon, service_role;
