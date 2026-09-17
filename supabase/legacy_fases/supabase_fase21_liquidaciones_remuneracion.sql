-- ==============================================================================
-- FASE 21: LIQUIDACIONES QUIRÚRGICAS (STAFF VS SOPORTE) & ESQUEMAS REMUNERATIVOS
-- ==============================================================================

-- 1. Configuración Remunerativa por Colaborador
CREATE TABLE IF NOT EXISTS public.agente_configuracion_remunerativa (
  agente_id UUID PRIMARY KEY REFERENCES public.agentes(id) ON DELETE CASCADE,
  tipo_remuneracion VARCHAR(50) NOT NULL DEFAULT 'SOLO_COMISIONES', -- 'SOLO_COMISIONES', 'SOLO_SUELDO_BASE', 'SUELDO_BASE_MAS_COMISIONES'
  sueldo_base NUMERIC(12, 2) DEFAULT 0.00,
  porcentaje_comision_servicios NUMERIC(5, 2) DEFAULT 40.00,
  porcentaje_comision_productos NUMERIC(5, 2) DEFAULT 10.00,
  frecuencia_corte VARCHAR(30) DEFAULT 'DIARIA', -- 'DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'A_DEMANDA'
  permite_solicitud_manual BOOLEAN DEFAULT true,
  cuenta_bancaria_pago_preferida VARCHAR(100),
  banco_preferido VARCHAR(50),
  numero_documento_pago VARCHAR(50), -- DNI / RUC para RHE
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Liquidaciones de Personal (Historial & Solicitudes)
CREATE TABLE IF NOT EXISTS public.liquidaciones_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_correlativo VARCHAR(50) NOT NULL, -- ej. LIQ-STAFF-2026-0001
  agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE RESTRICT,
  agente_nombre VARCHAR(150) NOT NULL,
  agente_rol VARCHAR(50) NOT NULL, -- 'STAFF' | 'SOPORTE' | 'CAJA' | 'ADMIN' | 'JEFE_OPERATIVO'
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
  estado VARCHAR(30) DEFAULT 'SOLICITADO_STAFF', -- 'BORRADOR_AUTOMATICO', 'SOLICITADO_STAFF', 'PAGADO', 'ANULADO'
  solicitado_por VARCHAR(150),
  aprobado_por VARCHAR(150),
  fecha_pago TIMESTAMPTZ,
  sede_id VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Detalle de Ítems de Liquidación (Bloqueo Anti-Duplicidad)
CREATE TABLE IF NOT EXISTS public.liquidaciones_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liquidacion_id UUID NOT NULL REFERENCES public.liquidaciones_personal(id) ON DELETE CASCADE,
  tipo_item VARCHAR(30) NOT NULL, -- 'SERVICIO', 'PRODUCTO', 'PROPINA', 'ADELANTO', 'SUELDO_BASE'
  origen_id VARCHAR(100) NOT NULL, -- ticket_id / oatc_id / comprobante_id
  descripcion VARCHAR(255) NOT NULL,
  fecha_servicio TIMESTAMPTZ NOT NULL,
  monto_venta NUMERIC(12, 2) DEFAULT 0.00,
  porcentaje_aplicado NUMERIC(5, 2) DEFAULT 0.00,
  monto_comision NUMERIC(12, 2) NOT NULL,
  cliente_nombre VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de auditoría anti-duplicidad
CREATE INDEX IF NOT EXISTS idx_liquidaciones_items_origen ON public.liquidaciones_items(origen_id, tipo_item);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_personal_agente_estado ON public.liquidaciones_personal(agente_id, estado);

-- Habilitar RLS & Políticas
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

-- Publicación Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.agente_configuracion_remunerativa;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.liquidaciones_personal;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.liquidaciones_items;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
