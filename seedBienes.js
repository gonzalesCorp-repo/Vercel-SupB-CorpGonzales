const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SERVICIOS_SEED = [
  { nombre: 'Corte Clásico & Peinado', categoria: 'Cabello', tipo_bien: 'servicio', es_servicio: true, precio_venta: 45.00 },
  { nombre: 'Corte Fade / Degradado Urbano', categoria: 'Cabello', tipo_bien: 'servicio', es_servicio: true, precio_venta: 50.00 },
  { nombre: 'Balayage Premium & Matizado', categoria: 'Coloración', tipo_bien: 'servicio', es_servicio: true, precio_venta: 280.00 },
  { nombre: 'Tinte Completo & Baño de Brillo', categoria: 'Coloración', tipo_bien: 'servicio', es_servicio: true, precio_venta: 160.00 },
  { nombre: 'Tratamiento de Keratina Brasileña', categoria: 'Tratamientos', tipo_bien: 'servicio', es_servicio: true, precio_venta: 220.00 },
  { nombre: 'Hidratación Profunda con Ácido Hialurónico', categoria: 'Tratamientos', tipo_bien: 'servicio', es_servicio: true, precio_venta: 95.00 },
  { nombre: 'Limpieza Facial Profunda & Microdermoabrasión', categoria: 'Cosmiatría', tipo_bien: 'servicio', es_servicio: true, precio_venta: 120.00 },
  { nombre: 'Manicure Ruso & Esmaltado Gel', categoria: 'Uñas & Spa', tipo_bien: 'servicio', es_servicio: true, precio_venta: 65.00 },
  { nombre: 'Pedicure Spa con Sales Exfoliantes', categoria: 'Uñas & Spa', tipo_bien: 'servicio', es_servicio: true, precio_venta: 75.00 }
];

const PRODUCTOS_SEED = [
  { nombre: 'Shampoo Nutritivo Post-Color 500ml', categoria: 'Cuidado Capilar', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 78.00, atributos_producto: { marca: 'L’Oréal Professionnel', linea: 'Vitamino Color', presentacion: '500ml' } },
  { nombre: 'Acondicionador Reconstructor 500ml', categoria: 'Cuidado Capilar', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 82.00, atributos_producto: { marca: 'Kérastase', linea: 'Resistance', presentacion: '500ml' } },
  { nombre: 'Mascarilla Reparación Molecular 250g', categoria: 'Cuidado Capilar', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 115.00, atributos_producto: { marca: 'K18', linea: 'Molecular Repair', presentacion: '250g' } },
  { nombre: 'Serum Protector Térmico & Brillo 100ml', categoria: 'Acabados', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 65.00, atributos_producto: { marca: 'Moroccanoil', linea: 'Treatment Oil', presentacion: '100ml' } },
  { nombre: 'Aceite de Argán Puro Orgánico 50ml', categoria: 'Acabados', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 55.00, atributos_producto: { marca: 'Wella', linea: 'Oil Reflections', presentacion: '50ml' } },
  { nombre: 'Protector Solar Facial Matificante SPF50+', categoria: 'Skin Care', tipo_bien: 'producto', es_producto_venta: true, precio_venta: 92.00, atributos_producto: { marca: 'La Roche-Posay', linea: 'Anthelios', presentacion: '50ml' } }
];

async function seed() {
  console.log('Insertando catálogo de Servicios...');
  const { data: servData, error: servError } = await supabase
    .from('bienes')
    .insert(SERVICIOS_SEED)
    .select();
  console.log('Servicios insertados:', servData?.length, servError);

  console.log('Insertando catálogo de Productos...');
  const { data: prodData, error: prodError } = await supabase
    .from('bienes')
    .insert(PRODUCTOS_SEED)
    .select();
  console.log('Productos insertados:', prodData?.length, prodError);
}

seed();
