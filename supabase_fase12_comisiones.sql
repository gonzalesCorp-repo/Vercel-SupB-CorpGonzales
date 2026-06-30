-- FASE 12: PRODUCTIVIDAD Y COMISIONES (Herencia)

-- 1. Añadir porcentaje base al Catálogo (bienes)
ALTER TABLE public.bienes 
ADD COLUMN IF NOT EXISTS comision_porcentaje NUMERIC(5,2) DEFAULT 0;

-- 2. Crear tabla de excepciones por agente (agentes_comisiones)
CREATE TABLE IF NOT EXISTS public.agentes_comisiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agente_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    bien_id UUID REFERENCES public.bienes(id) ON DELETE CASCADE,
    comision_porcentaje NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agente_id, bien_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.agentes_comisiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comisiones visibles por todos" 
ON public.agentes_comisiones FOR SELECT 
USING (true);

CREATE POLICY "Solo administradores pueden gestionar comisiones" 
ON public.agentes_comisiones FOR ALL 
USING (true); -- Permitimos por ahora en sandbox, pero se puede restringir por rol luego
