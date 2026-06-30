-- FASE 9: Migración Emisores a Multisede (Muchos a Muchos)

-- 1. Crear tabla puente emisores_sedes
CREATE TABLE IF NOT EXISTS public.emisores_sedes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emisor_id UUID REFERENCES public.emisores(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(emisor_id, sede_id)
);

ALTER TABLE public.emisores_sedes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emisores_sedes visibles por todos" ON public.emisores_sedes FOR SELECT USING (true);
CREATE POLICY "Admin puede gestionar emisores_sedes" ON public.emisores_sedes FOR ALL USING (true);

-- 2. Migrar los datos existentes (cada emisor con su sede actual)
INSERT INTO public.emisores_sedes (emisor_id, sede_id)
SELECT id, sede_id
FROM public.emisores
WHERE sede_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Eliminar la columna sede_id de emisores para forzar el uso de la tabla puente
ALTER TABLE public.emisores DROP COLUMN IF EXISTS sede_id;
