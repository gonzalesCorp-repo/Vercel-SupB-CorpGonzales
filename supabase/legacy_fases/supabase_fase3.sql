-- 1. Crear tabla de ubicaciones (Cabinas, Sillones, etc.)
CREATE TABLE IF NOT EXISTS ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('lavadero', 'tocador', 'silla', 'cabina', 'sillón', 'en_espera')),
    estado TEXT DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar ubicaciones iniciales de ejemplo
INSERT INTO ubicaciones (nombre, tipo, estado) VALUES 
('Recepción / Lobby', 'en_espera', 'LIBRE'),
('Sillón Barbería 1', 'silla', 'LIBRE'),
('Sillón Barbería 2', 'silla', 'LIBRE'),
('Lavadero 1', 'lavadero', 'LIBRE'),
('Lavadero 2', 'lavadero', 'LIBRE'),
('Cabina Estética A', 'cabina', 'LIBRE'),
('Tocador Maquillaje', 'tocador', 'LIBRE'),
('Sillón Pedicure 1', 'sillón', 'LIBRE');

-- 2. Modificar OATC para el WFM y Tiempos
ALTER TABLE oatc
ADD COLUMN IF NOT EXISTS ubicacion_id UUID REFERENCES ubicaciones(id),
ADD COLUMN IF NOT EXISTS hora_inicio_atencion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS hora_fin_atencion TIMESTAMP WITH TIME ZONE;

-- Modificar tabla de agentes para tener la ubicacion (opcional, pero útil si el agente se asocia a la silla)
ALTER TABLE agentes
ADD COLUMN IF NOT EXISTS ubicacion_id UUID REFERENCES ubicaciones(id);

-- 3. Tabla Pedidos de Insumos (Staff -> Laboratorio)
CREATE TABLE IF NOT EXISTS pedidos_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES agentes(id),
    agente_nombre TEXT NOT NULL,
    insumo_solicitado TEXT NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'DESPACHADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
