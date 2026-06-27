-- ==========================================
-- ARCHIVO MAESTRO DE POLÍTICAS RLS (LOCAL)
-- Generado el: 2026-06-27
-- ==========================================
-- Mantén este archivo actualizado cada vez que
-- agreguemos nuevas políticas de seguridad en Supabase.
-- ==========================================

-- ------------------------------------------
-- TABLA: agentes
-- ------------------------------------------
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a usuarios autenticados" 
ON public.agentes FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir actualizar a usuarios autenticados" 
ON public.agentes FOR UPDATE
TO authenticated 
USING (true);

-- ------------------------------------------
-- TABLA: cola_peticiones
-- ------------------------------------------
ALTER TABLE public.cola_peticiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a todos en cola_peticiones" 
ON public.cola_peticiones FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Permitir todo a autenticados en cola_peticiones" 
ON public.cola_peticiones FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ------------------------------------------
-- TABLA: config_peticiones
-- ------------------------------------------
ALTER TABLE public.config_peticiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a todos en config_peticiones" 
ON public.config_peticiones FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Permitir todo a autenticados en config_peticiones" 
ON public.config_peticiones FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ------------------------------------------
-- TABLA: sedes
-- ------------------------------------------
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de sedes a todos los usuarios" 
ON public.sedes FOR SELECT 
TO authenticated 
USING (true);

-- ------------------------------------------
-- TABLA: sedes_usuarios
-- ------------------------------------------
ALTER TABLE public.sedes_usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de sedes_usuarios a todos" 
ON public.sedes_usuarios FOR SELECT 
TO authenticated 
USING (true);

-- ------------------------------------------
-- TABLA: system_logs
-- ------------------------------------------
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir insercion a todos los usuarios" 
ON public.system_logs FOR INSERT 
TO public 
WITH CHECK ((auth.role() = 'authenticated'::text));

CREATE POLICY "Permitir lectura a todos" 
ON public.system_logs FOR SELECT 
TO public 
USING ((auth.role() = 'authenticated'::text));
