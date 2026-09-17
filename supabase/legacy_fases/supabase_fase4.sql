-- 1. Modificar la tabla de Agentes para soportar Accesos/Roles
ALTER TABLE agentes
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'STAFF' CHECK (rol IN ('ADMIN', 'STAFF', 'RECEPCION'));

-- 2. Actualizar a los agentes existentes con un correo de prueba para que puedan iniciar sesión
UPDATE agentes 
SET email = 'juan@gonzales.page', rol = 'STAFF' 
WHERE nombre = 'Juan Pérez' AND email IS NULL;

UPDATE agentes 
SET email = 'maria@gonzales.page', rol = 'STAFF' 
WHERE nombre = 'María López' AND email IS NULL;

-- Insertar el usuario administrador que se usó en pruebas
INSERT INTO agentes (nombre, estado, email, rol) 
VALUES ('Administrador', 'INACTIVO', 'cristian@gonzales.page', 'ADMIN')
ON CONFLICT (email) DO NOTHING;
