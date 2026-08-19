-- ==============================================================================
-- FASE 17: INTEGRACIÓN MULTI-CUENTA GOOGLE DRIVE & STORAGE DE ARCHIVOS PESADOS
-- VAIKUNTHA ENTERPRISE ERP ENGINE
-- ==============================================================================

-- 1. Tabla de Cuentas / Espacios de Google Drive configurados
CREATE TABLE IF NOT EXISTS public.drive_cuentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_descriptivo VARCHAR(255) NOT NULL,
    email_cuenta VARCHAR(255) NOT NULL,
    tipo_autenticacion VARCHAR(50) NOT NULL DEFAULT 'SERVICE_ACCOUNT' CHECK (tipo_autenticacion IN ('SERVICE_ACCOUNT', 'OAUTH_CLIENT')),
    service_account_json TEXT,
    root_folder_id VARCHAR(255) NOT NULL DEFAULT 'root',
    proposito VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (proposito IN ('MULTIMEDIA', 'DOCUMENTOS', 'MARCAS', 'GENERAL')),
    es_default BOOLEAN NOT NULL DEFAULT false,
    roles_permitidos TEXT[] NOT NULL DEFAULT ARRAY['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'],
    sedes_asignadas TEXT[] NOT NULL DEFAULT ARRAY['TODAS'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    espacio_usado_bytes BIGINT DEFAULT 0,
    espacio_total_bytes BIGINT DEFAULT 107374182400, -- 100 GB por defecto
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Archivos vinculados a Clientes, Marcas y OATCs
CREATE TABLE IF NOT EXISTS public.drive_archivos_vinculados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_cuenta_id UUID REFERENCES public.drive_cuentas(id) ON DELETE CASCADE,
    file_id_google VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(500) NOT NULL,
    mime_type VARCHAR(150) NOT NULL,
    tamano_bytes BIGINT NOT NULL DEFAULT 0,
    thumbnail_url TEXT,
    web_view_link TEXT NOT NULL,
    web_content_link TEXT,
    entidad_tipo VARCHAR(50) NOT NULL DEFAULT 'GENERAL' CHECK (entidad_tipo IN ('CLIENTE', 'MARCA', 'OATC', 'SEDE', 'GENERAL')),
    entidad_id UUID,
    entidad_nombre VARCHAR(255),
    carpeta_padre_id VARCHAR(255) DEFAULT 'root',
    carpeta_ruta TEXT DEFAULT '/',
    subido_por_nombre VARCHAR(255) DEFAULT 'Sistema',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices de aceleración
CREATE INDEX IF NOT EXISTS idx_drive_cuentas_proposito ON public.drive_cuentas(proposito, is_active);
CREATE INDEX IF NOT EXISTS idx_drive_archivos_entidad ON public.drive_archivos_vinculados(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_drive_archivos_cuenta ON public.drive_archivos_vinculados(drive_cuenta_id, created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.drive_cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_archivos_vinculados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de cuentas drive permitida a autenticados"
ON public.drive_cuentas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestion de cuentas drive para admins"
ON public.drive_cuentas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Lectura y gestion de archivos vinculados"
ON public.drive_archivos_vinculados FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Seeds de Cuentas Demo de Google Drive para Sandbox
INSERT INTO public.drive_cuentas (id, nombre_descriptivo, email_cuenta, tipo_autenticacion, root_folder_id, proposito, es_default, roles_permitidos, sedes_asignadas, espacio_usado_bytes, espacio_total_bytes)
VALUES 
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Drive Multimedia & Videos 4K (Shared)', 'multimedia@vaikuntha.com', 'SERVICE_ACCOUNT', '1A2B3C4D_MULTIMEDIA_ROOT', 'MULTIMEDIA', true, ARRAY['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'], ARRAY['TODAS'], 34359738368, 2199023255552), -- 32GB de 2TB
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Drive Fichas Técnicas & Clientes', 'documentos@vaikuntha.com', 'SERVICE_ACCOUNT', '1E2F3G4H_DOCS_ROOT', 'DOCUMENTOS', true, ARRAY['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'], ARRAY['TODAS'], 5368709120, 107374182400), -- 5GB de 100GB
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Drive Marcas, Logos & Campañas', 'marcas@vaikuntha.com', 'OAUTH_CLIENT', '1I2J3K4L_MARCAS_ROOT', 'MARCAS', false, ARRAY['SUPERADMIN', 'ADMIN'], ARRAY['TODAS'], 12884901888, 536870912000) -- 12GB de 500GB
ON CONFLICT (id) DO NOTHING;
