-- ==============================================================================
-- FASE 23: POLÍTICAS RLS ROBUSTAS BASADAS EN ROLES Y IDENTIDAD (SUPABASE AUTH)
-- ==============================================================================

-- Función auxiliar para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.auth_user_rol()
RETURNS VARCHAR AS $$
DECLARE
  v_rol VARCHAR;
BEGIN
  SELECT rol INTO v_rol
  FROM public.agentes
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_rol, 'ANON');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. Tabla Cuentas Financieras (Caja y Bancos)
ALTER TABLE public.cuentas_financieras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura cuentas_financieras" ON public.cuentas_financieras;
DROP POLICY IF EXISTS "Permitir mutacion cuentas_financieras" ON public.cuentas_financieras;

-- Lectura para usuarios autenticados del ERP
CREATE POLICY "RLS_Cuentas_Select_Auth" ON public.cuentas_financieras
FOR SELECT TO authenticated
USING (true);

-- Modificación solo para ADMIN y SUPERADMIN
CREATE POLICY "RLS_Cuentas_Modify_Admin" ON public.cuentas_financieras
FOR ALL TO authenticated
USING (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA'))
WITH CHECK (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA'));

-- 2. Tabla Movimientos de Tesorería
ALTER TABLE public.movimientos_tesoreria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura movimientos_tesoreria" ON public.movimientos_tesoreria;
DROP POLICY IF EXISTS "Permitir mutacion movimientos_tesoreria" ON public.movimientos_tesoreria;

CREATE POLICY "RLS_Movimientos_Select_Auth" ON public.movimientos_tesoreria
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "RLS_Movimientos_Insert_Auth" ON public.movimientos_tesoreria
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA', 'JEFE_OPERATIVO'));

CREATE POLICY "RLS_Movimientos_Update_Admin" ON public.movimientos_tesoreria
FOR UPDATE TO authenticated
USING (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN'))
WITH CHECK (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN'));

-- 3. Tabla Agentes (Perfiles y Sueldos)
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura agentes" ON public.agentes;
DROP POLICY IF EXISTS "Permitir mutacion agentes" ON public.agentes;

-- Lectura general para el funcionamiento del ERP
CREATE POLICY "RLS_Agentes_Select_Public" ON public.agentes
FOR SELECT USING (true);

-- Solo ADMIN y SUPERADMIN pueden mutar datos sensibles de colaboradores
CREATE POLICY "RLS_Agentes_Modify_Admin" ON public.agentes
FOR ALL TO authenticated
USING (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN'))
WITH CHECK (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN'));

-- 4. Tabla Liquidaciones de Personal
ALTER TABLE public.liquidaciones_personal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura liquidaciones_personal" ON public.liquidaciones_personal;
DROP POLICY IF EXISTS "Permitir mutacion liquidaciones_personal" ON public.liquidaciones_personal;

CREATE POLICY "RLS_Liquidaciones_Select_Auth" ON public.liquidaciones_personal
FOR SELECT TO authenticated
USING (
  public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA', 'JEFE_OPERATIVO') 
  OR agente_id = auth.uid()
);

CREATE POLICY "RLS_Liquidaciones_Modify_Admin_Caja" ON public.liquidaciones_personal
FOR ALL TO authenticated
USING (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA'))
WITH CHECK (public.auth_user_rol() IN ('SUPERADMIN', 'ADMIN', 'CAJA'));
