-- SCRIPT DE CREACIÓN DE USUARIOS DE PRUEBA (SANDBOX)
-- Contraseña para todos: Gonzales2026

DO $$
DECLARE
    sandbox_id UUID;
    
    -- Variables para almacenar los IDs generados
    id_op1 UUID := gen_random_uuid();
    id_op2 UUID := gen_random_uuid();
    id_op3 UUID := gen_random_uuid();
    id_rec UUID := gen_random_uuid();
    id_caj UUID := gen_random_uuid();
    id_des UUID := gen_random_uuid();
    id_wfm UUID := gen_random_uuid();
    id_adm UUID := gen_random_uuid();
    
BEGIN
    -- 1. Obtener el ID de la "Unidad de Prueba"
    SELECT id INTO sandbox_id FROM sedes WHERE nombre ILIKE '%Prueba%' LIMIT 1;
    
    IF sandbox_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró la sede de Prueba. Por favor ejecuta el script de la Fase 7 primero.';
    END IF;

    -- 2. INSERTAR EN SUPABASE AUTH (Para que puedan hacer Login con contraseña 'Gonzales2026')
    -- Nota: Usamos crypt y gen_salt para encriptar la contraseña de forma segura
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
    (id_op1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operario1@prueba.com', crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_op2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operario2@prueba.com', crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_op3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'operario3@prueba.com', crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_rec, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'recepcion@prueba.com', crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_caj, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'caja@prueba.com',      crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_des, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'despacho@prueba.com',  crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_wfm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wfm@prueba.com',       crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW()),
    (id_adm, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@prueba.com',     crypt('Gonzales2026', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Añadimos las identidades (Requisito de Supabase Auth reciente)
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES
    (gen_random_uuid(), id_op1, format('{"sub":"%s","email":"%s"}', id_op1::text, 'operario1@prueba.com')::jsonb, 'email', id_op1::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_op2, format('{"sub":"%s","email":"%s"}', id_op2::text, 'operario2@prueba.com')::jsonb, 'email', id_op2::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_op3, format('{"sub":"%s","email":"%s"}', id_op3::text, 'operario3@prueba.com')::jsonb, 'email', id_op3::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_rec, format('{"sub":"%s","email":"%s"}', id_rec::text, 'recepcion@prueba.com')::jsonb, 'email', id_rec::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_caj, format('{"sub":"%s","email":"%s"}', id_caj::text, 'caja@prueba.com')::jsonb, 'email', id_caj::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_des, format('{"sub":"%s","email":"%s"}', id_des::text, 'despacho@prueba.com')::jsonb, 'email', id_des::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_wfm, format('{"sub":"%s","email":"%s"}', id_wfm::text, 'wfm@prueba.com')::jsonb, 'email', id_wfm::text, NOW(), NOW(), NOW()),
    (gen_random_uuid(), id_adm, format('{"sub":"%s","email":"%s"}', id_adm::text, 'admin@prueba.com')::jsonb, 'email', id_adm::text, NOW(), NOW(), NOW())
    ON CONFLICT DO NOTHING;

    -- 3. INSERTAR EN LA TABLA DEL ERP (agentes)
    -- Reciclamos el mismo ID de auth para mantener la consistencia
    INSERT INTO public.agentes (id, nombre, email, rol, estado)
    VALUES 
    (id_op1, 'Estilista Prueba 1', 'operario1@prueba.com', 'STAFF', 'DISPONIBLE'),
    (id_op2, 'Estilista Prueba 2', 'operario2@prueba.com', 'STAFF', 'DISPONIBLE'),
    (id_op3, 'Estilista Prueba 3', 'operario3@prueba.com', 'STAFF', 'DISPONIBLE'),
    (id_rec, 'Recepcionista Prueba', 'recepcion@prueba.com', 'RECEPCION', 'DISPONIBLE'),
    (id_caj, 'Cajero Prueba', 'caja@prueba.com', 'ADMIN', 'DISPONIBLE'),
    (id_des, 'Laboratorio Prueba', 'despacho@prueba.com', 'ADMIN', 'DISPONIBLE'),
    (id_wfm, 'Supervisor WFM Prueba', 'wfm@prueba.com', 'ADMIN', 'DISPONIBLE'),
    (id_adm, 'Gerente Sandbox', 'admin@prueba.com', 'ADMIN', 'DISPONIBLE')
    ON CONFLICT (id) DO NOTHING;

    -- 4. ASIGNARLOS EXCLUSIVAMENTE AL SANDBOX (sedes_usuarios)
    INSERT INTO public.sedes_usuarios (agente_id, sede_id)
    VALUES 
    (id_op1, sandbox_id),
    (id_op2, sandbox_id),
    (id_op3, sandbox_id),
    (id_rec, sandbox_id),
    (id_caj, sandbox_id),
    (id_des, sandbox_id),
    (id_wfm, sandbox_id),
    (id_adm, sandbox_id)
    ON CONFLICT DO NOTHING;

END $$;
