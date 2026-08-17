-- FASE 8: CREACIÓN DE LOGS Y AJUSTE DE ROLES

DO $$
BEGIN
    -- 1. Crear la tabla de system_logs
    CREATE TABLE IF NOT EXISTS public.system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        modulo VARCHAR(50) NOT NULL,
        accion VARCHAR(255) NOT NULL,
        usuario_email VARCHAR(255) NOT NULL,
        detalles JSONB DEFAULT '{}'::jsonb,
        sede_id UUID REFERENCES public.sedes(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 2. Habilitar RLS para la tabla de logs (Solo el SUPERADMIN debería verlos desde la app)
    ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
    
    -- Política simple: Permitir inserción a todos los autenticados
    CREATE POLICY "Permitir insercion a todos los usuarios" ON public.system_logs
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
    -- Política simple: Permitir lectura a todos (el filtro se hará en la UI por seguridad simplificada en esta fase)
    CREATE POLICY "Permitir lectura a todos" ON public.system_logs
        FOR SELECT USING (auth.role() = 'authenticated');

    -- 3. Activar Realtime para los logs
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE system_logs';
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- 4. Ajustar los roles de los usuarios de prueba actuales en la tabla agentes
-- Usaremos un formato CSV en el campo rol: 'RECEPCION,WFM' para soportar múltiples paneles
UPDATE public.agentes SET rol = 'SUPERADMIN' WHERE email = 'admin@prueba.com';
UPDATE public.agentes SET rol = 'CAJA' WHERE email = 'caja@prueba.com';
UPDATE public.agentes SET rol = 'DESPACHO' WHERE email = 'despacho@prueba.com';
UPDATE public.agentes SET rol = 'STAFF' WHERE email = 'operario1@prueba.com';
UPDATE public.agentes SET rol = 'STAFF' WHERE email = 'operario2@prueba.com';
UPDATE public.agentes SET rol = 'STAFF' WHERE email = 'operario3@prueba.com';
UPDATE public.agentes SET rol = 'RECEPCION,WFM' WHERE email = 'recepcion@prueba.com';
-- Agregamos a ventas (aunque aún no está activo el panel)
INSERT INTO public.agentes (id, nombre, email, rol, estado)
SELECT gen_random_uuid(), 'Vendedor Retail', 'ventas@prueba.com', 'VENTAS', 'DISPONIBLE'
WHERE NOT EXISTS (SELECT 1 FROM public.agentes WHERE email = 'ventas@prueba.com');

-- (Nota: Para login se requiere que ventas@prueba.com sea creado en la UI de Supabase, pero a nivel ERP ya existe)
