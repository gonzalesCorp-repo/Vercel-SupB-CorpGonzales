-- ==============================================================================
-- FASE 19: TABLA DE INCIDENCIAS OPERATIVAS & ALERTAS EN TIEMPO REAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.incidencias_operativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'COBERTURA_AGENDA', 'VARIACION_INSUMO_LAB', 'URGENCIA_PISO'
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  origen_agente_nombre VARCHAR(100),
  origen_agente_rol VARCHAR(50),
  sede_id VARCHAR(100),
  sede_nombre VARCHAR(100),
  leido BOOLEAN DEFAULT false,
  accion_sugerida TEXT,
  metadatos JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y políticas seguras
ALTER TABLE public.incidencias_operativas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica de incidencias' AND tablename = 'incidencias_operativas') THEN
    CREATE POLICY "Permitir lectura publica de incidencias" ON public.incidencias_operativas FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir insercion de incidencias' AND tablename = 'incidencias_operativas') THEN
    CREATE POLICY "Permitir insercion de incidencias" ON public.incidencias_operativas FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir actualizacion de incidencias' AND tablename = 'incidencias_operativas') THEN
    CREATE POLICY "Permitir actualizacion de incidencias" ON public.incidencias_operativas FOR UPDATE USING (true);
  END IF;
END $$;

-- Agregar a publicación realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.incidencias_operativas;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
