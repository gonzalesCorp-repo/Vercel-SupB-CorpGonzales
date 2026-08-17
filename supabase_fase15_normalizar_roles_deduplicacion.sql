-- ============================================================================
-- FASE 15: NORMALIZACIÓN DE ROLES & CUENTA DEDICADA KIOSKO TÓTEM
-- Elimina roles legados (RECEPCION, CAJA, DESPACHO) y establece los roles unificados:
-- SUPERADMIN, ADMIN, JEFE_OPERACIONES, SOPORTE, STAFF, KIOSKO
-- ============================================================================

-- 1. Normalizar roles legados en la tabla 'agentes'
UPDATE public.agentes 
SET rol = 'SOPORTE' 
WHERE rol IN ('RECEPCION', 'CAJA', 'DESPACHO', 'recepcion', 'caja', 'despacho');

UPDATE public.agentes 
SET rol = 'STAFF' 
WHERE rol IN ('ESTILISTA', 'MANICURISTA', 'BARBERO', 'COLORISTA', 'OPERACION', 'operacion', 'staff');

-- 2. Asegurar que 'config_roles' tenga el catálogo maestro limpio y moderno
INSERT INTO public.config_roles (codigo, nombre, descripcion, es_sistema)
VALUES 
  ('SUPERADMIN', 'Super Administrador', 'Acceso total al ERP y herramientas de desarrollo /dev', true),
  ('ADMIN', 'Administrador de Sede', 'Gestión general de sede, catálogo, finanzas y delegación de usuarios', true),
  ('JEFE_OPERACIONES', 'Jefe Operativo / Piso', 'Supervisión de piso, semáforo SLA de estaciones y aprobación de insumos', true),
  ('SOPORTE', 'Personal de Soporte', 'Acceso base a Mi Cuenta + herramientas habilitadas quirúrgicamente por el Admin', true),
  ('STAFF', 'Staff Operativo en Estación', 'Atención física en estación, registro de OATC y marcación NFC', true),
  ('KIOSKO', 'Tótem Kiosko Dedicado', 'Terminal táctil fija por sede para autoservicio de clientes y marcación rápida', true)
ON CONFLICT (codigo) DO UPDATE 
SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion;

-- 3. Crear usuario Kiosko por defecto para cada sede si no existe
DO $$
DECLARE
  r_sede RECORD;
BEGIN
  FOR r_sede IN SELECT id, nombre FROM public.sedes LOOP
    INSERT INTO public.agentes (
      nombre, 
      email, 
      rol, 
      estado, 
      especialidad, 
      sedes_ids
    )
    VALUES (
      'Kiosko Tótem - ' || r_sede.nombre,
      'kiosk.' || lower(regexp_replace(r_sede.nombre, '[^a-zA-Z0-9]', '', 'g')) || '@vaikuntha.com',
      'KIOSKO',
      'DISPONIBLE',
      'Tótem Táctil Autoservicio',
      ARRAY[r_sede.id]
    )
    ON CONFLICT (email) DO NOTHING;
  END LOOP;
END $$;
