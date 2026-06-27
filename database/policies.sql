-- ==========================================
-- ARCHIVO MAESTRO DE POLÍTICAS RLS (LOCAL)
-- ==========================================
-- Mantén este archivo actualizado cada vez que
-- agreguemos nuevas políticas de seguridad en Supabase.
-- ==========================================

-- ------------------------------------------
-- TABLA: cola_peticiones
-- ------------------------------------------
-- 1. Nos aseguramos de que el RLS esté encendido
ALTER TABLE public.cola_peticiones ENABLE ROW LEVEL SECURITY;

-- 2. Política SELECT: Todos los usuarios logueados pueden LEER la cola (para que Recepción y el App puedan verla)
CREATE POLICY "Lectura general autenticados" 
ON public.cola_peticiones FOR SELECT 
TO authenticated 
USING (true);

-- 3. Política INSERT: Los agentes autenticados pueden ENVIAR peticiones a la cola
CREATE POLICY "Inserción de peticiones WFM" 
ON public.cola_peticiones FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 4. Política UPDATE: Permitir a Recepción (o agentes) ACTUALIZAR el estado (Aprobar/Rechazar)
CREATE POLICY "Actualización de peticiones WFM" 
ON public.cola_peticiones FOR UPDATE
TO authenticated 
USING (true);
