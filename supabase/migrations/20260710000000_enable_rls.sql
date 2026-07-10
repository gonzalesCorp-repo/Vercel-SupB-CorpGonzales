-- Funciones de ayuda (Security Definer para by-pass RLS interno)
CREATE OR REPLACE FUNCTION auth_is_superadmin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM agentes WHERE id = auth.uid() AND rol = 'SUPERADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_sedes() RETURNS SETOF uuid AS $$
  SELECT sede_id FROM sedes_usuarios WHERE agente_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Habilitar RLS en las tablas principales
ALTER TABLE oatc ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE almacen_principal ENABLE ROW LEVEL SECURITY;
ALTER TABLE agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes_usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Crear Políticas (Policies)

-- OATC: Los usuarios ven las órdenes de su sede. El SUPERADMIN ve todo.
CREATE POLICY "Acceso OATC por Sede" ON oatc
FOR ALL USING (
  auth_is_superadmin() OR sede_id IN (SELECT auth_sedes())
);

-- CLIENTES: Los usuarios ven/editan clientes de su sede.
CREATE POLICY "Acceso Clientes por Sede" ON clientes
FOR ALL USING (
  auth_is_superadmin() OR sede_id IN (SELECT auth_sedes())
);

-- INVENTARIO: Mismo concepto
CREATE POLICY "Acceso Inventario por Sede" ON almacen_principal
FOR ALL USING (
  auth_is_superadmin() OR sede_id IN (SELECT auth_sedes())
);

-- SEDES_USUARIOS: Los agentes pueden ver su propia asignación, pero solo SUPERADMIN puede alterar
CREATE POLICY "Ver asignacion de sede" ON sedes_usuarios
FOR SELECT USING (
  auth_is_superadmin() OR agente_id = auth.uid()
);

-- AGENTES: Todos los agentes pueden verse en el directorio, pero solo editarse a sí mismos (o el admin a todos)
CREATE POLICY "Ver agentes global" ON agentes
FOR SELECT USING (true);

CREATE POLICY "Editar propio agente" ON agentes
FOR UPDATE USING (
  auth_is_superadmin() OR id = auth.uid()
);
