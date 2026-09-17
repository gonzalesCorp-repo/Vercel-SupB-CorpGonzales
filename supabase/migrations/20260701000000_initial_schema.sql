-- ==============================================================================
-- CONSOLIDATED INITIAL BASELINE SCHEMA (FASES 1 - 19)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA SEDES
CREATE TABLE IF NOT EXISTS public.sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    direccion TEXT,
    codigo TEXT,
    atributos JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar sedes iniciales si no existen
INSERT INTO public.sedes (id, nombre, direccion) VALUES 
('a0000000-0000-0000-0000-000000000001', 'Sede Principal', 'Av. Central 123'),
('b0000000-0000-0000-0000-000000000002', 'Unidad de Prueba (Sandbox)', 'Virtual')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA UBICACIONES
CREATE TABLE IF NOT EXISTS public.ubicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('lavadero', 'tocador', 'silla', 'cabina', 'sillón', 'silln', 'en_espera')),
    estado TEXT DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA AGENTES
CREATE TABLE IF NOT EXISTS public.agentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    rol TEXT DEFAULT 'STAFF',
    estado TEXT DEFAULT 'ACTIVO',
    estado_operativo TEXT DEFAULT 'FUERA_DE_TURNO',
    ubicacion_id UUID REFERENCES public.ubicaciones(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA SEDES_USUARIOS
CREATE TABLE IF NOT EXISTS public.sedes_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agente_id, sede_id)
);

-- 6. TABLA CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    nombre TEXT NOT NULL,
    dni TEXT,
    celular TEXT,
    email TEXT,
    saldo_credito NUMERIC(12, 2) DEFAULT 0.00,
    limite_credito NUMERIC(12, 2) DEFAULT 500.00,
    notas TEXT,
    agente_id UUID REFERENCES public.agentes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLAS CATEGORÍAS Y MODELOS DE BIENES (JERARQUÍA Y MOLDES)
CREATE TABLE IF NOT EXISTS public.categorias_bienes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo_bien TEXT NOT NULL DEFAULT 'producto',
    division_padre_id UUID REFERENCES public.categorias_bienes(id) ON DELETE CASCADE,
    icono TEXT,
    color TEXT,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modelos_bienes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo_naturaleza TEXT NOT NULL,
    categoria_default TEXT,
    descripcion TEXT,
    icono TEXT,
    esquema_atributos JSONB DEFAULT '{}'::jsonb,
    es_plantilla_sistema BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA BIENES (CATÁLOGO MAESTRO)
CREATE TABLE IF NOT EXISTS public.bienes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    tipo_bien TEXT NOT NULL,
    categoria TEXT,
    precio_venta NUMERIC(10,2) DEFAULT 0,
    costo_base NUMERIC(10,2) DEFAULT 0,
    atributos_producto JSONB DEFAULT '{}'::jsonb,
    atributos_servicio JSONB DEFAULT '{}'::jsonb,
    atributos_configurados JSONB DEFAULT '{}'::jsonb,
    es_servicio BOOLEAN DEFAULT false,
    es_producto_venta BOOLEAN DEFAULT false,
    es_insumo_taller BOOLEAN DEFAULT false,
    categoria_id UUID REFERENCES public.categorias_bienes(id) ON DELETE SET NULL,
    linea_id UUID REFERENCES public.categorias_bienes(id) ON DELETE SET NULL,
    modelo_id UUID REFERENCES public.modelos_bienes(id) ON DELETE SET NULL,
    duracion_minutos INTEGER DEFAULT 30,
    comision_porcentaje NUMERIC(5,2) DEFAULT 0,
    es_intermedio_subreceta BOOLEAN DEFAULT false,
    area_produccion_boh TEXT,
    receta_insumos JSONB DEFAULT '[]'::jsonb,
    sku TEXT,
    codigo_barras TEXT,
    qr_code_id TEXT,
    unidad_medida TEXT DEFAULT 'UND',
    peso_envase_tara_gramos NUMERIC(10,2) DEFAULT 0,
    peso_neto_total_gramos NUMERIC(10,2) DEFAULT 0,
    factor_densidad NUMERIC(10,4) DEFAULT 1.0,
    merma_tolerancia_porcentaje NUMERIC(5,2) DEFAULT 5.0,
    pao_meses INTEGER,
    requiere_refrigeracion BOOLEAN DEFAULT false,
    atributos_ecosistema JSONB DEFAULT '{}'::jsonb,
    numero_serie TEXT,
    mac_address TEXT,
    bluetooth_uuid TEXT,
    ip_address TEXT,
    protocolo_comunicacion TEXT,
    estacion_asignada TEXT,
    estado_operativo TEXT DEFAULT 'OPERATIVO',
    vida_util_meses_base INTEGER,
    meses_extension_reparacion INTEGER DEFAULT 0,
    fecha_adquisicion DATE,
    valor_residual_estimado NUMERIC(10,2),
    frecuencia_mantenimiento_dias INTEGER,
    fecha_ultimo_mantenimiento DATE,
    historial_reparaciones_partes JSONB DEFAULT '[]'::jsonb,
    es_equipo_dispositivo BOOLEAN DEFAULT false,
    es_mueble BOOLEAN DEFAULT false,
    es_maquina BOOLEAN DEFAULT false,
    codigo_patrimonial_tag TEXT,
    tipo_mueble TEXT,
    capacidad_carga_kg NUMERIC(10,2),
    grados_reclinacion NUMERIC(5,1),
    material_tapiz TEXT,
    tipo_maquina TEXT,
    potencia_watts NUMERIC(10,2),
    voltaje_operacion TEXT,
    horas_uso_acumuladas NUMERIC(10,2) DEFAULT 0,
    horas_vida_util_maxima NUMERIC(10,2),
    frecuencia_overhaul_horas NUMERIC(10,2),
    temperatura_maxima_c NUMERIC(5,1),
    presion_maxima_bar NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA OATC
CREATE TABLE IF NOT EXISTS public.oatc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nombre TEXT NOT NULL,
    agente_id UUID REFERENCES public.agentes(id),
    agente_nombre TEXT,
    ubicacion_id UUID REFERENCES public.ubicaciones(id),
    punto_partida JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado_proceso TEXT DEFAULT 'ESPERA',
    hora_inicio_atencion TIMESTAMP WITH TIME ZONE,
    hora_fin_atencion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA CITAS
CREATE TABLE IF NOT EXISTS public.citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado TEXT DEFAULT 'Programado',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLA FACTURAS (LEGACY/HISTÓRICO)
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    oatc_id UUID REFERENCES public.oatc(id),
    cliente_nombre TEXT NOT NULL,
    monto_total NUMERIC(10,2) NOT NULL,
    metodo_pago TEXT NOT NULL,
    numero_comprobante TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLA PEDIDOS_INSUMOS
CREATE TABLE IF NOT EXISTS public.pedidos_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    agente_id UUID REFERENCES public.agentes(id),
    agente_nombre TEXT NOT NULL,
    insumo_solicitado TEXT NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABLAS WMS & LABORATORIO
CREATE TABLE IF NOT EXISTS public.almacen_principal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    bien_id UUID NOT NULL REFERENCES public.bienes(id),
    proveedor TEXT,
    marca TEXT,
    linea TEXT,
    presentacion TEXT,
    stock NUMERIC DEFAULT 0,
    stock_minimo NUMERIC DEFAULT 5,
    costo_unitario NUMERIC DEFAULT 0,
    ubicacion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.almacen_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    bien_id UUID NOT NULL REFERENCES public.bienes(id),
    stock_actual NUMERIC DEFAULT 0,
    stock_en_uso NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    oatc_id UUID REFERENCES public.oatc(id),
    agente_id UUID REFERENCES public.agentes(id),
    agente_nombre TEXT,
    cliente_nombre TEXT,
    formula_solicitada JSONB DEFAULT '[]'::jsonb,
    estado TEXT DEFAULT 'SOLICITADO',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    despachado_at TIMESTAMPTZ,
    despachado_por UUID REFERENCES public.agentes(id)
);

CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    bien_id UUID NOT NULL REFERENCES public.bienes(id),
    tipo_movimiento TEXT NOT NULL,
    cantidad NUMERIC NOT NULL,
    origen TEXT,
    destino TEXT,
    usuario_id UUID REFERENCES public.agentes(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABLAS CAJA, EMISORES, COMPROBANTES Y PAGOS
CREATE TABLE IF NOT EXISTS public.emisores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruc VARCHAR(11) NOT NULL UNIQUE,
    razon_social TEXT NOT NULL,
    direccion_fiscal TEXT,
    ubigeo VARCHAR(6),
    urbanizacion TEXT,
    departamento TEXT,
    provincia TEXT,
    distrito TEXT,
    modo VARCHAR(10) DEFAULT 'BETA',
    usuario_sol VARCHAR(50),
    clave_sol VARCHAR(50),
    certificado_pfx_b64 TEXT,
    password_pfx TEXT,
    token_api_sunat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emisores_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emisor_id UUID REFERENCES public.emisores(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(2) NOT NULL,
    serie VARCHAR(4) NOT NULL,
    ultimo_correlativo INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(emisor_id, tipo_documento, serie)
);

CREATE TABLE IF NOT EXISTS public.emisores_sedes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    emisor_id UUID NOT NULL REFERENCES public.emisores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sede_id, emisor_id)
);

CREATE TABLE IF NOT EXISTS public.caja_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    cajero_id UUID NOT NULL REFERENCES public.agentes(id),
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    monto_apertura_efectivo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    monto_cierre_efectivo_sistema NUMERIC(10,2) DEFAULT 0.00,
    monto_cierre_efectivo_declarado NUMERIC(10,2) DEFAULT 0.00,
    monto_cierre_digital_sistema NUMERIC(10,2) DEFAULT 0.00,
    monto_cierre_digital_declarado NUMERIC(10,2) DEFAULT 0.00,
    diferencia_efectivo NUMERIC(10,2) DEFAULT 0.00,
    diferencia_digital NUMERIC(10,2) DEFAULT 0.00,
    estado TEXT NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA', 'AUDITADA')),
    observaciones_cierre TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.caja_movimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_sesion_id UUID NOT NULL REFERENCES public.caja_sesiones(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
    monto NUMERIC(10,2) NOT NULL,
    medio_pago TEXT NOT NULL CHECK (medio_pago IN ('EFECTIVO', 'DIGITAL', 'OTRO')),
    motivo TEXT NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.agentes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comprobantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    emisor_id UUID REFERENCES public.emisores(id),
    tipo_documento VARCHAR(2) NOT NULL,
    serie VARCHAR(4) NOT NULL,
    correlativo INTEGER NOT NULL,
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),
    cliente_tipo_doc VARCHAR(1),
    cliente_num_doc VARCHAR(15),
    cliente_denominacion TEXT,
    cliente_direccion TEXT,
    moneda VARCHAR(3) DEFAULT 'PEN',
    porcentaje_igv NUMERIC(5,2) DEFAULT 18.00,
    total_gravada NUMERIC(12,2) DEFAULT 0.00,
    total_inafecta NUMERIC(12,2) DEFAULT 0.00,
    total_exonerada NUMERIC(12,2) DEFAULT 0.00,
    total_igv NUMERIC(12,2) DEFAULT 0.00,
    total_venta NUMERIC(12,2) NOT NULL,
    items JSONB NOT NULL,
    hash_cpe TEXT,
    qr_cadena TEXT,
    sunat_estado VARCHAR(20) DEFAULT 'PENDIENTE',
    sunat_respuesta_codigo VARCHAR(10),
    sunat_respuesta_descripcion TEXT,
    sunat_cdr_xml TEXT,
    enlace_pdf TEXT,
    enlace_xml TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(emisor_id, tipo_documento, serie, correlativo)
);

CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprobante_id UUID REFERENCES public.comprobantes(id) ON DELETE CASCADE,
    medio_pago VARCHAR(20) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    referencia VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tablas de Caja Operativa complementarias
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    cajero_id UUID REFERENCES public.agentes(id),
    cajero_nombre TEXT NOT NULL DEFAULT 'Cajero POS',
    monto_apertura NUMERIC(10,2) DEFAULT 0.00,
    monto_cierre_real NUMERIC(10,2),
    monto_cierre_teorico NUMERIC(10,2),
    varianza NUMERIC(10,2),
    estado TEXT DEFAULT 'ABIERTA',
    notas_apertura TEXT,
    notas_cierre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE SEQUENCE IF NOT EXISTS public.comprobantes_pago_numero_seq START 1;

CREATE TABLE IF NOT EXISTS public.comprobantes_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    sesion_caja_id UUID REFERENCES public.sesiones_caja(id),
    tipo_comprobante TEXT NOT NULL DEFAULT 'BOLETA',
    serie TEXT NOT NULL DEFAULT 'B001',
    numero INTEGER NOT NULL DEFAULT nextval('public.comprobantes_pago_numero_seq'),
    cliente_id UUID REFERENCES public.clientes(id),
    cliente_nombre TEXT NOT NULL DEFAULT 'Cliente General',
    cliente_doc TEXT,
    tipo_doc TEXT DEFAULT 'DNI',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igv NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    descuento_total NUMERIC(12,2) DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    pagos JSONB NOT NULL DEFAULT '[]'::jsonb,
    oatc_ids UUID[] DEFAULT ARRAY[]::UUID[],
    cajero_nombre TEXT NOT NULL DEFAULT 'Cajero POS',
    estado TEXT DEFAULT 'EMITIDO',
    correlativo INTEGER,
    fecha_emision TIMESTAMPTZ DEFAULT NOW(),
    metadata_fiscal JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_caja_id UUID REFERENCES public.sesiones_caja(id),
    comprobante_id UUID REFERENCES public.comprobantes_pago(id),
    tipo_movimiento TEXT NOT NULL,
    metodo_pago TEXT NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TABLA AGENTES_COMISIONES
CREATE TABLE IF NOT EXISTS public.agentes_comisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    oatc_id UUID REFERENCES public.oatc(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES public.bienes(id) ON DELETE SET NULL,
    monto_servicio NUMERIC(10,2) NOT NULL,
    porcentaje_comision NUMERIC(5,2) NOT NULL,
    monto_comision NUMERIC(10,2) NOT NULL,
    fecha_atencion TIMESTAMPTZ DEFAULT NOW(),
    estado TEXT DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABLAS WFM & PETICIONES
CREATE TABLE IF NOT EXISTS public.config_peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    penaliza_cola BOOLEAN DEFAULT false,
    color TEXT DEFAULT 'bg-blue-100 text-blue-700',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cola_peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.agentes(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE,
    tipo_id UUID REFERENCES public.config_peticiones(id) ON DELETE CASCADE,
    estado TEXT DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.agentes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.asistencias_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hora_salida TIMESTAMPTZ,
    estado TEXT NOT NULL DEFAULT 'EN_TURNO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. TABLAS PERMISOS & CONFIG
CREATE TABLE IF NOT EXISTS public.config_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rol_key TEXT NOT NULL UNIQUE,
    nombre_mostrado TEXT NOT NULL,
    color_badge TEXT DEFAULT 'bg-gray-100 text-gray-700',
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agente_herramientas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    herramienta_key TEXT NOT NULL,
    otorgado_por UUID REFERENCES public.agentes(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agente_id, herramienta_key)
);

CREATE TABLE IF NOT EXISTS public.sedes_fiscal_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE UNIQUE,
    ruc_titular VARCHAR(11),
    razon_social_titular TEXT,
    direccion_titular TEXT,
    modo_fiscal VARCHAR(10) DEFAULT 'BETA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. TABLAS LOGS & GAMIFICATION
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    detalles JSONB,
    usuario_email TEXT,
    sede_id UUID REFERENCES public.sedes(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alertas_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID REFERENCES public.agentes(id),
    sede_id UUID REFERENCES public.sedes(id),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    tipo TEXT DEFAULT 'INFO',
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gamification_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE UNIQUE,
    puntos_totales INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    racha_dias INTEGER DEFAULT 0,
    insignias JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gamification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    tipo_evento TEXT NOT NULL,
    puntos INTEGER NOT NULL DEFAULT 0,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rewards_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    costo_puntos INTEGER NOT NULL,
    stock INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rewards_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agente_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards_catalog(id) ON DELETE CASCADE,
    puntos_canjeados INTEGER NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emisor_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    receptor_id UUID NOT NULL REFERENCES public.agentes(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. HARDWARE & PERIFÉRICOS & INCIDENCIAS
CREATE TABLE IF NOT EXISTS public.proximidad_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID REFERENCES public.sedes(id),
    agente_id UUID REFERENCES public.agentes(id),
    tipo_evento TEXT NOT NULL,
    distancia_metros NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.impresiones_cola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    formato TEXT NOT NULL,
    contenido_escpos TEXT,
    raw_payload JSONB,
    estado TEXT DEFAULT 'PENDIENTE',
    intentos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incidencias_operativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id UUID NOT NULL REFERENCES public.sedes(id),
    reportado_por_id UUID NOT NULL REFERENCES public.agentes(id),
    oatc_id UUID REFERENCES public.oatc(id) ON DELETE SET NULL,
    bien_id UUID REFERENCES public.bienes(id) ON DELETE SET NULL,
    area_afectada TEXT NOT NULL,
    severidad TEXT NOT NULL DEFAULT 'MEDIA',
    tipo_incidencia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ABIERTA',
    resolucion_nota TEXT,
    resuelto_por_id UUID REFERENCES public.agentes(id) ON DELETE SET NULL,
    resuelto_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. CRM Y TICKETS ADICIONALES
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    sede_id UUID REFERENCES public.sedes(id),
    agente_preferido_id UUID REFERENCES public.agentes(id),
    etapa TEXT DEFAULT 'NUEVO',
    canal_adquisicion TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.oatc_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oatc_id UUID NOT NULL REFERENCES public.oatc(id) ON DELETE CASCADE,
    codigo_ticket VARCHAR(20) NOT NULL,
    adelanto_monto NUMERIC(10,2) DEFAULT 0.00,
    adelanto_medio_pago TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. DRIVE CUENTAS Y ARCHIVOS
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
    espacio_total_bytes BIGINT DEFAULT 107374182400,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Realtime para tablas principales
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.oatc, public.cola_peticiones, public.lab_pedidos, public.incidencias_operativas;
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;
