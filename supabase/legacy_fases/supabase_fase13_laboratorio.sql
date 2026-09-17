-- FASE 13: LABORATORIO (PEDIDOS)

CREATE TABLE IF NOT EXISTS public.lab_pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oatc_id UUID REFERENCES public.oatc(id) ON DELETE CASCADE,
    agente_id UUID REFERENCES public.agentes(id) ON DELETE RESTRICT,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE RESTRICT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'DESPACHADO', 'RECHAZADO')),
    insumos_solicitados JSONB NOT NULL,
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS
ALTER TABLE public.lab_pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pedidos de laboratorio visibles por todos" 
ON public.lab_pedidos FOR SELECT 
USING (true);

CREATE POLICY "Inserción libre para pedidos" 
ON public.lab_pedidos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Actualización libre de pedidos" 
ON public.lab_pedidos FOR UPDATE 
USING (true);
