-- ==============================================================================
-- MIGRACIÓN CANÓNICA: Saneamiento Estructural del Catálogo de Bienes
-- Fecha: 2026-09-17
-- Objetivos:
--   1. Normalización de 3 niveles: Categorías, Líneas y Moldes Base
--   2. Saneamiento de márgenes comerciales y eliminación de precios dummy (S/ 110)
--   3. Configuración de metrología (tara, peso neto) para balanza IoT de laboratorio
--   4. Estandarización de recetas técnicas y tiempos para los 44 servicios
-- ==============================================================================

-- 1. ASEGURAR CATEGORÍAS RAÍZ (DIVISIONES)
INSERT INTO public.categorias_bienes (id, nombre, tipo_bien, icono, color, orden) VALUES
('7ca6ceaa-b52e-4daa-b491-fc4728ecc54d', 'Barbería Masculina', 'servicio', 'Scissors', '#3b82f6', 1),
('c2e2d284-af9c-44b4-8e4b-b0bc40f426b7', 'Colorimetría & Mechas', 'servicio', 'Sparkles', '#ec4899', 2),
('72ca5145-1ce1-4808-a4d9-f06a8c0e83c7', 'Cortes & Peinados', 'servicio', 'Scissors', '#8b5cf6', 3),
('d52d43f5-783c-4f69-8f46-91b750ebb209', 'Cosmiatría & Piel', 'servicio', 'Sparkles', '#10b981', 4),
('0e726085-bf3c-44f0-8a2f-6f3322ac12af', 'Estilismo & Capilar', 'servicio', 'Sparkles', '#f59e0b', 5),
('735e96bd-d1d9-4c28-9710-3ef0931a2a94', 'Maquillaje & Cosmetología', 'servicio', 'Sparkles', '#f43f5e', 6),
('ac0ec159-ae70-4b54-be7a-976a0ce8d677', 'Ritual de Barba & Fade', 'servicio', 'Scissors', '#6366f1', 7),
('7e05f6ed-68db-4b23-b18d-af8a5aedbacb', 'Tratamientos & Alisados', 'servicio', 'Sparkles', '#06b6d4', 8),
('6cfb4b7a-539d-4951-a867-7a7d504f48db', 'Uñas Gel & Manicura', 'servicio', 'Sparkles', '#d946ef', 9),
('ea942188-2231-4c61-8713-7e303762f959', 'Venta Retail', 'producto', 'Package', '#14b8a6', 10)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo_bien = EXCLUDED.tipo_bien,
  icono = EXCLUDED.icono,
  color = EXCLUDED.color,
  orden = EXCLUDED.orden;

-- 2. ASEGURAR LÍNEAS DE PRODUCTOS RETAIL (NIVEL 2)
INSERT INTO public.categorias_bienes (id, nombre, tipo_bien, division_padre_id, icono, color, orden) VALUES
('e1000000-0001-4000-8000-000000000001', 'Kérastase Paris', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#d97706', 1),
('e1000000-0002-4000-8000-000000000002', 'L’Oréal Professionnel', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#2563eb', 2),
('e1000000-0003-4000-8000-000000000003', 'Redken 5th Ave', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#4f46e5', 3),
('e1000000-0004-4000-8000-000000000004', 'Sebastian Professional', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#111827', 4),
('e1000000-0005-4000-8000-000000000005', 'OPI Nail Care', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#be185d', 5),
('e1000000-0006-4000-8000-000000000006', 'Moroccanoil', 'producto', 'ea942188-2231-4c61-8713-7e303762f959', 'Award', '#0284c7', 6)
ON CONFLICT (id) DO NOTHING;

-- 3. ASEGURAR MODELOS BASE DE BIENES
INSERT INTO public.modelos_bienes (id, nombre, tipo_naturaleza, categoria_default, descripcion) VALUES
('a4b713d9-fc97-4f72-9bf9-74b4c5b5a86b', 'Balanza Digital de Precisión IoT (Bluetooth BLE / USB)', 'EQUIPO_DISPOSITIVO', 'Laboratorio', 'Balanza inteligente de pesaje para formulaciones de taller'),
('9c7f8deb-39b0-48fe-9ebd-147e7aa1cb55', 'Lector / Token NFC Control de Asistencia & Staff', 'EQUIPO_DISPOSITIVO', 'Acceso', 'Dispositivo de autenticación y marcado rápido'),
('b77acdd7-c0e9-447e-91c6-b1928d4d55c9', 'Plancha Térmica de Titanio / Nanotecnología', 'EQUIPO_DISPOSITIVO', 'Styling', 'Herramienta de calor controlada digitalmente'),
('2b43f70f-eafb-4a52-9c0e-d18a68fd2938', 'Secadora Profesional de Alto Rendimiento', 'EQUIPO_DISPOSITIVO', 'Styling', 'Motor brushless con generador iónico'),
('31c055ac-6678-48c6-a643-56e96d444caf', 'Terminal POS de Cobro Bancario', 'EQUIPO_DISPOSITIVO', 'Caja', 'Pasarela física de cobro con tarjeta'),
('e60adc18-daa3-4b86-af65-aa7c57802e86', 'Oxidante / Revelador en Crema (Botella 1L)', 'INSUMO', 'Coloración', 'Envase técnico de 1000ml para mezcla química'),
('c84016ab-77f6-4360-822a-6184e6e8bf2a', 'Plex / Aditivo Protector de Enlaces (500ml)', 'INSUMO', 'Tratamientos', 'Protector capilar de enlaces disulfuro'),
('6cf169c8-972c-4a71-a75a-082a53f03e45', 'Polvo Decolorante / Bleach (Pote)', 'INSUMO', 'Coloración', 'Polvo compacto aclarante hasta 9 tonos'),
('313f853a-3001-44fe-9b09-acc8c43b30cf', 'Shampoo / Acondicionador Técnico Lavacabezas (Backbar 5L)', 'INSUMO', 'Lavacabezas', 'Bidón de 5000ml para backbar'),
('d9eb6342-6a8a-4aad-9f91-459e678f3181', 'Tinte Capilar Permanente en Crema (Tubo)', 'INSUMO', 'Coloración', 'Tubo estándar de 60g para formulación'),
('9b2e9f36-ce77-4f3c-87bc-4d40227cd977', 'Cuidado de Uñas & Manos Retail', 'PRODUCTO', 'Manicura', 'Productos de esmaltado y cuidado en casa'),
('0fd67b9a-3b86-42b2-93bc-bc7b764a7227', 'Protector Térmico & Spray Styling', 'PRODUCTO', 'Styling', 'Termoprotectores y lacas de peinado'),
('e56e8b86-c468-452c-9559-99d55b6a168d', 'Serum / Óleo Capilar & Acabado', 'PRODUCTO', 'Tratamientos', 'Aceites nutritivos y serums reparadores'),
('89e4d5aa-3e23-406e-ac7f-a20caa802cb7', 'Shampoo & Acondicionador Retail', 'PRODUCTO', 'Cuidado Capilar', 'Frascos de 250ml - 500ml para uso diario'),
('8d88875c-f7cc-429f-b200-68bd2579074a', 'Tratamiento / Mascarilla Domiciliaria', 'PRODUCTO', 'Tratamientos', 'Potes de nutrición profunda domiciliaria'),
('9814b621-82be-4919-918a-4f399f119fb3', 'Colorimetría & Mechas (Balayage / Tintura)', 'SERVICIO', 'Coloración', 'Servicio técnico de transformación de color'),
('97b658f2-9678-418f-8dec-ffc4b6625869', 'Corte & Peinado Estilo', 'SERVICIO', 'Estilismo', 'Corte, secado y finalización de autor'),
('7489b9d5-46bc-42c2-b654-53db1c3a8edc', 'Manicura & Pedicura Spa', 'SERVICIO', 'Manicura', 'Cuidado integral de manos y pies'),
('114f85bb-4032-4b9a-85a5-334d238220d9', 'Tratamiento Capilar Profundo (Botox / Keratina)', 'SERVICIO', 'Tratamientos', 'Restauración y disciplina capilar')
ON CONFLICT (id) DO NOTHING;

-- 4. SINCRONIZAR COSTO_BASE DESDE ALMACEN_PRINCIPAL A BIENES
UPDATE public.bienes b
SET costo_base = sub.costo_unitario
FROM (
  SELECT bien_id, MAX(costo_unitario) as costo_unitario 
  FROM public.almacen_principal 
  WHERE costo_unitario > 0 
  GROUP BY bien_id
) sub
WHERE b.id = sub.bien_id AND (b.costo_base IS NULL OR b.costo_base = 0);

-- 5. SANEAMIENTO DE MÁRGENES COMERCIALES EN PRODUCTOS RETAIL
-- Caso A: Productos con costo_base conocido -> aplicar markup 1.70 (margen bruto ~41%)
UPDATE public.bienes
SET precio_venta = ROUND(costo_base * 1.70, 0)
WHERE es_producto_venta = true 
  AND costo_base > 0 
  AND (precio_venta <= costo_base OR precio_venta = 110.00 OR precio_venta IS NULL);

-- Caso B: Productos de marcas premium sin costo unitario registrado
-- Kérastase: PVP estándar S/ 195.00, costo S/ 115.00
UPDATE public.bienes
SET precio_venta = 195.00, costo_base = 115.00
WHERE es_producto_venta = true 
  AND (costo_base IS NULL OR costo_base = 0)
  AND (nombre ILIKE '%kerastase%' OR nombre ILIKE '%bain%' OR nombre ILIKE '%masquintense%' OR nombre ILIKE '%fondant%' OR nombre ILIKE '%elixir%');

-- OPI Nail Care: PVP estándar S/ 49.00, costo S/ 26.00
UPDATE public.bienes
SET precio_venta = 49.00, costo_base = 26.00
WHERE es_producto_venta = true 
  AND (costo_base IS NULL OR costo_base = 0)
  AND (nombre ILIKE '%opi%' OR nombre ILIKE '%esmalte%');

-- Sebastian / L'Oréal Retail: PVP estándar S/ 135.00, costo S/ 78.00
UPDATE public.bienes
SET precio_venta = 135.00, costo_base = 78.00
WHERE es_producto_venta = true 
  AND (costo_base IS NULL OR costo_base = 0)
  AND (nombre ILIKE '%sebastian%' OR nombre ILIKE '%loreal%' OR nombre ILIKE '%infinium%' OR nombre ILIKE '%penetrait%');

-- Resto de Retail con dummy S/ 110: PVP S/ 89.00, costo S/ 50.00
UPDATE public.bienes
SET precio_venta = 89.00, costo_base = 50.00
WHERE es_producto_venta = true 
  AND (precio_venta = 110.00 OR precio_venta IS NULL) 
  AND (costo_base IS NULL OR costo_base = 0);

-- 6. ASOCIAR CATEGORÍA RETAIL Y LÍNEAS
UPDATE public.bienes
SET categoria_id = 'ea942188-2231-4c61-8713-7e303762f959'
WHERE es_producto_venta = true AND categoria_id IS NULL;

UPDATE public.bienes
SET linea_id = 'e1000000-0001-4000-8000-000000000001'
WHERE es_producto_venta = true AND (nombre ILIKE '%kerastase%' OR nombre ILIKE '%bain%');

UPDATE public.bienes
SET linea_id = 'e1000000-0005-4000-8000-000000000005'
WHERE es_producto_venta = true AND (nombre ILIKE '%opi%');

-- 7. METROLOGÍA DE BALANZA IOT PARA INSUMOS DE LABORATORIO
-- A. Tubos de tinte (L'Oréal Richesse, Majirel, Inoa, Shade EQ, etc.)
UPDATE public.bienes
SET peso_envase_tara_gramos = 15.00,
    peso_neto_total_gramos = 60.00,
    unidad_medida = 'g',
    modelo_id = 'd9eb6342-6a8a-4aad-9f91-459e678f3181',
    categoria_id = 'c2e2d284-af9c-44b4-8e4b-b0bc40f426b7'
WHERE es_insumo_taller = true 
  AND (nombre ILIKE '%color%' OR nombre ILIKE '%richesse%' OR nombre ILIKE '%tinte%' OR nombre ILIKE '%shade%');

-- B. Decolorantes / Bleach (Potes)
UPDATE public.bienes
SET peso_envase_tara_gramos = 45.00,
    peso_neto_total_gramos = 500.00,
    unidad_medida = 'g',
    modelo_id = '6cf169c8-972c-4a71-a75a-082a53f03e45',
    categoria_id = 'c2e2d284-af9c-44b4-8e4b-b0bc40f426b7'
WHERE es_insumo_taller = true 
  AND (nombre ILIKE '%bleach%' OR nombre ILIKE '%decolorante%' OR nombre ILIKE '%blondor%' OR nombre ILIKE '%platinium%');

-- C. Oxidantes / Reveladores en Crema (Botellas 1L)
UPDATE public.bienes
SET peso_envase_tara_gramos = 80.00,
    peso_neto_total_gramos = 1000.00,
    unidad_medida = 'ml',
    modelo_id = 'e60adc18-daa3-4b86-af65-aa7c57802e86',
    categoria_id = 'c2e2d284-af9c-44b4-8e4b-b0bc40f426b7'
WHERE es_insumo_taller = true 
  AND (nombre ILIKE '%oxidante%' OR nombre ILIKE '%revelador%' OR nombre ILIKE '%developer%' OR nombre ILIKE '%vol%');

-- D. Shampoos y Acondicionadores de Lavacabezas (Backbar)
UPDATE public.bienes
SET peso_envase_tara_gramos = 250.00,
    peso_neto_total_gramos = 5000.00,
    unidad_medida = 'ml',
    modelo_id = '313f853a-3001-44fe-9b09-acc8c43b30cf',
    categoria_id = '0e726085-bf3c-44f0-8a2f-6f3322ac12af'
WHERE es_insumo_taller = true 
  AND (nombre ILIKE '%shampoo%' OR nombre ILIKE '%acondicionador%' OR nombre ILIKE '%backbar%' OR nombre ILIKE '%lavacabezas%');

-- E. Insumos restantes sin tara configurada
UPDATE public.bienes
SET peso_envase_tara_gramos = 15.00,
    peso_neto_total_gramos = 100.00,
    unidad_medida = COALESCE(unidad_medida, 'g')
WHERE es_insumo_taller = true 
  AND (peso_envase_tara_gramos IS NULL OR peso_envase_tara_gramos = 0);

-- 8. ESTANDARIZACIÓN DE SERVICIOS: RECETAS TÉCNICAS Y TIEMPOS CANÓNICOS
-- Balayage / Mechas Creativas
UPDATE public.bienes
SET duracion_minutos = 180,
    precio_venta = CASE WHEN precio_venta < 150 THEN 260.00 ELSE precio_venta END,
    categoria_id = 'c2e2d284-af9c-44b4-8e4b-b0bc40f426b7',
    modelo_id = '9814b621-82be-4919-918a-4f399f119fb3',
    receta_insumos = '[
      {"insumo_nombre": "Polvo Decolorante Bleach Master", "cantidad_gramos": 60, "unidad": "g"},
      {"insumo_nombre": "Oxidante en Crema 20 Vol", "cantidad_gramos": 90, "unidad": "ml"},
      {"insumo_nombre": "Plex Aditivo Protector Enlaces", "cantidad_gramos": 15, "unidad": "ml"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%balayage%' OR nombre ILIKE '%mechas%');

-- Alisados y Keratina
UPDATE public.bienes
SET duracion_minutos = 150,
    precio_venta = CASE WHEN precio_venta < 100 THEN 220.00 ELSE precio_venta END,
    categoria_id = '7e05f6ed-68db-4b23-b18d-af8a5aedbacb',
    modelo_id = '114f85bb-4032-4b9a-85a5-334d238220d9',
    receta_insumos = '[
      {"insumo_nombre": "Shampoo Técnico Antiresiduos", "cantidad_gramos": 35, "unidad": "ml"},
      {"insumo_nombre": "Tratamiento Alisador Keratina Termoactiva", "cantidad_gramos": 90, "unidad": "g"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%alizado%' OR nombre ILIKE '%alisado%');

-- Botox Capilar y Restauración
UPDATE public.bienes
SET duracion_minutos = 75,
    precio_venta = CASE WHEN precio_venta < 80 THEN 130.00 ELSE precio_venta END,
    categoria_id = '7e05f6ed-68db-4b23-b18d-af8a5aedbacb',
    modelo_id = '114f85bb-4032-4b9a-85a5-334d238220d9',
    receta_insumos = '[
      {"insumo_nombre": "Shampoo Purificante Backbar", "cantidad_gramos": 25, "unidad": "ml"},
      {"insumo_nombre": "Botox Capilar Rellenador Hialurónico", "cantidad_gramos": 50, "unidad": "g"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%botox%' OR nombre ILIKE '%tratamiento%');

-- Coloración Global y Matiz
UPDATE public.bienes
SET duracion_minutos = 90,
    precio_venta = CASE WHEN precio_venta < 80 THEN 140.00 ELSE precio_venta END,
    categoria_id = 'c2e2d284-af9c-44b4-8e4b-b0bc40f426b7',
    modelo_id = '9814b621-82be-4919-918a-4f399f119fb3',
    receta_insumos = '[
      {"insumo_nombre": "Tinte Capilar Permanente en Crema (Tubo)", "cantidad_gramos": 60, "unidad": "g"},
      {"insumo_nombre": "Oxidante en Crema 20 Vol", "cantidad_gramos": 60, "unidad": "ml"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%coloración%' OR nombre ILIKE '%tinte%');

-- Cortes de Cabello & Peinados
UPDATE public.bienes
SET duracion_minutos = 45,
    precio_venta = CASE WHEN precio_venta < 30 THEN 55.00 ELSE precio_venta END,
    categoria_id = '72ca5145-1ce1-4808-a4d9-f06a8c0e83c7',
    modelo_id = '97b658f2-9678-418f-8dec-ffc4b6625869',
    receta_insumos = '[
      {"insumo_nombre": "Shampoo / Acondicionador Backbar", "cantidad_gramos": 25, "unidad": "ml"},
      {"insumo_nombre": "Termoprotector & Acabado", "cantidad_gramos": 5, "unidad": "ml"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%corte%' OR nombre ILIKE '%cepillado%' OR nombre ILIKE '%peinado%');

-- Uñas Acrílicas y Gel
UPDATE public.bienes
SET duracion_minutos = 60,
    precio_venta = CASE WHEN precio_venta < 50 THEN 75.00 ELSE precio_venta END,
    categoria_id = '6cfb4b7a-539d-4951-a867-7d7d504f48db',
    modelo_id = '7489b9d5-46bc-42c2-b654-53db1c3a8edc',
    receta_insumos = '[
      {"insumo_nombre": "Gel Limpiador Sanitizante", "cantidad_gramos": 10, "unidad": "ml"},
      {"insumo_nombre": "Base y Top Coat UV", "cantidad_gramos": 8, "unidad": "ml"},
      {"insumo_nombre": "Esmalte Gel Semipermanente", "cantidad_gramos": 8, "unidad": "ml"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%manicur%' OR nombre ILIKE '%acrílico%' OR nombre ILIKE '%uñas%' OR nombre ILIKE '%gel%');

-- Pedicura Spa
UPDATE public.bienes
SET duracion_minutos = 50,
    precio_venta = CASE WHEN precio_venta < 50 THEN 65.00 ELSE precio_venta END,
    categoria_id = '6cfb4b7a-539d-4951-a867-7d7d504f48db',
    modelo_id = '7489b9d5-46bc-42c2-b654-53db1c3a8edc',
    receta_insumos = '[
      {"insumo_nombre": "Sales Minerales Tina Spa", "cantidad_gramos": 30, "unidad": "g"},
      {"insumo_nombre": "Exfoliante Podológico Granulado", "cantidad_gramos": 25, "unidad": "g"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%pedicur%');

-- Cosmiatría & Facial
UPDATE public.bienes
SET duracion_minutos = 60,
    precio_venta = CASE WHEN precio_venta < 70 THEN 110.00 ELSE precio_venta END,
    categoria_id = 'd52d43f5-783c-4f69-8f46-91b750ebb209',
    receta_insumos = '[
      {"insumo_nombre": "Gel Dermolimpiador Facial", "cantidad_gramos": 15, "unidad": "ml"},
      {"insumo_nombre": "Mascarilla Hidroplástica Facial", "cantidad_gramos": 35, "unidad": "g"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%facial%' OR nombre ILIKE '%limpieza%' OR nombre ILIKE '%hidrafacial%');

-- Barbería & Barba
UPDATE public.bienes
SET duracion_minutos = 35,
    precio_venta = CASE WHEN precio_venta < 30 THEN 40.00 ELSE precio_venta END,
    categoria_id = 'ac0ec159-ae70-4b54-be7a-976a0ce8d677',
    receta_insumos = '[
      {"insumo_nombre": "Gel Transparente de Afeitar", "cantidad_gramos": 15, "unidad": "ml"},
      {"insumo_nombre": "Bálsamo Calmante Aftershave", "cantidad_gramos": 5, "unidad": "ml"}
    ]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%barba%' OR nombre ILIKE '%fade%');

-- Recetas de acabado y cosmética para los 14 servicios restantes
UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Shampoo Aromático Tratante", "cantidad_gramos": 25, "unidad": "ml"},
  {"insumo_nombre": "Aceite Esencial Shiatsu", "cantidad_gramos": 5, "unidad": "ml"},
  {"insumo_nombre": "Mascarilla Relajante Cuero Cabelludo", "cantidad_gramos": 30, "unidad": "g"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%head spa%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Mascarilla Reconstructiva Backbar", "cantidad_gramos": 30, "unidad": "g"},
  {"insumo_nombre": "Ampolla Elixir Nutritiva", "cantidad_gramos": 15, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%rituales%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Protector Térmico en Spray", "cantidad_gramos": 8, "unidad": "ml"},
  {"insumo_nombre": "Serum Sellador de Puntas", "cantidad_gramos": 3, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%planchado%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Cera / Gel Fijador de Control", "cantidad_gramos": 15, "unidad": "g"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%trenzas%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Base de Maquillaje Master", "cantidad_gramos": 10, "unidad": "ml"},
  {"insumo_nombre": "Fijador Facial Hidratante", "cantidad_gramos": 5, "unidad": "ml"},
  {"insumo_nombre": "Polvo Translúcido HD", "cantidad_gramos": 5, "unidad": "g"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%maquillaje%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Aceite Corporal Terapéutico", "cantidad_gramos": 30, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%masajes%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Base Rubber Flexible UV", "cantidad_gramos": 8, "unidad": "ml"},
  {"insumo_nombre": "Solución Sanitizante Alcohol Prep", "cantidad_gramos": 5, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%rubber%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Cera Depilatoria Suave", "cantidad_gramos": 80, "unidad": "g"},
  {"insumo_nombre": "Gel Calmante Post-Depilación", "cantidad_gramos": 15, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%depila%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Solución Antiséptica Podológica", "cantidad_gramos": 20, "unidad": "ml"},
  {"insumo_nombre": "Crema Emoliente Podológica", "cantidad_gramos": 15, "unidad": "g"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%podologia%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Parafina Cosmética Tibia", "cantidad_gramos": 60, "unidad": "g"},
  {"insumo_nombre": "Loción Nutritiva de Seda", "cantidad_gramos": 10, "unidad": "ml"}
]'::jsonb
WHERE es_servicio = true AND nombre ILIKE '%parafina%';

UPDATE public.bienes
SET receta_insumos = '[
  {"insumo_nombre": "Pigmento Especializado Microblading", "cantidad_gramos": 2, "unidad": "ml"},
  {"insumo_nombre": "Crema Anestésica Tópica", "cantidad_gramos": 3, "unidad": "g"},
  {"insumo_nombre": "Bálsamo Cicatrizante Post", "cantidad_gramos": 3, "unidad": "g"}
]'::jsonb
WHERE es_servicio = true AND (nombre ILIKE '%microblading%' OR nombre ILIKE '%microshading%' OR nombre ILIKE '%pigmentación%');
