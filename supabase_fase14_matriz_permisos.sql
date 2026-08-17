-- ==============================================================================
-- FASE 14: MATRIZ DE PERMISOS QUIRÚRGICOS, ROLES DINÁMICOS & MUTACIÓN DE BIENES
-- ==============================================================================

-- 1. Tabla de Roles Dinámicos (Configurable por Admin / SuperAdmin)
CREATE TABLE IF NOT EXISTS public.config_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles base del sistema
INSERT INTO public.config_roles (codigo, nombre, descripcion, es_sistema) VALUES
('SUPERADMIN', 'Super Administrador', 'Control total del ERP y herramientas de depuración de desarrollador', true),
('ADMIN', 'Administrador de Sede', 'Gestión operativa, reportes y delegación quirúrgica de herramientas', true),
('SOPORTE', 'Personal de Apoyo / Soporte', 'Acceso base a Mi Cuenta y herramientas otorgadas progresivamente', true),
('OPERACION', 'Operativo / Staff de Piso', 'Atención en estaciones físicas y aplicación móvil de trabajo', true),
('CLIENTE', 'Cliente / Consumidor', 'Autoservicio, seguimiento de citas y portal de beneficios', true),
('RECEPCION', 'Recepción & Front', 'Gestión de citas, agenda y buzón de autorizaciones', true),
('CAJA', 'Caja & Cobros', 'Facturación, cobros POS y arqueo de caja', true),
('DESPACHO', 'Despacho & Taller', 'Pesaje por gramos, fraccionados y kardex', true),
('STAFF', 'Staff General', 'Acceso a estación y comisiones', true)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

-- 2. Tabla Relacional de Delegación Quirúrgica de Herramientas
CREATE TABLE IF NOT EXISTS public.agente_herramientas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    herramienta_key VARCHAR(100) NOT NULL,
    habilitado_por UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_agente_herramienta UNIQUE (agente_id, herramienta_key)
);

-- 3. Mutación Tripartita de Bienes (Servicio, Producto Venta, Insumo Taller)
ALTER TABLE public.bienes 
    ADD COLUMN IF NOT EXISTS es_servicio BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS es_producto_venta BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS es_insumo_taller BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS atributos_configurados JSONB DEFAULT '{}'::jsonb;

-- Sincronizar bienes existentes según su tipo_bien legacy
UPDATE public.bienes SET 
    es_servicio = (tipo_bien = 'servicio'),
    es_producto_venta = (tipo_bien = 'producto'),
    es_insumo_taller = (tipo_bien = 'producto' AND categoria ILIKE '%quimico%' OR categoria ILIKE '%tinte%')
WHERE es_servicio IS FALSE AND es_insumo_taller IS FALSE;

-- 4. Parametrización Multi-Sede en Demandas, Peticiones y Cancelaciones
ALTER TABLE public.config_demandas ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE;
ALTER TABLE public.config_peticiones ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE;
ALTER TABLE public.motivos_cancelacion ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE;

-- 5. Tabla de Configuración Fiscal SUNAT Multi-RUC
CREATE TABLE IF NOT EXISTS public.sedes_fiscal_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    ruc VARCHAR(11) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    serie_boleta VARCHAR(4) DEFAULT 'B001',
    serie_factura VARCHAR(4) DEFAULT 'F001',
    token_api_sunat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_sede_fiscal UNIQUE (sede_id)
);

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.config_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agente_herramientas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes_fiscal_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública para config_roles" ON public.config_roles FOR SELECT USING (true);
CREATE POLICY "Lectura pública para agente_herramientas" ON public.agente_herramientas FOR SELECT USING (true);
CREATE POLICY "Admin gestiona agente_herramientas" ON public.agente_herramientas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura pública para sedes_fiscal_config" ON public.sedes_fiscal_config FOR SELECT USING (true);
CREATE POLICY "Admin gestiona sedes_fiscal_config" ON public.sedes_fiscal_config FOR ALL USING (true) WITH CHECK (true);
