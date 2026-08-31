-- ==============================================================================
-- MIGRACIÓN: Saneamiento Canónico de 'estado' y 'estado_operativo' en public.agentes
-- Fecha: 2026-08-31
-- Descripción:
--   1. 'estado': Vínculo laboral/administrativo en la sede ('ACTIVO', 'INACTIVO').
--   2. 'estado_operativo': Disponibilidad en turno/piso ('DISPONIBLE', 'OCUPADO',
--      'EN_REFRIGERIO', 'FUERA_DE_TURNO', 'EN_DESCANSO').
-- ==============================================================================

-- 1. Actualizar registros existentes que tengan valores cruzados en 'estado'
UPDATE public.agentes
SET estado = 'ACTIVO'
WHERE estado IN ('DISPONIBLE', 'OCUPADO') OR estado IS NULL;

-- 2. Asegurar que cualquier otro valor fuera de ACTIVO/INACTIVO sea ACTIVO
UPDATE public.agentes
SET estado = 'ACTIVO'
WHERE estado NOT IN ('ACTIVO', 'INACTIVO');

-- 3. Normalizar 'estado_operativo' en registros que tengan 'FUERA_TURNO' u otros no canónicos
UPDATE public.agentes
SET estado_operativo = 'FUERA_DE_TURNO'
WHERE estado_operativo IS NULL 
   OR estado_operativo = 'FUERA_TURNO' 
   OR estado_operativo NOT IN ('DISPONIBLE', 'OCUPADO', 'EN_REFRIGERIO', 'FUERA_DE_TURNO', 'EN_DESCANSO');

-- 4. Si algún agente está INACTIVO, forzar su estado_operativo a FUERA_DE_TURNO
UPDATE public.agentes
SET estado_operativo = 'FUERA_DE_TURNO'
WHERE estado = 'INACTIVO';

-- 5. Modificar valores por defecto de las columnas en public.agentes
ALTER TABLE public.agentes 
    ALTER COLUMN estado SET DEFAULT 'ACTIVO',
    ALTER COLUMN estado_operativo SET DEFAULT 'FUERA_DE_TURNO';

-- 6. Reemplazar o crear CHECK constraints estrictos en PostgreSQL
ALTER TABLE public.agentes DROP CONSTRAINT IF EXISTS agentes_estado_check;
ALTER TABLE public.agentes ADD CONSTRAINT agentes_estado_check 
    CHECK (estado IN ('ACTIVO', 'INACTIVO'));

ALTER TABLE public.agentes DROP CONSTRAINT IF EXISTS agentes_estado_operativo_check;
ALTER TABLE public.agentes ADD CONSTRAINT agentes_estado_operativo_check 
    CHECK (estado_operativo IN ('DISPONIBLE', 'OCUPADO', 'EN_REFRIGERIO', 'FUERA_DE_TURNO', 'EN_DESCANSO'));

-- 7. Comentarios de documentación en base de datos
COMMENT ON COLUMN public.agentes.estado IS 'Vínculo laboral/administrativo: ACTIVO (alta en sede) o INACTIVO (cese laboral). Preserva integridad histórica.';
COMMENT ON COLUMN public.agentes.estado_operativo IS 'Disponibilidad operativa en turno/piso WFM: DISPONIBLE, OCUPADO, EN_REFRIGERIO, FUERA_DE_TURNO, EN_DESCANSO.';
