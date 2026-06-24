-- SCRIPT PARA LIMPIAR LOS USUARIOS ROTOS Y VOLVER A ASIGNARLOS
-- Ejecuta esto en Supabase SQL Editor

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
    
    id_op1 UUID;
    id_op2 UUID;
    id_op3 UUID;
    id_rec UUID;
    id_caj UUID;
    id_des UUID;
    id_wfm UUID;
    id_adm UUID;

BEGIN
    -- 1. Obtener el ID del Sandbox
    SELECT id INTO sandbox_id FROM sedes WHERE nombre ILIKE '%Prueba%' LIMIT 1;
    
    -- 2. Limpiar los usuarios creados por SQL directo (esto arregla el error 500)
    DELETE FROM auth.users WHERE email IN (correo_op1, correo_op2, correo_op3, correo_rec, correo_caj, correo_des, correo_wfm, correo_adm);
    DELETE FROM public.agentes WHERE email IN (correo_op1, correo_op2, correo_op3, correo_rec, correo_caj, correo_des, correo_wfm, correo_adm);

    -- EN ESTE PUNTO DEBES IR A: Authentication -> Users -> Add User -> Create new user
    -- Y crearlos manualmente en la interfaz de Supabase con la contraseña Gonzales2026.
    -- Una vez creados, vuelve a ejecutar la parte de abajo de este script (puedes borrar la parte de arriba del DELETE).

    -- (Simulamos que ya los creaste en la UI y buscamos sus IDs correctos)
    SELECT id INTO id_op1 FROM auth.users WHERE email = correo_op1;
    SELECT id INTO id_op2 FROM auth.users WHERE email = correo_op2;
    SELECT id INTO id_op3 FROM auth.users WHERE email = correo_op3;
    SELECT id INTO id_rec FROM auth.users WHERE email = correo_rec;
    SELECT id INTO id_caj FROM auth.users WHERE email = correo_caj;
    SELECT id INTO id_des FROM auth.users WHERE email = correo_des;
    SELECT id INTO id_wfm FROM auth.users WHERE email = correo_wfm;
    SELECT id INTO id_adm FROM auth.users WHERE email = correo_adm;

    -- Solo insertamos si realmente los encontraste (es decir, ya los creaste en la UI)
    IF id_op1 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op1, 'Estilista Prueba 1', correo_op1, 'STAFF', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op1, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF id_op2 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op2, 'Estilista Prueba 2', correo_op2, 'STAFF', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op2, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_op3 IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_op3, 'Estilista Prueba 3', correo_op3, 'STAFF', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_op3, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_rec IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_rec, 'Recepcionista Prueba', correo_rec, 'RECEPCION', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_rec, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_caj IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_caj, 'Cajero Prueba', correo_caj, 'ADMIN', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_caj, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_des IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_des, 'Laboratorio Prueba', correo_des, 'ADMIN', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_des, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_wfm IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_wfm, 'Supervisor WFM Prueba', correo_wfm, 'ADMIN', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_wfm, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

    IF id_adm IS NOT NULL THEN
        INSERT INTO public.agentes (id, nombre, email, rol, estado) VALUES (id_adm, 'Gerente Sandbox', correo_adm, 'ADMIN', 'DISPONIBLE') ON CONFLICT DO NOTHING;
        INSERT INTO public.sedes_usuarios (agente_id, sede_id) VALUES (id_adm, sandbox_id) ON CONFLICT DO NOTHING;
    END IF;

END $$;
