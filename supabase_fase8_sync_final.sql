-- SCRIPT DEFINITIVO DE SINCRONIZACIÓN DE ROLES Y SEDES (FASE 8)
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
    sandbox_id UUID;
    
    -- Los correos que vamos a configurar
    correo_op1 TEXT := 'operario1@prueba.com';
    correo_op2 TEXT := 'operario2@prueba.com';
    correo_op3 TEXT := 'operario3@prueba.com';
    correo_rec TEXT := 'recepcion@prueba.com';
    correo_caj TEXT := 'caja@prueba.com';
    correo_des TEXT := 'despacho@prueba.com';
    correo_wfm TEXT := 'wfm@prueba.com';
    correo_adm TEXT := 'admin@prueba.com';
    correo_ven TEXT := 'ventas@prueba.com';
    
    id_op1 UUID;
    id_op2 UUID;
    id_op3 UUID;
    id_rec UUID;
    id_caj UUID;
    id_des UUID;
    id_wfm UUID;
    id_adm UUID;
    id_ven UUID;

BEGIN
    -- 0. Eliminar la restricción (CHECK constraint) del rol para permitir múltiples roles separados por comas
    ALTER TABLE public.agentes DROP CONSTRAINT IF EXISTS agentes_rol_check;

    -- 1. Obtener el ID del Sandbox
    SELECT id INTO sandbox_id FROM sedes WHERE nombre ILIKE '%Prueba%' LIMIT 1;
    
    -- Si no existe la sede de prueba, no podemos hacer mucho
    IF sandbox_id IS NULL THEN
        RAISE NOTICE 'No se encontro la sede de Prueba';
        RETURN;
    END IF;

    -- 2. Buscamos los IDs de los usuarios que creaste manualmente en Authentication
    SELECT id INTO id_op1 FROM auth.users WHERE email = correo_op1;
    SELECT id INTO id_op2 FROM auth.users WHERE email = correo_op2;
    SELECT id INTO id_op3 FROM auth.users WHERE email = correo_op3;
    SELECT id INTO id_rec FROM auth.users WHERE email = correo_rec;
    SELECT id INTO id_caj FROM auth.users WHERE email = correo_caj;
    SELECT id INTO id_des FROM auth.users WHERE email = correo_des;
    SELECT id INTO id_wfm FROM auth.users WHERE email = correo_wfm;
    SELECT id INTO id_adm FROM auth.users WHERE email = correo_adm;
    SELECT id INTO id_ven FROM auth.users WHERE email = correo_ven;

    -- 3. Insertamos o actualizamos en la tabla 'agentes' (El ERP real)
    IF id_op1 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op1, 'Estilista Prueba 1', correo_op1, 'STAFF', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'STAFF';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op1, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF id_op2 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op2, 'Estilista Prueba 2', correo_op2, 'STAFF', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'STAFF';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op2, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_op3 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op3, 'Estilista Prueba 3', correo_op3, 'STAFF', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'STAFF';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op3, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_rec IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_rec, 'Recepcionista Prueba', correo_rec, 'RECEPCION,WFM', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'RECEPCION,WFM';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_rec, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_caj IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_caj, 'Cajero Prueba', correo_caj, 'CAJA', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'CAJA';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_caj, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_des IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_des, 'Laboratorio Prueba', correo_des, 'DESPACHO', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'DESPACHO';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_des, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_wfm IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_wfm, 'Supervisor WFM Prueba', correo_wfm, 'ADMIN', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'ADMIN';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_wfm, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_adm IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_adm, 'Gerente Sandbox', correo_adm, 'SUPERADMIN', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'SUPERADMIN';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_adm, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_ven IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_ven, 'Vendedor Retail', correo_ven, 'VENTAS', 'DISPONIBLE') ON CONFLICT (id) DO UPDATE SET rol = 'VENTAS';
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_ven, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

END $$;
