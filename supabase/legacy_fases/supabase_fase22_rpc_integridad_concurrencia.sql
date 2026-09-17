-- ==============================================================================
-- FASE 22: STORED PROCEDURES & RPC ATÓMICOS PARA INTEGRIDAD Y CONCURRENCIA
-- ==============================================================================

-- 1. Actualización Atómica de Saldo en Cuentas Financieras (Row-Level Locking)
CREATE OR REPLACE FUNCTION public.rpc_actualizar_saldo_cuenta(
  p_cuenta_id UUID,
  p_monto_delta NUMERIC -- Positivo para ingresos, Negativo para egresos
)
RETURNS NUMERIC AS $$
DECLARE
  v_saldo_actual NUMERIC;
  v_nuevo_saldo NUMERIC;
BEGIN
  -- Bloqueo pesimista de fila para evitar Lost Updates
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

-- 2. Despacho Atómico de Stock en Laboratorio & Kardex
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
  -- Casteo seguro de sede_id a UUID con fallback
  BEGIN
    v_sede_uuid := p_sede_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    SELECT id INTO v_sede_uuid FROM public.sedes LIMIT 1;
  END;

  -- 1. Obtener costo base
  SELECT COALESCE(costo_base, 0) INTO v_costo_base
  FROM public.bienes
  WHERE id = p_bien_id;

  -- 2. Bloquear y actualizar stock en almacen_laboratorio
  SELECT COALESCE(stock_actual, 0) INTO v_stock_actual
  FROM public.almacen_laboratorio
  WHERE sede_id = v_sede_uuid AND bien_id = p_bien_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Si no existe registro previo en laboratorio, inicializarlo en 0
    INSERT INTO public.almacen_laboratorio (sede_id, bien_id, stock_actual, stock_en_uso, updated_at)
    VALUES (v_sede_uuid, p_bien_id, 0, 0, NOW());
    v_stock_actual := 0;
  END IF;

  v_nuevo_stock := GREATEST(0, v_stock_actual - p_cantidad);

  UPDATE public.almacen_laboratorio
  SET stock_actual = v_nuevo_stock,
      updated_at = NOW()
  WHERE sede_id = v_sede_uuid AND bien_id = p_bien_id;

  -- 3. Registrar movimiento en Kardex (usando fecha_hora nativa en vez de created_at)
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

GRANT EXECUTE ON FUNCTION public.rpc_actualizar_saldo_cuenta(UUID, NUMERIC) TO authenticated, anon, service_role;
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
  -- Bloqueo a nivel de serie mediante advisory lock con hash
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
