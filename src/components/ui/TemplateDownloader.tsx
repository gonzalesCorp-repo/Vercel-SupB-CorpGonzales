"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Download, FileSpreadsheet, ChevronDown, Check, 
  Building2, Users, Package, Scissors, Sparkles, Layers,
  CreditCard, Landmark, Armchair, UserCheck, Shield,
  Receipt, Sliders, AlertTriangle, BookOpen, Network
} from "lucide-react";

// ==============================================================================
// 00. GUÍA DE JERARQUÍA RELACIONAL DE INGESTA (EXPLICACIÓN TÉCNICA EN EXCEL)
// ==============================================================================
const HOJA_GUIA_JERARQUIA = [
  {
    Paso_Orden: "00",
    Nivel: "INSTRUCCIÓN MAESTRA",
    Tabla_Destino: "TODAS",
    Descripcion: "Para evitar errores de 'Foreign Key Constraint Violation', las tablas deben importarse respetando este orden numérico estricto.",
    Dependencias_Requeridas: "Ninguna"
  },
  {
    Paso_Orden: "01",
    Nivel: "NIVEL 1 - Raíz",
    Tabla_Destino: "public.sedes",
    Descripcion: "Sucursales físicas y virtuales de la corporación. Contiene RUC y razón social.",
    Dependencias_Requeridas: "Cero dependencias. Cargar primero."
  },
  {
    Paso_Orden: "02",
    Nivel: "NIVEL 1 - Raíz",
    Tabla_Destino: "public.clientes",
    Descripcion: "Directorio de clientes y cartera CRM con DNI, celular y sede_principal.",
    Dependencias_Requeridas: "Requiere N1_01_Sedes para validar sede_principal."
  },
  {
    Paso_Orden: "03",
    Nivel: "NIVEL 1 - Raíz",
    Tabla_Destino: "public.config_roles",
    Descripcion: "Catálogo oficial de los 6 roles canónicos del sistema Vaikuntha ERP.",
    Dependencias_Requeridas: "Cero dependencias."
  },
  {
    Paso_Orden: "04",
    Nivel: "NIVEL 1 - Raíz",
    Tabla_Destino: "public.emisores",
    Descripcion: "Entidades fiscales emisoras de comprobantes SUNAT.",
    Dependencias_Requeridas: "Cero dependencias."
  },
  {
    Paso_Orden: "05",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.agentes",
    Descripcion: "Personal con roles canónicos (ADMIN, SOPORTE, STAFF). estado='ACTIVO'/'INACTIVO' (laboral) y estado_operativo='FUERA_DE_TURNO'/'DISPONIBLE' (piso).",
    Dependencias_Requeridas: "Requiere N1_01_Sedes y N1_03_Config_Roles."
  },
  {
    Paso_Orden: "06",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.bienes (Productos)",
    Descripcion: "Catálogo de productos retail para venta al público e insumos de taller.",
    Dependencias_Requeridas: "Cero dependencias de sede directa."
  },
  {
    Paso_Orden: "07",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.bienes (Servicios)",
    Descripcion: "Servicios profesionales de salón (corte, balayage, tratamientos).",
    Dependencias_Requeridas: "Cero dependencias de sede directa."
  },
  {
    Paso_Orden: "08",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.ubicaciones",
    Descripcion: "Puestos físicos de trabajo WFM (sillones, lavaderos, cabinas).",
    Dependencias_Requeridas: "Requiere N1_01_Sedes."
  },
  {
    Paso_Orden: "09",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.cuentas_financieras",
    Descripcion: "Cuentas bancarias (BCP, BBVA), caja chica y billeteras Yape.",
    Dependencias_Requeridas: "Requiere N1_01_Sedes."
  },
  {
    Paso_Orden: "10",
    Nivel: "NIVEL 2 - Dependientes",
    Tabla_Destino: "public.emisores_series",
    Descripcion: "Series electrónicas SUNAT (B001, F001, NV01).",
    Dependencias_Requeridas: "Requiere N1_04_Emisores_SUNAT."
  },
  {
    Paso_Orden: "11",
    Nivel: "NIVEL 3 - Puentes",
    Tabla_Destino: "public.config_pasarelas_pago",
    Descripcion: "Terminales POS (Izipay, Niubiz) y cálculo de comisiones.",
    Dependencias_Requeridas: "Requiere N1_01_Sedes y N2_09_Cuentas_Financieras."
  },
  {
    Paso_Orden: "12",
    Nivel: "NIVEL 3 - Puentes",
    Tabla_Destino: "public.agente_configuracion_remunerativa",
    Descripcion: "Esquemas de comisiones %, sueldos base y frecuencias de liquidación.",
    Dependencias_Requeridas: "Requiere N2_05_Personal_Agentes."
  },
  {
    Paso_Orden: "13",
    Nivel: "NIVEL 3 - Puentes",
    Tabla_Destino: "public.almacen_principal",
    Descripcion: "Inventario y stock inicial de insumos y productos por sede.",
    Dependencias_Requeridas: "Requiere N1_01_Sedes y N2_06_Catalogo_Bienes."
  },
  {
    Paso_Orden: "14",
    Nivel: "NIVEL 3 - Puentes",
    Tabla_Destino: "public.sedes_usuarios (Multi-Sede)",
    Descripcion: "Asignaciones adicionales de muchos a muchos para agentes y clientes a múltiples sedes.",
    Dependencias_Requeridas: "Requiere N1_01_Sedes, N1_02_Clientes y N2_05_Personal_Agentes."
  }
];

// ==============================================================================
// NIVEL 1: TABLAS RAÍZ (CERO DEPENDENCIAS)
// ==============================================================================

// N1_01. Sedes & Sucursales
const PLANTILLA_SEDES = [
  {
    nombre: "Sede Miraflores - Flagship",
    ciudad: "Lima",
    direccion: "Av. José Larco 850, Miraflores",
    telefono: "+51 987 654 321",
    ruc_emisor: "20608945123",
    razon_social_emisora: "VAIKUNTHA SALON & SPA S.A.C.",
    estado: "activo"
  },
  {
    nombre: "Sede San Isidro - El Polo",
    ciudad: "Lima",
    direccion: "Av. Conquistadores 420, San Isidro",
    telefono: "+51 987 654 322",
    ruc_emisor: "20608945123",
    razon_social_emisora: "VAIKUNTHA SALON & SPA S.A.C.",
    estado: "activo"
  },
  {
    nombre: "Sede Surco - Chacarilla",
    ciudad: "Lima",
    direccion: "Av. Primavera 1230, Santiago de Surco",
    telefono: "+51 987 654 323",
    ruc_emisor: "20608945123",
    razon_social_emisora: "VAIKUNTHA SALON & SPA S.A.C.",
    estado: "activo"
  }
];

// N1_02. Clientes & Directorio CRM (con Sede Principal)
const PLANTILLA_CLIENTES = [
  {
    nombre: "Mariana Alarcón Vega",
    dni: "47891234",
    celular: "+51 984 123 456",
    email: "mariana.alarcon@gmail.com",
    sede_principal: "Sede Miraflores - Flagship"
  },
  {
    nombre: "Claudia Zegarra Ponce",
    dni: "71234567",
    celular: "+51 976 543 210",
    email: "claudia.zegarra@outlook.com",
    sede_principal: "Sede San Isidro - El Polo"
  },
  {
    nombre: "Valeria Benavides Miroquesada",
    dni: "44567890",
    celular: "+51 998 765 432",
    email: "valeria.benavides@empresa.com",
    sede_principal: "Sede Miraflores - Flagship"
  },
  {
    nombre: "Diego Bustamante Prado",
    dni: "10987654",
    celular: "+51 955 443 322",
    email: "diego.bustamante@gmail.com",
    sede_principal: "Sede Surco - Chacarilla"
  }
];

// N1_03. Configuración de Roles (Catálogo Canónico Limpio de 6 Roles)
const PLANTILLA_ROLES = [
  {
    rol_codigo: "SUPERADMIN",
    nombre_visible: "Super Administrador (Owner Único)",
    nivel_acceso: 100,
    descripcion: "Owner exclusivo de la plataforma. Control de arquitectura, /dev, alta de sedes y admins."
  },
  {
    rol_codigo: "ADMIN",
    nombre_visible: "Administrador de Sede",
    nivel_acceso: 80,
    descripcion: "Gestión operativa de sede, compras, finanzas y alta exclusiva de Soporte y Staff con delegación."
  },
  {
    rol_codigo: "SOPORTE",
    nombre_visible: "Personal de Apoyo (Workspaces)",
    nivel_acceso: 30,
    descripcion: "Equipo de apoyo multifuncional. Opera en Workspaces (Recepción, Venta, Taller) con herramientas progresivas."
  },
  {
    rol_codigo: "STAFF",
    nombre_visible: "Especialista Staff Operativo",
    nivel_acceso: 20,
    descripcion: "Operador directo del servicio en móvil/tablet. Órdenes OATC, tickets anidados, insumos y pre-cobro."
  },
  {
    rol_codigo: "KIOSK",
    nombre_visible: "Tótem Kiosko Dedicado",
    nivel_acceso: 0,
    descripcion: "Terminal interactiva fija en lobby para autoservicio del cliente y marcación rápida WFM por PIN."
  },
  {
    rol_codigo: "CLIENTE",
    nombre_visible: "Consumidor Final (Portal Web/Móvil)",
    nivel_acceso: 0,
    descripcion: "Interfaz para autogestión de citas, seguimiento en vivo de servicios y consulta de puntos."
  }
];

// N1_04. Emisores SUNAT
const PLANTILLA_EMISORES = [
  {
    ruc: "20608945123",
    razon_social: "VAIKUNTHA SALON & SPA S.A.C.",
    direccion_fiscal: "Av. José Larco 850, Miraflores, Lima",
    ubigeo: "150122",
    usuario_sol: "MODDATOS",
    clave_sol: "MODDATOS",
    certificado_digital_nombre: "cert_sunat_20608945123.pfx",
    modo_produccion: false
  }
];

// ==============================================================================
// NIVEL 2: ENTIDADES DEPENDIENTES DE NIVEL 1
// ==============================================================================

// N2_05. Personal & Agentes (Roles Canónicos: ADMIN, SOPORTE, STAFF + Sede Principal)
// NOTA CANÓNICA: 'estado' es el vínculo laboral (ACTIVO / INACTIVO). 'estado_operativo' es disponibilidad en piso (FUERA_DE_TURNO, DISPONIBLE, etc.)
const PLANTILLA_AGENTES = [
  {
    nombre: "Jean Pierre Valdivia",
    email: "jean.pierre@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Master Colorista & Balayage",
    sede_principal: "Sede Miraflores - Flagship",
    estado: "ACTIVO",
    estado_operativo: "FUERA_DE_TURNO"
  },
  {
    nombre: "Carla Mendoza Reyes",
    email: "carla.mendoza@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Estilista Senior & Peinados",
    sede_principal: "Sede Miraflores - Flagship",
    estado: "ACTIVO",
    estado_operativo: "FUERA_DE_TURNO"
  },
  {
    nombre: "Rodrigo Morales Alva",
    email: "rodrigo.morales@vaikuntha.pe",
    rol: "SOPORTE",
    especialidad: "Asistente de Lavado, Taller & Caja",
    sede_principal: "Sede Miraflores - Flagship",
    estado: "ACTIVO",
    estado_operativo: "FUERA_DE_TURNO"
  },
  {
    nombre: "Luciana Salazar Peña",
    email: "luciana.salazar@vaikuntha.pe",
    rol: "SOPORTE",
    especialidad: "Anfitriona de Recepción & Atención al Cliente",
    sede_principal: "Sede Miraflores - Flagship",
    estado: "ACTIVO",
    estado_operativo: "FUERA_DE_TURNO"
  },
  {
    nombre: "Martín Vizcarra Flores",
    email: "martin.admin@vaikuntha.pe",
    rol: "ADMIN",
    especialidad: "Administrador de Sede Miraflores",
    sede_principal: "Sede Miraflores - Flagship",
    estado: "ACTIVO",
    estado_operativo: "FUERA_DE_TURNO"
  }
];

// N2_06. Catálogo de Bienes (Retail e Insumos)
const PLANTILLA_BIENES = [
  {
    nombre: "Shampoo Serie Expert Absolut Repair 300ml",
    sku: "LOR-SH-ABS-300",
    tipo_bien: "producto",
    categoria: "PRODUCTOS_RETAIL",
    costo_base: 45.00,
    precio_venta: 85.00
  },
  {
    nombre: "Mascarilla Capilar Nutritiva Metal Detox 250ml",
    sku: "LOR-MK-MTD-250",
    tipo_bien: "producto",
    categoria: "PRODUCTOS_RETAIL",
    costo_base: 65.00,
    precio_venta: 120.00
  },
  {
    nombre: "Tinte Inoa Sin Amoníaco 60g - Tono 6.0 Rubio Oscuro",
    sku: "LOR-INO-60G-60",
    tipo_bien: "insumo",
    categoria: "INSUMOS_TALLER",
    costo_base: 24.00,
    precio_venta: 45.00
  },
  {
    nombre: "Oxidante en Crema 20 Volúmenes 1000ml",
    sku: "LOR-OX-20V-1000",
    tipo_bien: "insumo",
    categoria: "INSUMOS_TALLER",
    costo_base: 32.00,
    precio_venta: 60.00
  },
  {
    nombre: "Repuesto Resistencia Térmica Secadora Parlux 385",
    sku: "REP-RES-PAR-385",
    tipo_bien: "insumo",
    categoria: "REPUESTOS_MANTENIMIENTO",
    costo_base: 85.00,
    precio_venta: 140.00
  }
];

// N2_07. Servicios de Salón
const PLANTILLA_SERVICIOS = [
  {
    nombre: "Balayage Signature & Matización Gloss",
    sku: "SRV-BAL-SIG-01",
    tipo_bien: "servicio",
    categoria: "COLORACION",
    precio_venta: 380.00
  },
  {
    nombre: "Corte de Diseño & Styling Térmico",
    sku: "SRV-COR-DIS-02",
    tipo_bien: "servicio",
    categoria: "CORTE",
    precio_venta: 95.00
  },
  {
    nombre: "Tratamiento Ritual Molecular Absolut Repair",
    sku: "SRV-TRT-RIT-03",
    tipo_bien: "servicio",
    categoria: "TRATAMIENTOS",
    precio_venta: 140.00
  },
  {
    nombre: "Manicure Spa & Esmaltado Semipermanente",
    sku: "SRV-MAN-SPA-04",
    tipo_bien: "servicio",
    categoria: "MANICURE",
    precio_venta: 65.00
  }
];

// N2_08. Ubicaciones WFM
const PLANTILLA_UBICACIONES = [
  {
    nombre: "Recepción / Lobby Principal",
    tipo: "en_espera",
    estado: "LIBRE"
  },
  {
    nombre: "Sillón Estilismo 1 (Master)",
    tipo: "silla",
    estado: "LIBRE"
  },
  {
    nombre: "Sillón Estilismo 2",
    tipo: "silla",
    estado: "LIBRE"
  },
  {
    nombre: "Sillón Barbería & Barba",
    tipo: "sillón",
    estado: "LIBRE"
  },
  {
    nombre: "Lavacabezas Ergonómico 1",
    tipo: "lavadero",
    estado: "LIBRE"
  },
  {
    nombre: "Cabina Estética & Spa Facial",
    tipo: "cabina",
    estado: "LIBRE"
  }
];

// N2_09. Cuentas Financieras
const PLANTILLA_CUENTAS_FINANCIERAS = [
  {
    nombre: "Caja Chica de Mostrador (Fondo Fijo)",
    tipo_cuenta: "CAJA_CHICA",
    banco_entidad: "Efectivo",
    numero_cuenta: "CAJA-CHICA-01",
    moneda: "PEN",
    saldo_actual: 500.00,
    estado: "ACTIVO"
  },
  {
    nombre: "Cuenta Operativa Principal BCP Soles",
    tipo_cuenta: "BANCO",
    banco_entidad: "BCP",
    numero_cuenta: "194-98765432-0-12",
    moneda: "PEN",
    saldo_actual: 15420.50,
    estado: "ACTIVO"
  },
  {
    nombre: "Cuenta Recaudadora BBVA Continental",
    tipo_cuenta: "BANCO",
    banco_entidad: "BBVA",
    numero_cuenta: "0011-0234-0100098765",
    moneda: "PEN",
    saldo_actual: 8950.00,
    estado: "ACTIVO"
  },
  {
    nombre: "Billetera Digital Yape Negocios",
    tipo_cuenta: "BILLETERA_DIGITAL",
    banco_entidad: "Yape",
    numero_cuenta: "987-654-321",
    moneda: "PEN",
    saldo_actual: 1200.00,
    estado: "ACTIVO"
  }
];

// N2_10. Emisores Series SUNAT
const PLANTILLA_EMISORES_SERIES = [
  {
    emisor_ruc: "20608945123",
    tipo_comprobante: "BOLETA",
    serie: "B001",
    correlativo_actual: 1,
    activo: true
  },
  {
    emisor_ruc: "20608945123",
    tipo_comprobante: "FACTURA",
    serie: "F001",
    correlativo_actual: 1,
    activo: true
  },
  {
    emisor_ruc: "20608945123",
    tipo_comprobante: "NOTA_VENTA",
    serie: "NV01",
    correlativo_actual: 1,
    activo: true
  }
];

// ==============================================================================
// NIVEL 3: TABLAS PUENTE, PASARELAS & INVENTARIO INICIAL
// ==============================================================================

// N3_11. Pasarelas de Cobro POS
const PLANTILLA_PASARELAS_POS = [
  {
    nombre: "Izipay Terminal Mostrador 1",
    medio_pago: "TARJETA_DEBITO",
    porcentaje_comision: 2.95,
    costo_fijo_transaccion: 0.00,
    aplica_igv_comision: true,
    dias_liquidacion: 1,
    tipo_acreditacion: "EN_TRANSITO_LOTE",
    activo: true
  },
  {
    nombre: "Izipay Crédito Mostrador 1",
    medio_pago: "TARJETA_CREDITO",
    porcentaje_comision: 3.45,
    costo_fijo_transaccion: 0.00,
    aplica_igv_comision: true,
    dias_liquidacion: 1,
    tipo_acreditacion: "EN_TRANSITO_LOTE",
    activo: true
  },
  {
    nombre: "Niubiz POS Móvil Salón",
    medio_pago: "TARJETA_CREDITO",
    porcentaje_comision: 3.25,
    costo_fijo_transaccion: 0.00,
    aplica_igv_comision: true,
    dias_liquidacion: 1,
    tipo_acreditacion: "EN_TRANSITO_LOTE",
    activo: true
  },
  {
    nombre: "Yape QR Comercial",
    medio_pago: "BILLETERA_DIGITAL",
    porcentaje_comision: 0.00,
    costo_fijo_transaccion: 0.00,
    aplica_igv_comision: false,
    dias_liquidacion: 0,
    tipo_acreditacion: "INMEDIATA",
    activo: true
  }
];

// N3_12. Esquemas Remunerativos
const PLANTILLA_ESQUEMAS_REMUNERACION = [
  {
    agente_email: "jean.pierre@vaikuntha.pe",
    tipo_remuneracion: "SUELDO_BASE_MAS_COMISIONES",
    sueldo_base: 1500.00,
    porcentaje_comision_servicios: 45.00,
    porcentaje_comision_productos: 10.00,
    frecuencia_corte: "QUINCENAL",
    permite_solicitud_manual: true
  },
  {
    agente_email: "carla.mendoza@vaikuntha.pe",
    tipo_remuneracion: "SOLO_COMISIONES",
    sueldo_base: 0.00,
    porcentaje_comision_servicios: 40.00,
    porcentaje_comision_productos: 10.00,
    frecuencia_corte: "DIARIA",
    permite_solicitud_manual: true
  },
  {
    agente_email: "rodrigo.morales@vaikuntha.pe",
    tipo_remuneracion: "SOLO_SUELDO_BASE",
    sueldo_base: 1350.00,
    porcentaje_comision_servicios: 0.00,
    porcentaje_comision_productos: 5.00,
    frecuencia_corte: "MENSUAL",
    permite_solicitud_manual: false
  }
];

// N3_13. Inventario Inicial (Almacén Principal)
const PLANTILLA_INVENTARIO_INICIAL = [
  {
    sede_nombre: "Sede Miraflores - Flagship",
    sku_bien: "LOR-SH-ABS-300",
    proveedor: "L'Oréal Perú S.A.",
    marca: "L'Oréal Professionnel",
    linea: "Serie Expert",
    presentacion: "Frasco 300ml",
    stock_inicial: 24,
    stock_minimo: 6,
    costo_unitario: 45.00,
    ubicacion_anaquel: "A-01-RETAIL"
  },
  {
    sede_nombre: "Sede Miraflores - Flagship",
    sku_bien: "LOR-INO-60G-60",
    proveedor: "L'Oréal Perú S.A.",
    marca: "Inoa",
    linea: "Coloración Sin Amoníaco",
    presentacion: "Tubo 60g",
    stock_inicial: 50,
    stock_minimo: 10,
    costo_unitario: 24.00,
    ubicacion_anaquel: "B-03-LAB"
  }
];

// N3_14. Asignaciones Multi-Sede Puente (Muchos a Muchos: Agentes y Clientes)
const PLANTILLA_SEDES_ASIGNACIONES = [
  {
    tipo_entidad: "AGENTE",
    identificador: "jean.pierre@vaikuntha.pe",
    nombre_sede: "Sede San Isidro - El Polo",
    rol_en_sede: "STAFF",
    es_sede_principal: false,
    notas: "Atención VIP los días sábados"
  },
  {
    tipo_entidad: "AGENTE",
    identificador: "martin.admin@vaikuntha.pe",
    nombre_sede: "Sede San Isidro - El Polo",
    rol_en_sede: "ADMIN",
    es_sede_principal: false,
    notas: "Supervisión regional de sedes Lima Oeste"
  },
  {
    tipo_entidad: "AGENTE",
    identificador: "rodrigo.morales@vaikuntha.pe",
    nombre_sede: "Sede Surco - Chacarilla",
    rol_en_sede: "SOPORTE",
    es_sede_principal: false,
    notas: "Rotación quincenal para cobertura de inventario"
  },
  {
    tipo_entidad: "CLIENTE",
    identificador: "47891234",
    nombre_sede: "Sede San Isidro - El Polo",
    rol_en_sede: "CLIENTE",
    es_sede_principal: false,
    notas: "Clienta frecuente de colorimetría en ambas sedes"
  }
];

export function TemplateDownloader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para autocalcular anchos de columna para visualización pulcra
  const formatWorksheet = (data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      ws["!cols"] = keys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...data.map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
      });
    }
    return ws;
  };

  // Descarga del Libro Maestro Multi-Pestaña con Jerarquía Oficial (15 Hojas)
  const descargarLibroMaestro = () => {
    const wb = XLSX.utils.book_new();

    // 00. Hoja de Guía Jerárquica
    XLSX.utils.book_append_sheet(wb, formatWorksheet(HOJA_GUIA_JERARQUIA), "00_GUIA_JERARQUIA");

    // NIVEL 1: Raíz
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_SEDES), "N1_01_Sedes");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_CLIENTES), "N1_02_Clientes");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_ROLES), "N1_03_Config_Roles");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_EMISORES), "N1_04_Emisores_SUNAT");

    // NIVEL 2: Dependientes
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_AGENTES), "N2_05_Personal_Agentes");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_BIENES), "N2_06_Catalogo_Bienes");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_SERVICIOS), "N2_07_Servicios_Salon");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_UBICACIONES), "N2_08_Ubicaciones_WFM");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_CUENTAS_FINANCIERAS), "N2_09_Cuentas_Financieras");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_EMISORES_SERIES), "N2_10_Emisores_Series");

    // NIVEL 3: Puentes & Configuración
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_PASARELAS_POS), "N3_11_Pasarelas_POS");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_ESQUEMAS_REMUNERACION), "N3_12_Esquemas_Remuneracion");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_INVENTARIO_INICIAL), "N3_13_Inventario_Inicial");
    XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_SEDES_ASIGNACIONES), "N3_14_Sedes_Asignaciones");

    XLSX.writeFile(wb, "Plantilla_Maestra_Aprovisionamiento_Sede_Vaikuntha.xlsx");
    setDropdownOpen(false);
  };

  // Descargas individuales modulares prefijadas
  const descargarModulo = (
    nombreArchivo: string, 
    nombreHoja: string, 
    dataset: any[]
  ) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, formatWorksheet(dataset), nombreHoja);
    XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Botón Principal: Descargar Libro Maestro Jerarquizado */}
      <button
        type="button"
        onClick={descargarLibroMaestro}
        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-xl shadow-xs text-xs font-bold transition cursor-pointer"
        title="Descargar Kit Maestro Jerarquizado con Guía de Ingesta (15 Hojas Ordenadas)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Descargar Plantillas Excel</span>
      </button>

      {/* Flecha Toggle Dropdown */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl border-l border-emerald-500/40 shadow-xs transition cursor-pointer"
        title="Menú jerárquico por niveles de dependencia"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable Estructurado por Niveles */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1.5 max-h-[480px] overflow-y-auto">
          
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Jerarquía Oficial Multi-Sede
              </span>
              <span className="text-[9px] font-bold text-slate-400">15 Plantillas</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Carga en orden numérico. Soporta sede_principal y asignaciones múltiples.
            </p>
          </div>

          {/* Opción Libro Maestro */}
          <button
            type="button"
            onClick={descargarLibroMaestro}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 text-left transition cursor-pointer border border-emerald-200/80 dark:border-emerald-800/80"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-slate-800 dark:text-white block">
                  Libro Maestro Completo (.xlsx)
                </strong>
                <span className="text-[10px] text-slate-500">14 hojas operativas + Hoja 00 de Guía</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase shrink-0">
              Oficial
            </span>
          </button>

          {/* ================= SECCIÓN NIVEL 1 ================= */}
          <div className="pt-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 px-2 block">
              ⭐ NIVEL 1: Tablas Raíz (Cargar Primero)
            </span>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N1_01_Sedes', 'N1_01_Sedes', PLANTILLA_SEDES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">N1_01. Sedes & Sucursales</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N1_02_Clientes', 'N1_02_Clientes', PLANTILLA_CLIENTES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">N1_02. Clientes CRM (con Sede Principal)</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N1_03_Config_Roles', 'N1_03_Config_Roles', PLANTILLA_ROLES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">N1_03. Configuración de Roles (6 Roles Canónicos)</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N1_04_Emisores_SUNAT', 'N1_04_Emisores_SUNAT', PLANTILLA_EMISORES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">N1_04. Emisores Fiscales SUNAT</span>
              </button>
            </div>
          </div>

          {/* ================= SECCIÓN NIVEL 2 ================= */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-2 block">
              🔹 NIVEL 2: Entidades Dependientes
            </span>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_05_Personal_Agentes', 'N2_05_Personal_Agentes', PLANTILLA_AGENTES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">N2_05. Personal & Agentes (ADMIN, SOPORTE, STAFF)</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_06_Catalogo_Bienes', 'N2_06_Catalogo_Bienes', PLANTILLA_BIENES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Package className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">N2_06. Catálogo de Bienes & Insumos</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_07_Servicios_Salon', 'N2_07_Servicios_Salon', PLANTILLA_SERVICIOS)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Scissors className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span className="truncate">N2_07. Servicios de Salón</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_08_Ubicaciones_WFM', 'N2_08_Ubicaciones_WFM', PLANTILLA_UBICACIONES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Armchair className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">N2_08. Ubicaciones & Puestos WFM</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_09_Cuentas_Financieras', 'N2_09_Cuentas_Financieras', PLANTILLA_CUENTAS_FINANCIERAS)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Landmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">N2_09. Cuentas Financieras & Bancos</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N2_10_Emisores_Series', 'N2_10_Emisores_Series', PLANTILLA_EMISORES_SERIES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">N2_10. Series de Facturación SUNAT</span>
              </button>
            </div>
          </div>

          {/* ================= SECCIÓN NIVEL 3 ================= */}
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2 block">
              🔗 NIVEL 3: Puentes, Multi-Sede & Stock
            </span>
            <div className="space-y-0.5 mt-1">
              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N3_11_Pasarelas_POS', 'N3_11_Pasarelas_POS', PLANTILLA_PASARELAS_POS)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <CreditCard className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">N3_11. Pasarelas de Cobro POS</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N3_12_Esquemas_Remuneracion', 'N3_12_Esquemas_Remuneracion', PLANTILLA_ESQUEMAS_REMUNERACION)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">N3_12. Esquemas de Remuneración</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N3_13_Inventario_Inicial', 'N3_13_Inventario_Inicial', PLANTILLA_INVENTARIO_INICIAL)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs"
              >
                <Package className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">N3_13. Inventario & Stock Inicial</span>
              </button>

              <button
                type="button"
                onClick={() => descargarModulo('Plantilla_N3_14_Sedes_Asignaciones', 'N3_14_Sedes_Asignaciones', PLANTILLA_SEDES_ASIGNACIONES)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-xs font-bold text-purple-600 dark:text-purple-300"
              >
                <Network className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">N3_14. Asignaciones Multi-Sede (Puente)</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
