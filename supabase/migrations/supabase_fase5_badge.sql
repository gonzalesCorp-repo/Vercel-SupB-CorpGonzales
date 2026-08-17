-- Fase 5: Badge de "Pasar la voz"
-- Añade una columna 'badge' a la tabla de agentes para mostrar alertas visuales en la cola (ej. "Comprando Tinte")

ALTER TABLE public.agentes ADD COLUMN IF NOT EXISTS badge TEXT;
