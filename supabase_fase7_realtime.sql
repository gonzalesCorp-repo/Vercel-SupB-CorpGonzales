-- Activar Supabase Realtime para las tablas operativas clave
DO $$
BEGIN
  -- Intentar agregar las tablas a la publicación de realtime si no están
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE oatc, agentes, pedidos_insumos, citas, ubicaciones';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
