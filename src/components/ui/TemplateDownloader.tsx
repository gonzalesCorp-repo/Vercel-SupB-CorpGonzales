"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Download, FileSpreadsheet, ChevronDown, Check, 
  Building2, Users, Package, Scissors, Sparkles, Layers,
  CreditCard, Landmark, Armchair, UserCheck
} from "lucide-react";

// ==============================================================================
// DATASETS OFICIALES DE LAS 8 PLANTILLAS OPERATIVAS VAIKUNTHA ERP
// ==============================================================================

// 01. Sedes & Sucursales
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

// 02. Personal & Agentes
const PLANTILLA_AGENTES = [
  {
    nombre: "Jean Pierre Valdivia",
    email: "jean.pierre@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Master Colorista & Balayage",
    estado: "DISPONIBLE",
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Carla Mendoza Reyes",
    email: "carla.mendoza@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Estilista Senior & Peinados",
    estado: "DISPONIBLE",
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Rodrigo Morales Alva",
    email: "rodrigo.morales@vaikuntha.pe",
    rol: "SOPORTE",
    especialidad: "Asistente de Lavado & Masajes Capilares",
    estado: "DISPONIBLE",
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Luciana Salazar Peña",
    email: "luciana.salazar@vaikuntha.pe",
    rol: "RECEPCION",
    especialidad: "Atención al Cliente & Agenda",
    estado: "DISPONIBLE",
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Tales de Mileto",
    email: "tales@vaikuntha.com",
    rol: "CAJA",
    especialidad: "Cajero POS & Facturación SUNAT",
    estado: "DISPONIBLE",
    estado_operativo: "DISPONIBLE"
  }
];

// 03. Catálogo de Bienes (Retail e Insumos de Taller)
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

// 04. Servicios de Salón
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

// 05. Clientes & Directorio CRM
const PLANTILLA_CLIENTES = [
  {
    nombre: "Mariana Alarcón Vega",
    dni: "47891234",
    celular: "+51 984 123 456",
    email: "mariana.alarcon@gmail.com"
  },
  {
    nombre: "Claudia Zegarra Ponce",
    dni: "71234567",
    celular: "+51 976 543 210",
    email: "claudia.zegarra@outlook.com"
  },
  {
    nombre: "Valeria Benavides Miroquesada",
    dni: "44567890",
    celular: "+51 998 765 432",
    email: "valeria.benavides@empresa.com"
  },
  {
    nombre: "Diego Bustamante Prado",
    dni: "10987654",
    celular: "+51 955 443 322",
    email: "diego.bustamante@gmail.com"
  }
];

// 06. Cuentas Financieras & Fondos de Sede
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

// 07. Pasarelas de Cobro POS & Tasas de Comisión
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

// 08. Ubicaciones Físicas de Sede (WFM Puestos)
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
    nombre: "Lavacabezas Ergonómico 2",
    tipo: "lavadero",
    estado: "LIBRE"
  },
  {
    nombre: "Cabina Estética & Spa Facial",
    tipo: "cabina",
    estado: "LIBRE"
  },
  {
    nombre: "Tocador Makeup & Peinados",
    tipo: "tocador",
    estado: "LIBRE"
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
        return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
      });
    }
    return ws;
  };

  // Descarga del Libro Maestro Multi-Pestaña (8 Hojas)
  const descargarLibroMaestro = () => {
    const wb = XLSX.utils.book_new();

    const wsSedes = formatWorksheet(PLANTILLA_SEDES);
    const wsAgentes = formatWorksheet(PLANTILLA_AGENTES);
    const wsBienes = formatWorksheet(PLANTILLA_BIENES);
    const wsServicios = formatWorksheet(PLANTILLA_SERVICIOS);
    const wsClientes = formatWorksheet(PLANTILLA_CLIENTES);
    const wsCuentas = formatWorksheet(PLANTILLA_CUENTAS_FINANCIERAS);
    const wsPasarelas = formatWorksheet(PLANTILLA_PASARELAS_POS);
    const wsUbicaciones = formatWorksheet(PLANTILLA_UBICACIONES);

    XLSX.utils.book_append_sheet(wb, wsSedes, "01_Sedes");
    XLSX.utils.book_append_sheet(wb, wsAgentes, "02_Personal_Agentes");
    XLSX.utils.book_append_sheet(wb, wsBienes, "03_Catalogo_Bienes");
    XLSX.utils.book_append_sheet(wb, wsServicios, "04_Servicios");
    XLSX.utils.book_append_sheet(wb, wsClientes, "05_Clientes");
    XLSX.utils.book_append_sheet(wb, wsCuentas, "06_Cuentas_Financieras");
    XLSX.utils.book_append_sheet(wb, wsPasarelas, "07_Pasarelas_POS");
    XLSX.utils.book_append_sheet(wb, wsUbicaciones, "08_Ubicaciones_WFM");

    XLSX.writeFile(wb, "Plantilla_Maestra_Aprovisionamiento_Sede_Vaikuntha.xlsx");
    setDropdownOpen(false);
  };

  // Descargas individuales modulares (8 Módulos)
  const descargarModulo = (tipo: 'SEDES' | 'AGENTES' | 'BIENES' | 'SERVICIOS' | 'CLIENTES' | 'CUENTAS' | 'PASARELAS' | 'UBICACIONES') => {
    const wb = XLSX.utils.book_new();

    switch (tipo) {
      case 'SEDES':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_SEDES), "Sedes");
        XLSX.writeFile(wb, "Plantilla_01_Sedes.xlsx");
        break;
      case 'AGENTES':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_AGENTES), "Personal_Agentes");
        XLSX.writeFile(wb, "Plantilla_02_Personal_Agentes.xlsx");
        break;
      case 'BIENES':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_BIENES), "Catalogo_Bienes");
        XLSX.writeFile(wb, "Plantilla_03_Catalogo_Bienes.xlsx");
        break;
      case 'SERVICIOS':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_SERVICIOS), "Servicios");
        XLSX.writeFile(wb, "Plantilla_04_Servicios.xlsx");
        break;
      case 'CLIENTES':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_CLIENTES), "Clientes");
        XLSX.writeFile(wb, "Plantilla_05_Clientes.xlsx");
        break;
      case 'CUENTAS':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_CUENTAS_FINANCIERAS), "Cuentas_Financieras");
        XLSX.writeFile(wb, "Plantilla_06_Cuentas_Financieras.xlsx");
        break;
      case 'PASARELAS':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_PASARELAS_POS), "Pasarelas_POS");
        XLSX.writeFile(wb, "Plantilla_07_Pasarelas_POS.xlsx");
        break;
      case 'UBICACIONES':
        XLSX.utils.book_append_sheet(wb, formatWorksheet(PLANTILLA_UBICACIONES), "Ubicaciones_WFM");
        XLSX.writeFile(wb, "Plantilla_08_Ubicaciones_WFM.xlsx");
        break;
    }

    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Botón Principal: Descargar Libro Maestro de 8 Hojas */}
      <button
        type="button"
        onClick={descargarLibroMaestro}
        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-xl shadow-xs text-xs font-bold transition cursor-pointer"
        title="Descargar Kit Maestro con las 8 plantillas operativas oficiales"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Descargar Plantillas Excel</span>
      </button>

      {/* Flecha Toggle Dropdown */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl border-l border-emerald-500/40 shadow-xs transition cursor-pointer"
        title="Opciones de descarga modular por módulo"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable Modular (8 Módulos) */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1 max-h-96 overflow-y-auto">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Kit Maestro de Aprovisionamiento (8 Plantillas)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Descarga el libro completo o la plantilla individual de cada área:
            </p>
          </div>

          {/* Opción Libro Maestro 8 Hojas */}
          <button
            type="button"
            onClick={descargarLibroMaestro}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group border border-emerald-200/60 dark:border-emerald-800/60"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
              <div>
                <strong className="text-xs font-bold text-slate-800 dark:text-white block">
                  Libro Maestro Completo (.xlsx)
                </strong>
                <span className="text-[10px] text-slate-500">8 hojas operativas oficiales Vaikuntha</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
              Oficial
            </span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

          {/* Opciones Modulares (8 Tablas) */}
          <button
            type="button"
            onClick={() => descargarModulo('SEDES')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">01. Sedes & Sucursales</span>
              <span className="text-[10px] text-slate-400">RUC, razón social, dirección, ciudad</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('AGENTES')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">02. Personal & Agentes</span>
              <span className="text-[10px] text-slate-400">Staff, soporte, roles y estados</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('BIENES')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-cyan-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">03. Catálogo de Bienes</span>
              <span className="text-[10px] text-slate-400">Retail e insumos de taller, SKU, costos</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('SERVICIOS')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-pink-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">04. Servicios de Salón</span>
              <span className="text-[10px] text-slate-400">Precios de lista y categorías de servicio</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('CLIENTES')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">05. Directorio de Clientes</span>
              <span className="text-[10px] text-slate-400">DNI, nombres, celular y email</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('CUENTAS')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5 text-blue-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">06. Cuentas Financieras & Bancos</span>
              <span className="text-[10px] text-slate-400">Caja chica, BCP, BBVA, Yape y saldos iniciales</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('PASARELAS')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-purple-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">07. Pasarelas de Cobro POS</span>
              <span className="text-[10px] text-slate-400">Izipay, Niubiz, comisiones %, D+1</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => descargarModulo('UBICACIONES')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer"
          >
            <Armchair className="w-3.5 h-3.5 text-orange-500" />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">08. Ubicaciones & Puestos WFM</span>
              <span className="text-[10px] text-slate-400">Sillones, lavaderos, cabinas de estética</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
