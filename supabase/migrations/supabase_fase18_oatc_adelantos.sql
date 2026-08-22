-- ==============================================================================
-- FASE 18: EXTENSIÓN OATC Y COLUMNAS DE ADELANTO / ANTICIPOS
-- VAIKUNTHA ENTERPRISE ERP ENGINE
-- ==============================================================================

-- 1. Agregar columnas de adelanto a la tabla oatc si no existen
ALTER TABLE public.oatc
ADD COLUMN IF NOT EXISTS monto_adelanto NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_adelanto VARCHAR(50),
ADD COLUMN IF NOT EXISTS tipo_demanda VARCHAR(100) DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS monto_total NUMERIC(10, 2) DEFAULT 0;

-- 2. Asegurar permisos RLS en la tabla oatc
ALTER TABLE public.oatc ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'oatc' AND policyname = 'Permitir insercion en oatc para todos'
    ) THEN
        CREATE POLICY "Permitir insercion en oatc para todos"
        ON public.oatc FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'oatc' AND policyname = 'Permitir lectura en oatc para todos'
    ) THEN
        CREATE POLICY "Permitir lectura en oatc para todos"
        ON public.oatc FOR SELECT
        TO anon, authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'oatc' AND policyname = 'Permitir actualizacion en oatc para todos'
    ) THEN
        CREATE POLICY "Permitir actualizacion en oatc para todos"
        ON public.oatc FOR UPDATE
        TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- 3. Asegurar permisos RLS en cola_peticiones y config_peticiones
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cola_peticiones') THEN
        ALTER TABLE public.cola_peticiones ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Permitir lectura a todos en cola_peticiones" ON public.cola_peticiones;
        CREATE POLICY "Permitir lectura a todos en cola_peticiones" ON public.cola_peticiones FOR SELECT TO anon, authenticated USING (true);
        
        DROP POLICY IF EXISTS "Permitir todo a autenticados en cola_peticiones" ON public.cola_peticiones;
        CREATE POLICY "Permitir todo a autenticados en cola_peticiones" ON public.cola_peticiones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
