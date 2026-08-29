"use client";

import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Download, FileSpreadsheet, ChevronDown, Check, 
  Building2, Users, Package, Scissors, Sparkles, Layers 
} from "lucide-react";

// Datos de ejemplo para las plantillas
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

const PLANTILLA_AGENTES = [
  {
    nombre: "Jean Pierre Valdivia",
    email: "jean.pierre@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Master Colorista & Balayage",
    comision_porcentaje: 45.0,
    sueldo_base: 1500.00,
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Carla Mendoza Reyes",
    email: "carla.mendoza@vaikuntha.pe",
    rol: "STAFF",
    especialidad: "Estilista Senior & Peinados",
    comision_porcentaje: 40.0,
    sueldo_base: 1400.00,
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Rodrigo Morales Alva",
    email: "rodrigo.morales@vaikuntha.pe",
    rol: "SOPORTE",
    especialidad: "Asistente de Lavado & Masajes Capilares",
    comision_porcentaje: 10.0,
    sueldo_base: 1200.00,
    estado_operativo: "DISPONIBLE"
  },
  {
    nombre: "Luciana Salazar Peña",
    email: "luciana.salazar@vaikuntha.pe",
    rol: "RECEPCION",
    especialidad: "Atención al Cliente & Agenda",
    comision_porcentaje: 0.0,
    sueldo_base: 1600.00,
    estado_operativo: "DISPONIBLE"
  }
];

const PLANTILLA_BIENES = [
  {
    nombre: "Shampoo Serie Expert Absolut Repair 300ml",
    sku: "LOR-SH-ABS-300",
    tipo_bien: "producto",
    categoria: "PRODUCTOS_RETAIL",
    costo_base: 45.00,
    precio_venta: 85.00,
    stock_inicial: 24,
    stock_minimo: 6
  },
  {
    nombre: "Mascarilla Capilar Nutritiva Metal Detox 250ml",
    sku: "LOR-MK-MTD-250",
    tipo_bien: "producto",
    categoria: "PRODUCTOS_RETAIL",
    costo_base: 65.00,
    precio_venta: 120.00,
    stock_inicial: 18,
    stock_minimo: 4
  },
  {
    nombre: "Tinte Inoa Sin Amoníaco 60g - Tono 6.0 Rubio Oscuro",
    sku: "LOR-INO-60G-60",
    tipo_bien: "insumo",
    categoria: "INSUMOS_TALLER",
    costo_base: 24.00,
    precio_venta: 45.00,
    stock_inicial: 50,
    stock_minimo: 10
  },
  {
    nombre: "Oxidante en Crema 20 Volúmenes 1000ml",
    sku: "LOR-OX-20V-1000",
    tipo_bien: "insumo",
    categoria: "INSUMOS_TALLER",
    costo_base: 32.00,
    precio_venta: 60.00,
    stock_inicial: 30,
    stock_minimo: 8
  },
  {
    nombre: "Repuesto Resistencia Térmica Secadora Parlux 385",
    sku: "REP-RES-PAR-385",
    tipo_bien: "repuesto",
    categoria: "REPUESTOS_MANTENIMIENTO",
    costo_base: 85.00,
    precio_venta: 140.00,
    stock_inicial: 6,
    stock_minimo: 2
  }
];

const PLANTILLA_SERVICIOS = [
  {
    nombre: "Balayage Signature & Matización Gloss",
    categoria: "COLORACION",
    duracion_minutos: 180,
    precio_base: 380.00,
    comision_sugerida: 45.0
  },
  {
    nombre: "Corte de Diseño & Styling Térmico",
    categoria: "CORTE",
    duracion_minutos: 60,
    precio_base: 95.00,
    comision_sugerida: 40.0
  },
  {
    nombre: "Tratamiento Ritual Molecular Absolut Repair",
    categoria: "TRATAMIENTOS",
    duracion_minutos: 45,
    precio_base: 140.00,
    comision_sugerida: 35.0
  },
  {
    nombre: "Manicure Spa & Esmaltado Semipermanente",
    categoria: "MANICURE",
    duracion_minutos: 50,
    precio_base: 65.00,
    comision_sugerida: 40.0
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

  // Descarga del Libro Maestro Multi-Pestaña
  const descargarLibroMaestro = () => {
    const wb = XLSX.utils.book_new();

    const wsSedes = formatWorksheet(PLANTILLA_SEDES);
    const wsAgentes = formatWorksheet(PLANTILLA_AGENTES);
    const wsBienes = formatWorksheet(PLANTILLA_BIENES);
    const wsServicios = formatWorksheet(PLANTILLA_SERVICIOS);

    XLSX.utils.book_append_sheet(wb, wsSedes, "01_Sedes");
    XLSX.utils.book_append_sheet(wb, wsAgentes, "02_Personal_Agentes");
    XLSX.utils.book_append_sheet(wb, wsBienes, "03_Catalogo_Bienes");
    XLSX.utils.book_append_sheet(wb, wsServicios, "04_Servicios");

    XLSX.writeFile(wb, "Plantilla_Maestra_Carga_Sede_Vaikuntha.xlsx");
    setDropdownOpen(false);
  };

  // Descargas individuales modulares
  const descargarModulo = (tipo: 'SEDES' | 'AGENTES' | 'BIENES' | 'SERVICIOS') => {
    const wb = XLSX.utils.book_new();

    if (tipo === 'SEDES') {
      const ws = formatWorksheet(PLANTILLA_SEDES);
      XLSX.utils.book_append_sheet(wb, ws, "Sedes");
      XLSX.writeFile(wb, "Plantilla_Carga_Sedes.xlsx");
    } else if (tipo === 'AGENTES') {
      const ws = formatWorksheet(PLANTILLA_AGENTES);
      XLSX.utils.book_append_sheet(wb, ws, "Personal_Agentes");
      XLSX.writeFile(wb, "Plantilla_Carga_Personal_Agentes.xlsx");
    } else if (tipo === 'BIENES') {
      const ws = formatWorksheet(PLANTILLA_BIENES);
      XLSX.utils.book_append_sheet(wb, ws, "Catalogo_Bienes");
      XLSX.writeFile(wb, "Plantilla_Carga_Catalogo_Bienes.xlsx");
    } else if (tipo === 'SERVICIOS') {
      const ws = formatWorksheet(PLANTILLA_SERVICIOS);
      XLSX.utils.book_append_sheet(wb, ws, "Servicios");
      XLSX.writeFile(wb, "Plantilla_Carga_Servicios.xlsx");
    }

    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Botón Principal: Descargar Libro Maestro */}
      <button
        type="button"
        onClick={descargarLibroMaestro}
        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-xl shadow-xs text-xs font-bold transition cursor-pointer"
        title="Descargar Libro Maestro con todas las pestañas (Sedes, Personal, Bienes, Servicios)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Descargar Plantillas Excel</span>
      </button>

      {/* Flecha Toggle Dropdown */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl border-l border-emerald-500/40 shadow-xs transition cursor-pointer"
        title="Opciones de descarga modular"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menú Desplegable Modular */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Formatos de Carga Masiva
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Elige el paquete o la plantilla modular:
            </p>
          </div>

          {/* Opción Libro Maestro */}
          <button
            type="button"
            onClick={descargarLibroMaestro}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
              <div>
                <strong className="text-xs font-bold text-slate-800 dark:text-white block">
                  Libro Maestro Completo (.xlsx)
                </strong>
                <span className="text-[10px] text-slate-500">4 hojas (Sedes, Personal, Bienes, Servicios)</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
              Recomendado
            </span>
          </button>

          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

          {/* Opciones Modulares Individuales */}
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
              <span className="text-[10px] text-slate-400">Staff, soporte, comisiones y sueldos</span>
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
              <span className="text-[10px] text-slate-400">Retail, insumos taller, repuestos</span>
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
              <span className="text-[10px] text-slate-400">Precios, duración y comisiones</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
