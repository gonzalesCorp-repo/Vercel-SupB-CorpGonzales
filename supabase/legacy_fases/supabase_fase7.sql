-- 1. Crear Tabla de Sedes
CREATE TABLE IF NOT EXISTS sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar sedes iniciales
INSERT INTO sedes (nombre, direccion) VALUES 
('Sede Principal', 'Av. Central 123'),
('Unidad de Prueba (Sandbox)', 'Virtual');

-- 2. Crear Tabla de Accesos de Usuarios a Sedes
CREATE TABLE IF NOT EXISTS sedes_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES agentes(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES sedes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agente_id, sede_id)
);

-- Asignar la sede principal a todos los agentes actuales para que no pierdan acceso
DO $$
DECLARE
    sede_principal_id UUID;
    agente RECORD;
BEGIN
    SELECT id INTO sede_principal_id FROM sedes WHERE nombre = 'Sede Principal' LIMIT 1;
    
    FOR agente IN SELECT id FROM agentes LOOP
        INSERT INTO sedes_usuarios (agente_id, sede_id) 
        VALUES (agente.id, sede_principal_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Dar acceso a ambas sedes al Administrador (para que pueda cambiar)
DO $$
DECLARE
    sede_prueba_id UUID;
    admin_id UUID;
BEGIN
    SELECT id INTO sede_prueba_id FROM sedes WHERE nombre = 'Unidad de Prueba (Sandbox)' LIMIT 1;
    SELECT id INTO admin_id FROM agentes WHERE rol = 'ADMIN' LIMIT 1;
    
    IF admin_id IS NOT NULL AND sede_prueba_id IS NOT NULL THEN
        INSERT INTO sedes_usuarios (agente_id, sede_id) 
        VALUES (admin_id, sede_prueba_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- 3. Alterar Tablas Core (Añadir sede_id)
ALTER TABLE oatc ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
ALTER TABLE citas ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
ALTER TABLE facturas ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
ALTER TABLE ubicaciones ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);
ALTER TABLE pedidos_insumos ADD COLUMN IF NOT EXISTS sede_id UUID REFERENCES sedes(id);

-- Opcionalmente: Asignar todos los registros existentes a la "Sede Principal"
DO $$
DECLARE
    sede_principal_id UUID;
BEGIN
    SELECT id INTO sede_principal_id FROM sedes WHERE nombre = 'Sede Principal' LIMIT 1;
    
    UPDATE oatc SET sede_id = sede_principal_id WHERE sede_id IS NULL;
    UPDATE citas SET sede_id = sede_principal_id WHERE sede_id IS NULL;
    UPDATE facturas SET sede_id = sede_principal_id WHERE sede_id IS NULL;
    UPDATE ubicaciones SET sede_id = sede_principal_id WHERE sede_id IS NULL;
    UPDATE pedidos_insumos SET sede_id = sede_principal_id WHERE sede_id IS NULL;
END $$;
