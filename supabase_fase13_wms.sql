-- ==============================================================================
-- FASE 13: WMS LABORATORIO (Gestión de Almacén Completa)
-- ==============================================================================

-- 1. Tabla de Almacén Principal (Inventario Maestro por Sede)
CREATE TABLE IF NOT EXISTS public.almacen_principal (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    bien_id UUID NOT NULL REFERENCES public.bienes(id) ON DELETE CASCADE,
    proveedor TEXT,
    marca TEXT,
    linea TEXT,
    presentacion TEXT,
    stock NUMERIC DEFAULT 0,
    stock_minimo NUMERIC DEFAULT 0,
    costo_unitario NUMERIC DEFAULT 0,
    ubicacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_bien_sede_principal UNIQUE (sede_id, bien_id)
);

-- 2. Tabla de Almacén de Laboratorio (Inventario Rápido por Sede)
CREATE TABLE IF NOT EXISTS public.almacen_laboratorio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    bien_id UUID NOT NULL REFERENCES public.bienes(id) ON DELETE CASCADE,
    stock_actual NUMERIC DEFAULT 0,
    stock_en_uso NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_bien_sede_laboratorio UNIQUE (sede_id, bien_id)
);

-- 3. Tabla de Kardex (Inventario Movimientos)
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_movimiento TEXT NOT NULL, -- 'INGRESO', 'TRANSFERENCIA', 'SALIDA CONSUMO', 'MERMA'
    bien_id UUID NOT NULL REFERENCES public.bienes(id) ON DELETE CASCADE,
    descripcion TEXT,
    cantidad NUMERIC NOT NULL,
    origen TEXT,
    destino TEXT,
    agente_id UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
    costo_unitario NUMERIC DEFAULT 0,
    referencia_id TEXT -- Puede apuntar a un OATC o una Factura según el caso
);

-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.almacen_principal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.almacen_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas almacen_principal
CREATE POLICY "Permitir select almacen_principal" 
ON public.almacen_principal FOR SELECT USING (true);

CREATE POLICY "Permitir insert almacen_principal" 
ON public.almacen_principal FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir update almacen_principal" 
ON public.almacen_principal FOR UPDATE USING (true);

CREATE POLICY "Permitir delete almacen_principal" 
ON public.almacen_principal FOR DELETE USING (true);

-- Políticas almacen_laboratorio
CREATE POLICY "Permitir select almacen_laboratorio" 
ON public.almacen_laboratorio FOR SELECT USING (true);

CREATE POLICY "Permitir insert almacen_laboratorio" 
ON public.almacen_laboratorio FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir update almacen_laboratorio" 
ON public.almacen_laboratorio FOR UPDATE USING (true);

CREATE POLICY "Permitir delete almacen_laboratorio" 
ON public.almacen_laboratorio FOR DELETE USING (true);

-- Políticas inventario_movimientos
CREATE POLICY "Permitir select inventario_movimientos" 
ON public.inventario_movimientos FOR SELECT USING (true);

CREATE POLICY "Permitir insert inventario_movimientos" 
ON public.inventario_movimientos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir update inventario_movimientos" 
ON public.inventario_movimientos FOR UPDATE USING (true);

CREATE POLICY "Permitir delete inventario_movimientos" 
ON public.inventario_movimientos FOR DELETE USING (true);
