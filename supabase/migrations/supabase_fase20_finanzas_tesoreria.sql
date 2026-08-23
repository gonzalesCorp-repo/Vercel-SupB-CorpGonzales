-- ==============================================================================
-- FASE 20: MÓDULO DE FINANZAS, TESORERÍA, CAJA Y BANCOS & LIQUIDACIÓN STAFF
-- ==============================================================================

-- 1. Cuentas Financieras (Caja Chica, Cuentas Bancarias, Billeteras, Pasarelas)
CREATE TABLE IF NOT EXISTS public.cuentas_financieras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  tipo_cuenta VARCHAR(50) NOT NULL, -- 'CAJA_CHICA', 'BANCO', 'BILLETERA_DIGITAL', 'PASARELA_POS'
  banco_entidad VARCHAR(100) NOT NULL, -- 'Efectivo', 'BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Yape', 'Plin', 'Niubiz', 'Izipay'
  numero_cuenta VARCHAR(100),
  moneda VARCHAR(10) DEFAULT 'PEN', -- 'PEN', 'USD'
  saldo_actual NUMERIC(12, 2) DEFAULT 0.00,
  sede_id VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Movimientos de Tesorería (Ingresos y Egresos no-venta, Gastos de Caja Chica, Liquidaciones)
CREATE TABLE IF NOT EXISTS public.movimientos_tesoreria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID REFERENCES public.cuentas_financieras(id) ON DELETE SET NULL,
  tipo_movimiento VARCHAR(20) NOT NULL, -- 'INGRESO', 'EGRESO'
  categoria VARCHAR(60) NOT NULL, -- 'LIQUIDACION_STAFF', 'ADELANTO_SUELDO', 'CAJA_CHICA_OPERATIVO', 'REPOSICION_FONDO', 'PAGO_PROVEEDOR', 'SERVICIOS_BASICOS', 'OTROS_INGRESOS', 'OTROS_EGRESOS'
  monto NUMERIC(12, 2) NOT NULL,
  moneda VARCHAR(10) DEFAULT 'PEN',
  descripcion TEXT NOT NULL,
  beneficiario_nombre VARCHAR(150),
  agente_id UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
  comprobante_adjunto_url TEXT,
  numero_operacion_voucher VARCHAR(100),
  requiere_aprobacion BOOLEAN DEFAULT false,
  estado_aprobacion VARCHAR(30) DEFAULT 'APROBADO', -- 'APROBADO', 'PENDIENTE_SUPERADMIN', 'RECHAZADO'
  autorizado_por VARCHAR(150),
  registrado_por VARCHAR(150) NOT NULL,
  sede_id VARCHAR(100),
  fecha_movimiento TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transferencias entre Cuentas (Traslados de fondos, ej. Caja Chica ➔ Banco BCP)
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

-- 4. Semillas iniciales por defecto (si la tabla está vacía)
INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'Caja Chica (Fondo Fijo Sede)', 'CAJA_CHICA', 'Efectivo', 'CAJA-01', 'PEN', 350.00, 'sede_sandbox_01', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'Caja Chica (Fondo Fijo Sede)');

INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'BCP Cta Corriente Empresa', 'BANCO', 'BCP', '193-98231234-0-12', 'PEN', 4200.00, 'sede_sandbox_01', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'BCP Cta Corriente Empresa');

INSERT INTO public.cuentas_financieras (nombre, tipo_cuenta, banco_entidad, numero_cuenta, moneda, saldo_actual, sede_id, estado)
SELECT 'Yape Comercial Empresa', 'BILLETERA_DIGITAL', 'Yape', '987-654-321', 'PEN', 890.00, 'sede_sandbox_01', 'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM public.cuentas_financieras WHERE nombre = 'Yape Comercial Empresa');

-- RLS y Políticas de Seguridad
ALTER TABLE public.cuentas_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_tesoreria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias_cuentas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  -- Cuentas Financieras
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica cuentas_financieras' AND tablename = 'cuentas_financieras') THEN
    CREATE POLICY "Permitir lectura publica cuentas_financieras" ON public.cuentas_financieras FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion cuentas_financieras' AND tablename = 'cuentas_financieras') THEN
    CREATE POLICY "Permitir mutacion cuentas_financieras" ON public.cuentas_financieras FOR ALL USING (true);
  END IF;

  -- Movimientos Tesorería
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica movimientos_tesoreria' AND tablename = 'movimientos_tesoreria') THEN
    CREATE POLICY "Permitir lectura publica movimientos_tesoreria" ON public.movimientos_tesoreria FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion movimientos_tesoreria' AND tablename = 'movimientos_tesoreria') THEN
    CREATE POLICY "Permitir mutacion movimientos_tesoreria" ON public.movimientos_tesoreria FOR ALL USING (true);
  END IF;

  -- Transferencias
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica transferencias_cuentas' AND tablename = 'transferencias_cuentas') THEN
    CREATE POLICY "Permitir lectura publica transferencias_cuentas" ON public.transferencias_cuentas FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir mutacion transferencias_cuentas' AND tablename = 'transferencias_cuentas') THEN
    CREATE POLICY "Permitir mutacion transferencias_cuentas" ON public.transferencias_cuentas FOR ALL USING (true);
  END IF;
END $$;

-- Publicación Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cuentas_financieras;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.movimientos_tesoreria;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.transferencias_cuentas;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
