-- Tabla de Citas (Agenda CRM)
CREATE TABLE IF NOT EXISTS citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_nombre TEXT NOT NULL,
    cliente_id UUID REFERENCES clientes(id), -- Opcional, por si queremos enlazar al directorio
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado TEXT DEFAULT 'Programado' CHECK (estado IN ('Programado', 'Completado', 'Cancelado')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos datos de prueba para la Agenda
INSERT INTO citas (cliente_nombre, fecha, hora_inicio, hora_fin, estado, notas) 
VALUES 
('Ana García', CURRENT_DATE, '10:00', '11:00', 'Programado', 'Corte de puntas y balayage'),
('Carlos Ruiz', CURRENT_DATE, '14:30', '15:15', 'Programado', 'Corte clásico'),
('María López', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 'Programado', 'Manicure');
