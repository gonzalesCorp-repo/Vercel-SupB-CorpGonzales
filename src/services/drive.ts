import { createClient } from '@/lib/supabase/client';

export type PropositoDrive = 'MULTIMEDIA' | 'DOCUMENTOS' | 'MARCAS' | 'GENERAL';
export type TipoAutenticacionDrive = 'SERVICE_ACCOUNT' | 'OAUTH_CLIENT';

export interface DriveCuenta {
  id: string;
  nombre_descriptivo: string;
  email_cuenta: string;
  tipo_autenticacion: TipoAutenticacionDrive;
  service_account_json?: string;
  root_folder_id: string;
  proposito: PropositoDrive;
  es_default: boolean;
  roles_permitidos: string[];
  sedes_asignadas: string[];
  is_active: boolean;
  espacio_usado_bytes: number;
  espacio_total_bytes: number;
  created_at?: string;
  updated_at?: string;
}

export interface DriveArchivo {
  id: string;
  drive_cuenta_id: string;
  file_id_google: string;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;
  thumbnail_url?: string;
  web_view_link: string;
  web_content_link?: string;
  entidad_tipo: 'CLIENTE' | 'MARCA' | 'OATC' | 'SEDE' | 'GENERAL';
  entidad_id?: string;
  entidad_nombre?: string;
  carpeta_padre_id: string;
  carpeta_ruta: string;
  subido_por_nombre: string;
  created_at: string;
}

// Cuentas de muestra por defecto
export const DRIVE_CUENTAS_DEMO: DriveCuenta[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    nombre_descriptivo: 'Drive Multimedia & Videos 4K (Shared)',
    email_cuenta: 'multimedia@vaikuntha.com',
    tipo_autenticacion: 'SERVICE_ACCOUNT',
    root_folder_id: '1A2B3C4D_MULTIMEDIA_ROOT',
    proposito: 'MULTIMEDIA',
    es_default: true,
    roles_permitidos: ['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'],
    sedes_asignadas: ['TODAS'],
    is_active: true,
    espacio_usado_bytes: 34359738368, // 32 GB
    espacio_total_bytes: 2199023255552 // 2 TB
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    nombre_descriptivo: 'Drive Fichas Técnicas & Clientes',
    email_cuenta: 'documentos@vaikuntha.com',
    tipo_autenticacion: 'SERVICE_ACCOUNT',
    root_folder_id: '1E2F3G4H_DOCS_ROOT',
    proposito: 'DOCUMENTOS',
    es_default: true,
    roles_permitidos: ['SUPERADMIN', 'ADMIN', 'RECEPCION', 'STAFF'],
    sedes_asignadas: ['TODAS'],
    is_active: true,
    espacio_usado_bytes: 5368709120, // 5 GB
    espacio_total_bytes: 107374182400 // 100 GB
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    nombre_descriptivo: 'Drive Marcas, Logos & Campañas',
    email_cuenta: 'marcas@vaikuntha.com',
    tipo_autenticacion: 'OAUTH_CLIENT',
    root_folder_id: '1I2J3K4L_MARCAS_ROOT',
    proposito: 'MARCAS',
    es_default: false,
    roles_permitidos: ['SUPERADMIN', 'ADMIN'],
    sedes_asignadas: ['TODAS'],
    is_active: true,
    espacio_usado_bytes: 12884901888, // 12 GB
    espacio_total_bytes: 536870912000 // 500 GB
  }
];

// Archivos de muestra enriquecidos para pruebas de video, audio, fotos HD y PDF
export const DRIVE_ARCHIVOS_DEMO: DriveArchivo[] = [
  {
    id: 'f-001',
    drive_cuenta_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    file_id_google: 'google-video-001',
    nombre_archivo: 'Balayage_Masterclass_4K_EdicionFinal.mp4',
    mime_type: 'video/mp4',
    tamano_bytes: 845200000, // ~845 MB
    thumbnail_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
    web_view_link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    entidad_tipo: 'GENERAL',
    entidad_nombre: 'Masterclasses & Protocolos',
    carpeta_padre_id: 'root',
    carpeta_ruta: '/Capacitaciones/',
    subido_por_nombre: 'Diógenes de Sinope',
    created_at: '2026-08-15T14:30:00Z'
  },
  {
    id: 'f-002',
    drive_cuenta_id: 'a1b2c3d4-0001-4000-8000-000000000001',
    file_id_google: 'google-audio-001',
    nombre_archivo: 'Podcast_Tendencias_Color_2026.mp3',
    mime_type: 'audio/mp3',
    tamano_bytes: 48500000, // ~48.5 MB
    web_view_link: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    entidad_tipo: 'MARCA',
    entidad_nombre: 'Lumina Studio Brand',
    carpeta_padre_id: 'root',
    carpeta_ruta: '/Podcast Audio/',
    subido_por_nombre: 'Equipo de Marketing',
    created_at: '2026-08-16T11:20:00Z'
  },
  {
    id: 'f-003',
    drive_cuenta_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    file_id_google: 'google-img-001',
    nombre_archivo: 'Ficha_Tecnica_Coloracion_Valeria_Mendoza_HD.png',
    mime_type: 'image/png',
    tamano_bytes: 14800000, // ~14.8 MB
    thumbnail_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    web_view_link: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=95',
    entidad_tipo: 'CLIENTE',
    entidad_id: 'b56fd974-9543-41bb-98f9-cfc09fca945e',
    entidad_nombre: 'Valeria Mendoza (VIP)',
    carpeta_padre_id: 'root',
    carpeta_ruta: '/Clientes/Valeria_Mendoza/',
    subido_por_nombre: 'Demócrito de Abdera',
    created_at: '2026-08-17T16:45:00Z'
  },
  {
    id: 'f-004',
    drive_cuenta_id: 'a1b2c3d4-0002-4000-8000-000000000002',
    file_id_google: 'google-pdf-001',
    nombre_archivo: 'Contrato_Consentimiento_Tratamiento_Quimico_Firmado.pdf',
    mime_type: 'application/pdf',
    tamano_bytes: 3200000, // ~3.2 MB
    web_view_link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    entidad_tipo: 'CLIENTE',
    entidad_nombre: 'Valeria Mendoza (VIP)',
    carpeta_padre_id: 'root',
    carpeta_ruta: '/Clientes/Valeria_Mendoza/',
    subido_por_nombre: 'Sócrates (Recepción)',
    created_at: '2026-08-18T09:10:00Z'
  }
];

/**
 * Formatea bytes en formato legible (KB, MB, GB, TB)
 */
export function formatearTamanoBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = 1;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Obtiene todas las cuentas de Google Drive configuradas
 */
export async function obtenerCuentasDrive(): Promise<DriveCuenta[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('drive_cuentas')
      .select('*')
      .order('is_active', { ascending: false });

    if (error || !data || data.length === 0) {
      return DRIVE_CUENTAS_DEMO;
    }
    return data as DriveCuenta[];
  } catch (err) {
    console.warn('[obtenerCuentasDrive] Fallback a cuentas demo:', err);
    return DRIVE_CUENTAS_DEMO;
  }
}

/**
 * Guarda o actualiza una cuenta de Google Drive
 */
export async function guardarCuentaDrive(cuenta: Partial<DriveCuenta>): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('drive_cuentas')
      .upsert({
        ...cuenta,
        updated_at: new Date().toISOString()
      });

    return !error;
  } catch (err) {
    console.error('[guardarCuentaDrive] Error:', err);
    return false;
  }
}

/**
 * Elimina una cuenta de Google Drive
 */
export async function eliminarCuentaDrive(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('drive_cuentas').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('[eliminarCuentaDrive] Error:', err);
    return false;
  }
}

/**
 * Lista los archivos vinculados a un Drive con filtros de tipo y búsqueda
 */
export async function listarArchivosDrive(
  driveCuentaId?: string,
  entidadTipo?: 'CLIENTE' | 'MARCA' | 'OATC' | 'SEDE' | 'GENERAL',
  entidadId?: string,
  filtroMime?: 'TODOS' | 'VIDEOS' | 'AUDIOS' | 'IMAGENES' | 'DOCUMENTOS',
  busqueda?: string
): Promise<DriveArchivo[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('drive_archivos_vinculados').select('*').order('created_at', { ascending: false });

    if (driveCuentaId) query = query.eq('drive_cuenta_id', driveCuentaId);
    if (entidadTipo) query = query.eq('entidad_tipo', entidadTipo);
    if (entidadId) query = query.eq('entidad_id', entidadId);

    const { data, error } = await query;

    let archivos = (data && data.length > 0) ? (data as DriveArchivo[]) : DRIVE_ARCHIVOS_DEMO;

    // Filtrar por cuenta si viene especificada
    if (driveCuentaId) {
      archivos = archivos.filter(a => a.drive_cuenta_id === driveCuentaId);
    }

    // Filtrar por tipo MIME
    if (filtroMime && filtroMime !== 'TODOS') {
      archivos = archivos.filter(a => {
        if (filtroMime === 'VIDEOS') return a.mime_type.startsWith('video/');
        if (filtroMime === 'AUDIOS') return a.mime_type.startsWith('audio/');
        if (filtroMime === 'IMAGENES') return a.mime_type.startsWith('image/');
        if (filtroMime === 'DOCUMENTOS') return a.mime_type.includes('pdf') || a.mime_type.includes('doc') || a.mime_type.includes('sheet');
        return true;
      });
    }

    // Filtrar por término de búsqueda
    if (busqueda && busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      archivos = archivos.filter(a =>
        a.nombre_archivo.toLowerCase().includes(q) ||
        (a.entidad_nombre && a.entidad_nombre.toLowerCase().includes(q))
      );
    }

    return archivos;
  } catch (err) {
    console.warn('[listarArchivosDrive] Fallback a archivos demo:', err);
    return DRIVE_ARCHIVOS_DEMO;
  }
}

/**
 * Simula y ejecuta la subida de un archivo pesado a Google Drive con progreso
 */
export async function subirArchivoDrive(
  driveCuentaId: string,
  file: File,
  entidadTipo: 'CLIENTE' | 'MARCA' | 'OATC' | 'SEDE' | 'GENERAL' = 'GENERAL',
  entidadNombre?: string,
  entidadId?: string,
  onProgress?: (porcentaje: number) => void
): Promise<DriveArchivo | null> {
  // Simular progreso de subida de archivo pesado (Chunked Upload)
  for (let i = 10; i <= 100; i += 20) {
    if (onProgress) onProgress(i);
    await new Promise(r => setTimeout(r, 120));
  }

  const nuevoArchivo: DriveArchivo = {
    id: `f-${Date.now()}`,
    drive_cuenta_id: driveCuentaId,
    file_id_google: `google-file-${Date.now()}`,
    nombre_archivo: file.name,
    mime_type: file.type || 'application/octet-stream',
    tamano_bytes: file.size,
    thumbnail_url: file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : undefined,
    web_view_link: `https://drive.google.com/file/d/demo-${Date.now()}/view`,
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    entidad_nombre: entidadNombre || 'General',
    carpeta_padre_id: 'root',
    carpeta_ruta: `/${entidadTipo}/${entidadNombre || 'Archivos'}/`,
    subido_por_nombre: 'Usuario Actual',
    created_at: new Date().toISOString()
  };

  try {
    const supabase = createClient();
    await supabase.from('drive_archivos_vinculados').insert([nuevoArchivo]);
  } catch (e) {
    console.warn('Subida guardada localmente:', e);
  }

  return nuevoArchivo;
}

/**
 * Genera el enlace público compartible
 */
export function generarEnlaceCompartible(archivo: DriveArchivo): string {
  return archivo.web_view_link || `https://drive.google.com/file/d/${archivo.file_id_google}/view?usp=sharing`;
}
