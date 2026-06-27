-- Fase 5: Workflow Management y Peticiones

CREATE TABLE IF NOT EXISTS public.config_peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    penaliza_cola BOOLEAN DEFAULT false,
    color TEXT DEFAULT 'bg-blue-100 text-blue-700',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.config_peticiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura a todos en config_peticiones" ON public.config_peticiones FOR SELECT USING (true);
CREATE POLICY "Permitir todo a autenticados en config_peticiones" ON public.config_peticiones FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.config_peticiones (nombre, penaliza_cola, color) VALUES 
('Inicio de Turno', false, 'bg-emerald-100 text-emerald-700'),
('Fin de Turno', true, 'bg-slate-100 text-slate-700'),
('Refrigerio', true, 'bg-orange-100 text-orange-700'),
('Salida Rápida (Pasar la voz)', false, 'bg-purple-100 text-purple-700'),
('Urgencia Familiar', true, 'bg-red-100 text-red-700')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.cola_peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    tipo_id UUID REFERENCES public.config_peticiones(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.agentes(id) ON DELETE SET NULL
);

ALTER TABLE public.cola_peticiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura a todos en cola_peticiones" ON public.cola_peticiones FOR SELECT USING (true);
CREATE POLICY "Permitir todo a autenticados en cola_peticiones" ON public.cola_peticiones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime for cola_peticiones and config_peticiones
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cola_peticiones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cola_peticiones;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'config_peticiones') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE config_peticiones;
  END IF;
END $$;
