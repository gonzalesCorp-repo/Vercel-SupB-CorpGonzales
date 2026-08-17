-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    dni TEXT UNIQUE,
    celular TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla del Catálogo (Servicios y Productos Retail)
CREATE TABLE IF NOT EXISTS bienes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo_bien TEXT NOT NULL CHECK (tipo_bien IN ('servicio', 'producto')),
    categoria TEXT,
    precio_venta NUMERIC(10,2),
    atributos_producto JSONB,
    atributos_servicio JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Agentes (Usuarios de Operaciones)
CREATE TABLE IF NOT EXISTS agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'OCUPADO', 'INACTIVO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla OATC (Tickets de atención generados)
CREATE TABLE IF NOT EXISTS oatc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id),
    cliente_nombre TEXT NOT NULL,
    agente_id UUID REFERENCES agentes(id),
    agente_nombre TEXT,
    punto_partida JSONB NOT NULL,
    estado_proceso TEXT DEFAULT 'ESPERA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Opcional) Insertar algunos datos de prueba para que podamos probar la UI:
INSERT INTO bienes (nombre, tipo_bien, categoria, precio_venta, atributos_servicio) 
VALUES ('Corte de Cabello Clásico', 'servicio', 'Barbería', 30.00, '{"tiempo_estimado_min": 45}');

INSERT INTO bienes (nombre, tipo_bien, categoria, precio_venta, atributos_producto) 
VALUES ('Shampoo Anticaspa Profesional', 'producto', 'Cuidado Capilar', 45.00, '{"marca": "Head & Shoulders", "linea": "Pro"}');

INSERT INTO agentes (nombre, estado) VALUES ('Juan Pérez', 'DISPONIBLE'), ('María López', 'DISPONIBLE');
INSERT INTO clientes (nombre, dni, celular) VALUES ('Cliente Demo', '12345678', '987654321');
