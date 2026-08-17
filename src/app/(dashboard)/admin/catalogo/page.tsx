'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, RefreshCw, Box, Tag, DollarSign, Database, ChevronDown, ChevronRight, Edit2, Archive, ArchiveRestore, Edit3, Settings2, Scissors, Palette, Sparkles, Hand, Clock, Armchair, Percent, Award, Trash2, Droplet, Shield, Barcode, TrendingUp, Scale, Activity, Cpu, Wifi, Bluetooth, Wrench, Calendar, AlertCircle, CreditCard, Wind, Flame, Smartphone, Zap } from 'lucide-react';
import { getCatalogo, guardarBien, inactivarBien, actualizarJerarquia, inactivarJerarquia } from './actions';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { obtenerModelosBienes, ModeloBien } from '@/services/modelosBienes';

import { ConfirmDialog, PromptDialog } from '@/components/ui/PremiumDialog';
import { BulkUploader } from '@/components/ui/BulkUploader';
import { CatalogoMatricialView } from '@/components/admin/CatalogoMatricialView';

function getFirst3Letters(str: string) {
  if (!str) return 'XXX';
  return String(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
}

export default function CatalogoMasterPage() {
  const [vistaModo, setVistaModo] = useState<'matricial' | 'jerarquica'>('matricial');
  const [bienes, setBienes] = useState<any[]>([]);
  const [modelosServicio, setModelosServicio] = useState<ModeloBien[]>([]);
  const [modelosProducto, setModelosProducto] = useState<ModeloBien[]>([]);
  const [modelosInsumo, setModelosInsumo] = useState<ModeloBien[]>([]);
  const [modelosEquipo, setModelosEquipo] = useState<ModeloBien[]>([]);
  const [modelosMueble, setModelosMueble] = useState<ModeloBien[]>([]);
  const [modelosMaquina, setModelosMaquina] = useState<ModeloBien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'insumo' | 'producto' | 'servicio' | 'equipo' | 'mueble' | 'maquina'>('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const [expandedMarcas, setExpandedMarcas] = useState<Record<string, boolean>>({});
  const [expandedLineas, setExpandedLineas] = useState<Record<string, boolean>>({});

  // Dialogs State
  const [promptConfig, setPromptConfig] = useState<any>({ isOpen: false });
  const [confirmConfig, setConfirmConfig] = useState<any>({ isOpen: false });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    nombre: '', categoria: '', tipo_bien: 'producto', precio_venta: 0,
    marca: '', linea: '', presentacion: '', proveedor: '', costo_unitario: 0,
    tipo_catalogo: 'retail', stockInicial: 0,
    codigo_barras: '',
    stock_minimo_alerta: 5,
    comision_venta_porcentaje: 10,
    // Metrología Insumo / Balanzas IoT
    peso_neto_total_gramos: 60,
    peso_envase_tara_gramos: 12,
    factor_densidad: 1.0,
    merma_tolerancia_porcentaje: 3.0,
    pao_meses: 12,
    unidad_medida: 'g',
    stock_minimo_alerta_gramos: 120,
    area_produccion_boh: 'LABORATORIO_CENTRAL',
    // Equipo / Dispositivo / Hardware & Depreciación
    numero_serie: '',
    mac_address: '',
    bluetooth_uuid: '',
    ip_address: '',
    protocolo_comunicacion: 'STANDALONE_PLUG',
    estacion_asignada: 'Almacén Técnico',
    estado_operativo: 'OPERATIVO',
    vida_util_meses_base: 24,
    meses_extension_reparacion: 0,
    fecha_adquisicion: new Date().toISOString().split('T')[0],
    valor_residual_estimado: 0,
    frecuencia_mantenimiento_dias: 90,
    fecha_ultimo_mantenimiento: '',
    historial_reparaciones_partes: [],
    // Muebles / Estaciones de Trabajo & Ergonomía
    codigo_patrimonial_tag: '',
    tipo_mueble: 'SILLON_CORTE',
    capacidad_carga_kg: 180,
    grados_reclinacion: 45,
    material_tapiz: 'Vinil Náutico Antimanchas',
    // Máquinas & Aparatología Termo-Mecánica
    tipo_maquina: 'CLIMAZON_TERMOESTIMULADOR',
    potencia_watts: 1400,
    voltaje_operacion: '220V',
    horas_uso_acumuladas: 0,
    horas_vida_util_maxima: 6000,
    frecuencia_overhaul_horas: 500,
    temperatura_maxima_c: 70,
    presion_maxima_bar: 0,
    // Servicio
    modelo_id: null,
    duracion_minutos: 45,
    estacion_sugerida: 'Sillón de Corte',
    comision_porcentaje: 40,
    requiere_insumos_taller: false,
    receta_insumos: [],
    puntos_vp_otorgados: 5
  });

  const cargarBienes = async () => {
    setIsLoading(true);
    try {
      const [data, moldesSrv, moldesProd, moldesIns, moldesEq, moldesMue, moldesMaq] = await Promise.all([
        getCatalogo(filtroTipo, mostrarInactivos),
        obtenerModelosBienes('SERVICIO'),
        obtenerModelosBienes('PRODUCTO'),
        obtenerModelosBienes('INSUMO'),
        obtenerModelosBienes('EQUIPO_DISPOSITIVO'),
        obtenerModelosBienes('MUEBLE'),
        obtenerModelosBienes('MAQUINA')
      ]);
      if (data) setBienes(data);
      if (moldesSrv) setModelosServicio(moldesSrv);
      if (moldesProd) setModelosProducto(moldesProd);
      if (moldesIns) setModelosInsumo(moldesIns);
      if (moldesEq) setModelosEquipo(moldesEq);
      if (moldesMue) setModelosMueble(moldesMue);
      if (moldesMaq) setModelosMaquina(moldesMaq);
    } catch (error: any) {
      alert("Error cargando catálogo: " + error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarBienes();
  }, [filtroTipo, mostrarInactivos]);

  const aplicarMoldeServicio = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'servicio',
      tipo_bien: 'servicio',
      linea: molde.categoria_default || prev.linea || 'Servicios',
      categoria: molde.categoria_default || prev.categoria || 'Servicios',
      duracion_minutos: esquema.duracion_minutos || 45,
      estacion_sugerida: esquema.estacion_sugerida || 'Sillón de Corte',
      comision_porcentaje: esquema.comision_porcentaje || 40,
      requiere_insumos_taller: Boolean(esquema.requiere_insumos_taller),
      receta_insumos: Array.isArray(esquema.receta_insumos) ? JSON.parse(JSON.stringify(esquema.receta_insumos)) : [],
      puntos_vp_otorgados: esquema.puntos_vp_otorgados || 5
    }));
  };

  const aplicarMoldeProducto = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'retail',
      tipo_bien: 'producto',
      linea: molde.categoria_default || prev.linea || 'Cuidado Diario',
      categoria: molde.categoria_default || prev.categoria || 'Cuidado Diario',
      presentacion: esquema.presentacion_default || prev.presentacion || 'Unidad',
      stock_minimo_alerta: esquema.stock_minimo_alerta || 5,
      comision_venta_porcentaje: esquema.comision_venta_porcentaje || 10,
      puntos_vp_otorgados: esquema.puntos_vp_otorgados || 10
    }));
  };

  const aplicarMoldeInsumo = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'insumo',
      tipo_bien: 'insumo',
      linea: molde.categoria_default || prev.linea || 'Colorimetría & Tinturas',
      categoria: molde.categoria_default || prev.categoria || 'Colorimetría & Tinturas',
      presentacion: esquema.presentacion_default || prev.presentacion || 'Tubo 60g',
      unidad_medida: esquema.unidad_medida || 'g',
      peso_neto_total_gramos: esquema.peso_neto_total_gramos || 60,
      peso_envase_tara_gramos: esquema.peso_envase_tara_gramos || 12,
      factor_densidad: esquema.factor_densidad || 1.0,
      merma_tolerancia_porcentaje: esquema.merma_tolerancia_porcentaje || 3.0,
      pao_meses: esquema.pao_meses || 12,
      stock_minimo_alerta_gramos: esquema.stock_minimo_alerta_gramos || 120,
      area_produccion_boh: esquema.area_produccion_boh || 'LABORATORIO_CENTRAL'
    }));
  };

  const aplicarMoldeEquipo = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'equipo',
      tipo_bien: 'equipo',
      linea: molde.categoria_default || prev.linea || 'Hardware & IoT',
      categoria: molde.categoria_default || prev.categoria || 'Hardware & IoT',
      protocolo_comunicacion: esquema.protocolo_comunicacion || 'STANDALONE_PLUG',
      estacion_asignada: esquema.estacion_sugerida || 'Almacén Técnico',
      vida_util_meses_base: esquema.vida_util_meses_base || 24,
      meses_extension_reparacion: 0,
      frecuencia_mantenimiento_dias: esquema.frecuencia_mantenimiento_dias || 90,
      estado_operativo: 'OPERATIVO'
    }));
  };

  const aplicarMoldeMueble = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'mueble',
      tipo_bien: 'mueble',
      linea: molde.categoria_default || prev.linea || 'Mobiliario de Salón',
      categoria: molde.categoria_default || prev.categoria || 'Mobiliario de Salón',
      tipo_mueble: esquema.tipo_mueble || 'SILLON_CORTE',
      estacion_asignada: esquema.estacion_sugerida || 'Sillón de Corte',
      capacidad_carga_kg: esquema.capacidad_carga_kg || 180,
      grados_reclinacion: esquema.grados_reclinacion || 0,
      material_tapiz: esquema.material_tapiz || 'Vinil Náutico Antimanchas',
      vida_util_meses_base: esquema.vida_util_meses_base || 48,
      meses_extension_reparacion: 0,
      frecuencia_mantenimiento_dias: esquema.frecuencia_mantenimiento_dias || 90,
      estado_operativo: 'OPERATIVO'
    }));
  };

  const aplicarMoldeMaquina = (molde: ModeloBien) => {
    const esquema = (molde.esquema_atributos || {}) as any;
    setFormData((prev: any) => ({
      ...prev,
      modelo_id: molde.id,
      tipo_catalogo: 'maquina',
      tipo_bien: 'maquina',
      linea: molde.categoria_default || prev.linea || 'Aparatología & Máquinas Capilares',
      categoria: molde.categoria_default || prev.categoria || 'Aparatología & Máquinas Capilares',
      tipo_maquina: esquema.tipo_maquina || 'CLIMAZON_TERMOESTIMULADOR',
      estacion_asignada: esquema.estacion_sugerida || 'Área Técnica / Colorimetría',
      potencia_watts: esquema.potencia_watts || 1400,
      voltaje_operacion: esquema.voltaje_operacion || '220V',
      horas_uso_acumuladas: 0,
      horas_vida_util_maxima: esquema.horas_vida_util_maxima || 6000,
      frecuencia_overhaul_horas: esquema.frecuencia_overhaul_horas || 500,
      vida_util_meses_base: esquema.vida_util_meses_base || 60,
      meses_extension_reparacion: 0,
      frecuencia_mantenimiento_dias: esquema.frecuencia_mantenimiento_dias || 90,
      temperatura_maxima_c: esquema.temperatura_maxima_c || 70,
      presion_maxima_bar: esquema.presion_maxima_bar || 0,
      estado_operativo: 'OPERATIVO'
    }));
  };

  const bienesFiltrados = useMemo(() => {
    return bienes.filter(b => 
      b.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) || 
      b.atributos_producto?.sku?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      b.categoria?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      b.atributos_producto?.marca?.toLowerCase().includes(filtroTexto.toLowerCase())
    );
  }, [bienes, filtroTexto]);

  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {};
    bienesFiltrados.forEach(bien => {
      const marca = bien.atributos_producto?.marca || 'Marca_Generica';
      const linea = bien.atributos_producto?.linea || bien.categoria || 'Linea_Generica';
      if (!groups[marca]) groups[marca] = {};
      if (!groups[marca][linea]) groups[marca][linea] = [];
      groups[marca][linea].push(bien);
    });
    return groups;
  }, [bienesFiltrados]);

  const toggleMarca = (marca: string) => setExpandedMarcas(prev => ({...prev, [marca]: !prev[marca]}));
  const toggleLinea = (lineaKey: string) => setExpandedLineas(prev => ({...prev, [lineaKey]: !prev[lineaKey]}));

  const openModal = (item?: any) => {
    if (item) {
      setEditItem(item);
      const tipoCat = item.tipo_bien === 'servicio' || item.es_servicio 
        ? 'servicio' 
        : (item.tipo_bien === 'insumo' || item.es_insumo_taller || item.atributos_producto?.tipo_catalogo === 'insumo'
          ? 'insumo'
          : (item.tipo_bien === 'equipo' || item.es_equipo_dispositivo || item.atributos_producto?.tipo_catalogo === 'equipo'
            ? 'equipo'
            : (item.tipo_bien === 'mueble' || item.es_mueble || item.atributos_producto?.tipo_catalogo === 'mueble'
              ? 'mueble'
              : (item.tipo_bien === 'maquina' || item.es_maquina || item.atributos_producto?.tipo_catalogo === 'maquina'
                ? 'maquina'
                : 'retail'))));

      setFormData({
        nombre: item.nombre,
        categoria: item.categoria,
        tipo_bien: item.tipo_bien,
        precio_venta: item.precio_venta || 0,
        marca: item.atributos_producto?.marca || '',
        linea: item.atributos_producto?.linea || item.categoria || '',
        presentacion: item.atributos_producto?.presentacion || '',
        proveedor: item.atributos_producto?.proveedor || '',
        costo_unitario: item.atributos_producto?.costo_unitario || item.costo_base || 0,
        tipo_catalogo: tipoCat,
        stockInicial: 0,
        codigo_barras: item.codigo_barras || item.atributos_producto?.codigo_barras || '',
        stock_minimo_alerta: item.atributos_producto?.stock_minimo_alerta || 5,
        comision_venta_porcentaje: item.atributos_producto?.comision_venta_porcentaje || 10,
        // Insumo IoT
        peso_neto_total_gramos: item.peso_neto_total_gramos || 60,
        peso_envase_tara_gramos: item.peso_envase_tara_gramos || 12,
        factor_densidad: item.factor_densidad || 1.0,
        merma_tolerancia_porcentaje: item.merma_tolerancia_porcentaje || 3.0,
        pao_meses: item.pao_meses || 12,
        unidad_medida: item.unidad_medida || 'g',
        stock_minimo_alerta_gramos: item.atributos_producto?.stock_minimo_alerta_gramos || 120,
        area_produccion_boh: item.area_produccion_boh || 'LABORATORIO_CENTRAL',
        // Hardware / Depreciación
        numero_serie: item.numero_serie || '',
        mac_address: item.mac_address || '',
        bluetooth_uuid: item.bluetooth_uuid || '',
        ip_address: item.ip_address || '',
        protocolo_comunicacion: item.protocolo_comunicacion || 'STANDALONE_PLUG',
        estacion_asignada: item.estacion_asignada || 'Almacén Técnico',
        estado_operativo: item.estado_operativo || 'OPERATIVO',
        vida_util_meses_base: item.vida_util_meses_base || 24,
        meses_extension_reparacion: item.meses_extension_reparacion || 0,
        fecha_adquisicion: item.fecha_adquisicion || new Date().toISOString().split('T')[0],
        valor_residual_estimado: item.valor_residual_estimado || 0,
        frecuencia_mantenimiento_dias: item.frecuencia_mantenimiento_dias || 90,
        fecha_ultimo_mantenimiento: item.fecha_ultimo_mantenimiento || '',
        historial_reparaciones_partes: Array.isArray(item.historial_reparaciones_partes) ? item.historial_reparaciones_partes : [],
        // Muebles
        codigo_patrimonial_tag: item.codigo_patrimonial_tag || '',
        tipo_mueble: item.tipo_mueble || 'SILLON_CORTE',
        capacidad_carga_kg: item.capacidad_carga_kg || 180,
        grados_reclinacion: item.grados_reclinacion || 0,
        material_tapiz: item.material_tapiz || 'Vinil Náutico Antimanchas',
        // Máquinas
        tipo_maquina: item.tipo_maquina || 'CLIMAZON_TERMOESTIMULADOR',
        potencia_watts: item.potencia_watts || 1400,
        voltaje_operacion: item.voltaje_operacion || '220V',
        horas_uso_acumuladas: item.horas_uso_acumuladas || 0,
        horas_vida_util_maxima: item.horas_vida_util_maxima || 6000,
        frecuencia_overhaul_horas: item.frecuencia_overhaul_horas || 500,
        temperatura_maxima_c: item.temperatura_maxima_c || 70,
        presion_maxima_bar: item.presion_maxima_bar || 0,
        // Servicio
        modelo_id: item.modelo_id || null,
        duracion_minutos: item.duracion_minutos || item.atributos_servicio?.duracion_minutos || 45,
        estacion_sugerida: item.atributos_servicio?.estacion_sugerida || 'Sillón de Corte',
        comision_porcentaje: item.comision_porcentaje || 40,
        requiere_insumos_taller: Boolean(item.receta_insumos && item.receta_insumos.length > 0),
        receta_insumos: Array.isArray(item.receta_insumos) ? item.receta_insumos : [],
        puntos_vp_otorgados: item.atributos_ecosistema?.mnsh_gamification?.xp_otorgado || 5
      });
    } else {
      setEditItem(null);
      setFormData({
        nombre: '', categoria: '', tipo_bien: filtroTipo === 'servicio' ? 'servicio' : (filtroTipo === 'insumo' ? 'insumo' : (filtroTipo === 'equipo' ? 'equipo' : (filtroTipo === 'mueble' ? 'mueble' : (filtroTipo === 'maquina' ? 'maquina' : 'producto')))), precio_venta: 0,
        marca: '', linea: '', presentacion: '', proveedor: '', costo_unitario: 0,
        tipo_catalogo: filtroTipo === 'servicio' ? 'servicio' : (filtroTipo === 'insumo' ? 'insumo' : (filtroTipo === 'equipo' ? 'equipo' : (filtroTipo === 'mueble' ? 'mueble' : (filtroTipo === 'maquina' ? 'maquina' : 'retail')))), stockInicial: 0,
        codigo_barras: '',
        stock_minimo_alerta: 5,
        comision_venta_porcentaje: 10,
        peso_neto_total_gramos: 60,
        peso_envase_tara_gramos: 12,
        factor_densidad: 1.0,
        merma_tolerancia_porcentaje: 3.0,
        pao_meses: 12,
        unidad_medida: 'g',
        stock_minimo_alerta_gramos: 120,
        area_produccion_boh: 'LABORATORIO_CENTRAL',
        numero_serie: '',
        mac_address: '',
        bluetooth_uuid: '',
        ip_address: '',
        protocolo_comunicacion: 'STANDALONE_PLUG',
        estacion_asignada: 'Almacén Técnico',
        estado_operativo: 'OPERATIVO',
        vida_util_meses_base: 24,
        meses_extension_reparacion: 0,
        fecha_adquisicion: new Date().toISOString().split('T')[0],
        valor_residual_estimado: 0,
        frecuencia_mantenimiento_dias: 90,
        fecha_ultimo_mantenimiento: '',
        historial_reparaciones_partes: [],
        codigo_patrimonial_tag: '',
        tipo_mueble: 'SILLON_CORTE',
        capacidad_carga_kg: 180,
        grados_reclinacion: 45,
        material_tapiz: 'Vinil Náutico Antimanchas',
        tipo_maquina: 'CLIMAZON_TERMOESTIMULADOR',
        potencia_watts: 1400,
        voltaje_operacion: '220V',
        horas_uso_acumuladas: 0,
        horas_vida_util_maxima: 6000,
        frecuencia_overhaul_horas: 500,
        temperatura_maxima_c: 70,
        presion_maxima_bar: 0,
        modelo_id: null,
        duracion_minutos: 45,
        estacion_sugerida: 'Sillón de Corte',
        comision_porcentaje: 40,
        requiere_insumos_taller: false,
        receta_insumos: [],
        puntos_vp_otorgados: 5
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const esServicio = formData.tipo_catalogo === 'servicio';
    const esInsumo = formData.tipo_catalogo === 'insumo';
    const esEquipo = formData.tipo_catalogo === 'equipo';
    const esMueble = formData.tipo_catalogo === 'mueble';
    const esMaquina = formData.tipo_catalogo === 'maquina';
    const tipoSku = esServicio ? 'SRV' : (esInsumo ? 'INS' : (esEquipo ? 'EQP' : (esMueble ? 'MUE' : (esMaquina ? 'MAQ' : 'RET'))));
    const skuMarca = formData.marca || (esServicio ? 'SALON' : (esEquipo ? 'HARDWARE' : (esMueble ? 'MOBILIARIO' : (esMaquina ? 'MAQUINARIA' : 'Marca_Generica'))));
    const skuLinea = formData.linea || formData.categoria || 'General';
    const skuPres = formData.presentacion || (esServicio ? 'Sesion' : (esEquipo || esMueble || esMaquina ? 'Unidad' : 'Pres_Generica'));
    const sku = `${getFirst3Letters(skuMarca)}-${getFirst3Letters(skuLinea)}-${getFirst3Letters(formData.nombre)}-${tipoSku}-${getFirst3Letters(skuPres)}`;
    
    const payload = {
      nombre: formData.nombre,
      categoria: formData.linea || formData.categoria,
      tipo_bien: esServicio ? 'servicio' : (esInsumo ? 'insumo' : (esEquipo ? 'equipo' : (esMueble ? 'mueble' : (esMaquina ? 'maquina' : 'producto')))),
      precio_venta: parseFloat(formData.precio_venta) || 0,
      stockInicial: parseInt(formData.stockInicial) || 0,
      codigo_barras: formData.codigo_barras || null,
      modelo_id: formData.modelo_id || null,
      duracion_minutos: parseInt(formData.duracion_minutos) || 30,
      comision_porcentaje: parseFloat(formData.comision_porcentaje) || 0,
      es_servicio: esServicio,
      receta_insumos: formData.receta_insumos || [],
      // Parámetros Metrológicos IoT
      peso_neto_total_gramos: parseFloat(formData.peso_neto_total_gramos) || 0,
      peso_envase_tara_gramos: parseFloat(formData.peso_envase_tara_gramos) || 0,
      factor_densidad: parseFloat(formData.factor_densidad) || 1.0,
      merma_tolerancia_porcentaje: parseFloat(formData.merma_tolerancia_porcentaje) || 3.0,
      pao_meses: parseInt(formData.pao_meses) || 12,
      unidad_medida: formData.unidad_medida || 'g',
      area_produccion_boh: formData.area_produccion_boh || 'LABORATORIO_CENTRAL',
      // Hardware / Depreciación & Reparación
      numero_serie: formData.numero_serie || null,
      mac_address: formData.mac_address || null,
      bluetooth_uuid: formData.bluetooth_uuid || null,
      ip_address: formData.ip_address || null,
      protocolo_comunicacion: formData.protocolo_comunicacion || 'STANDALONE_PLUG',
      estacion_asignada: formData.estacion_asignada || 'Almacén Técnico',
      estado_operativo: formData.estado_operativo || 'OPERATIVO',
      vida_util_meses_base: parseInt(formData.vida_util_meses_base) || 24,
      meses_extension_reparacion: parseInt(formData.meses_extension_reparacion) || 0,
      fecha_adquisicion: formData.fecha_adquisicion || new Date().toISOString().split('T')[0],
      valor_residual_estimado: parseFloat(formData.valor_residual_estimado) || 0,
      frecuencia_mantenimiento_dias: parseInt(formData.frecuencia_mantenimiento_dias) || 90,
      fecha_ultimo_mantenimiento: formData.fecha_ultimo_mantenimiento || null,
      historial_reparaciones_partes: formData.historial_reparaciones_partes || [],
      // Muebles & Estaciones
      codigo_patrimonial_tag: formData.codigo_patrimonial_tag || null,
      tipo_mueble: formData.tipo_mueble || 'SILLON_CORTE',
      capacidad_carga_kg: parseFloat(formData.capacidad_carga_kg) || 180,
      grados_reclinacion: parseFloat(formData.grados_reclinacion) || 0,
      material_tapiz: formData.material_tapiz || 'Vinil Náutico Antimanchas',
      // Máquinas & Termo-Mecánica
      es_maquina: esMaquina,
      tipo_maquina: formData.tipo_maquina || 'CLIMAZON_TERMOESTIMULADOR',
      potencia_watts: parseFloat(formData.potencia_watts) || 0,
      voltaje_operacion: formData.voltaje_operacion || '220V',
      horas_uso_acumuladas: parseFloat(formData.horas_uso_acumuladas) || 0,
      horas_vida_util_maxima: parseFloat(formData.horas_vida_util_maxima) || 6000,
      frecuencia_overhaul_horas: parseFloat(formData.frecuencia_overhaul_horas) || 500,
      temperatura_maxima_c: parseFloat(formData.temperatura_maxima_c) || null,
      presion_maxima_bar: parseFloat(formData.presion_maxima_bar) || null,
      atributos_servicio: {
        duracion_minutos: parseInt(formData.duracion_minutos) || 30,
        estacion_sugerida: formData.estacion_sugerida || 'Sillón de Corte',
        comision_porcentaje: parseFloat(formData.comision_porcentaje) || 0,
        requiere_insumos_taller: Boolean(formData.requiere_insumos_taller)
      },
      atributos_ecosistema: {
        mnsh_gamification: {
          xp_otorgado: parseInt(formData.puntos_vp_otorgados) || 5,
          puntos_vp: parseInt(formData.puntos_vp_otorgados) || 5
        },
        sunat_fiscal: {
          tipo_afectacion_igv: '10',
          unidad_medida_sunat: esServicio ? 'ZZ' : (formData.unidad_medida === 'g' ? 'GRM' : (formData.unidad_medida === 'ml' ? 'MLT' : 'NIU'))
        }
      },
      atributos_producto: {
        sku,
        marca: formData.marca,
        linea: formData.linea,
        presentacion: formData.presentacion,
        proveedor: formData.proveedor,
        costo_unitario: parseFloat(formData.costo_unitario) || 0,
        codigo_barras: formData.codigo_barras,
        stock_minimo_alerta: parseInt(formData.stock_minimo_alerta) || 5,
        stock_minimo_alerta_gramos: parseFloat(formData.stock_minimo_alerta_gramos) || 120,
        comision_venta_porcentaje: parseFloat(formData.comision_venta_porcentaje) || 10,
        tipo_catalogo: formData.tipo_catalogo,
        estado: editItem?.atributos_producto?.estado // preserve state
      }
    };

    try {
      await guardarBien(editItem?.id || null, payload, sedeActiva?.id || '', true);
      setIsModalOpen(false);
      cargarBienes();
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    }
  };

  const toggleStatus = async (id: string, currentlyInactive: boolean) => {
    setConfirmConfig({
      isOpen: true,
      title: currentlyInactive ? 'Reactivar Ítem' : 'Inactivar Ítem',
      message: `¿Deseas ${currentlyInactive ? 'reactivar' : 'inactivar'} este ítem del catálogo?`,
      confirmColor: currentlyInactive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700',
      onCancel: () => setConfirmConfig({ isOpen: false }),
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        try {
          await inactivarBien(id, !currentlyInactive);
          cargarBienes();
        } catch (err: any) {
          alert("Error: " + err.message);
        }
      }
    });
  };

  const handleRenameHierarchy = async (tipo: 'marca' | 'linea', valorAntiguo: string) => {
    setPromptConfig({
      isOpen: true,
      title: `Renombrar ${tipo}`,
      message: `Ingresa el nuevo nombre para '${valorAntiguo}'. Esto recalculará todos los SKUs asociados.`,
      defaultValue: valorAntiguo,
      onCancel: () => setPromptConfig({ isOpen: false }),
      onConfirm: async (nuevo: string) => {
        setPromptConfig({ isOpen: false });
        if (!nuevo || nuevo === valorAntiguo) return;
        setIsLoading(true);
        try {
          await actualizarJerarquia(tipo, valorAntiguo, nuevo);
          cargarBienes();
        } catch (e: any) {
          alert("Error renombrando: " + e.message);
        }
        setIsLoading(false);
      }
    });
  };

  const handleDisableHierarchy = async (tipo: 'marca' | 'linea', valor: string, activar: boolean = false) => {
    setConfirmConfig({
      isOpen: true,
      title: activar ? `Reactivar ${tipo}` : `Inactivar ${tipo}`,
      message: `¿Estás seguro de que deseas ${activar ? 'REACTIVAR' : 'INACTIVAR'} todos los productos de la ${tipo} '${valor}'?`,
      confirmColor: activar ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700',
      onCancel: () => setConfirmConfig({ isOpen: false }),
      onConfirm: async () => {
        setConfirmConfig({ isOpen: false });
        setIsLoading(true);
        try {
          await inactivarJerarquia(tipo, valor, !activar);
          cargarBienes();
        } catch (e: any) {
          alert("Error cambiando estado masivo: " + e.message);
        }
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Selector de Modo de Vista */}
      <div className="flex gap-2 p-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl w-fit border border-gray-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setVistaModo('matricial')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            vistaModo === 'matricial'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Matriz de Bienes & Habilidades Staff</span>
        </button>

        <button
          onClick={() => setVistaModo('jerarquica')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            vistaModo === 'jerarquica'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Vista por Marcas & Familias (Retail)</span>
        </button>
      </div>

      {vistaModo === 'matricial' ? (
        <CatalogoMatricialView />
      ) : (
        <>
          {/* Bento Grid Header */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Title Card (Col-Span 3) */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-5 items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Catálogo Maestro</h1>
              <p className="text-gray-500 font-medium mt-1">Gestión centralizada de inventarios y servicios</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 bg-white border border-gray-100 px-4 py-3 rounded-2xl cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
              <input 
                type="checkbox" 
                checked={mostrarInactivos} 
                onChange={e => setMostrarInactivos(e.target.checked)} 
                className="w-5 h-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Inactivos
            </label>
            <button 
              onClick={cargarBienes}
              className="p-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm group"
            >
              <RefreshCw className={`w-5 h-5 group-hover:text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <BulkUploader 
              tableName="bienes" 
              title="Importar Catálogo" 
              expectedColumns={['nombre', 'categoria', 'tipo_bien', 'precio_venta', 'marca', 'linea', 'presentacion', 'proveedor', 'costo_unitario']}
              buttonClassName="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
              onSuccess={cargarBienes} 
            />
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nuevo Ítem
            </button>
          </div>
        </div>
        {/* Quick Stats / Filter Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] shadow-lg shadow-indigo-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <h2 className="text-indigo-100 font-bold text-sm tracking-wide uppercase">Total Activos</h2>
          <div className="text-4xl font-black text-white mt-2">
            {bienesFiltrados.length}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {['todos', 'insumo', 'producto', 'servicio', 'equipo', 'mueble', 'maquina'].map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize backdrop-blur-md transition-all ${
                  filtroTipo === tipo 
                    ? 'bg-white text-indigo-700 shadow-md scale-105' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 overflow-hidden flex flex-col">
        {/* Search Bar Bento Section */}
        <div className="p-6 border-b border-gray-100/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/40">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, SKU, marca..." 
              value={filtroTexto}
              onChange={e => setFiltroTexto(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="p-6 bg-white/40 min-h-[50vh] max-h-[65vh] overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400 font-medium">
              <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-400" />
              Sincronizando con base de datos...
            </div>
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-medium flex flex-col items-center">
              <Package className="w-16 h-16 text-gray-200 mb-4" />
              No se encontraron resultados para la búsqueda.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedData).map(([marca, lineas]) => (
                <div key={marca} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between p-5 bg-gray-50/80 hover:bg-gray-100/80 transition-colors group">
                    <button 
                      onClick={() => toggleMarca(marca)}
                      className="flex items-center gap-4 flex-1 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                        {expandedMarcas[marca] ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                      </div>
                      <span className="font-black text-gray-900 text-lg tracking-tight">{marca}</span>
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button onClick={() => handleRenameHierarchy('marca', marca)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Renombrar Marca"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDisableHierarchy('marca', marca, false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Inactivar Marca"><Archive className="w-4 h-4" /></button>
                      </div>
                      <span className="text-xs font-black text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                        {Object.values(lineas).flat().length} ítems
                      </span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedMarcas[marca] && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-5 border-t border-gray-100 space-y-4 bg-gray-50/30"
                      >
                        {Object.entries(lineas).map(([linea, items]) => {
                          const lineaKey = `${marca}_${linea}`;
                          return (
                            <div key={linea} className="border border-gray-200/60 rounded-xl bg-white overflow-hidden">
                              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 transition-colors group/linea">
                                <button 
                                  onClick={() => toggleLinea(lineaKey)}
                                  className="flex items-center gap-3 flex-1 text-left"
                                >
                                  <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                    {expandedLineas[lineaKey] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </div>
                                  <span className="font-bold text-gray-800 text-sm">{linea}</span>
                                </button>
                                <div className="flex items-center gap-3">
                                  <div className="opacity-0 group-hover/linea:opacity-100 transition-opacity flex items-center gap-1">
                                    <button onClick={() => handleRenameHierarchy('linea', linea)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg" title="Renombrar Línea"><Edit3 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDisableHierarchy('linea', linea, false)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg" title="Inactivar Línea"><Archive className="w-3.5 h-3.5" /></button>
                                  </div>
                                  <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {items.length} ítems
                                  </span>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                              {expandedLineas[lineaKey] && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="divide-y divide-gray-100"
                                >
                                  {items.map(item => (
                                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-indigo-50/20 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                          item.tipo_bien === 'servicio' || item.es_servicio
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : item.tipo_bien === 'insumo' || item.es_insumo_taller
                                              ? 'bg-amber-100 text-amber-700'
                                              : item.tipo_bien === 'equipo' || item.es_equipo_dispositivo
                                                ? 'bg-cyan-100 text-cyan-700'
                                                : item.tipo_bien === 'mueble' || item.es_mueble
                                                  ? 'bg-purple-100 text-purple-700'
                                                  : item.tipo_bien === 'maquina' || item.es_maquina
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                          {item.tipo_bien === 'servicio' || item.es_servicio 
                                            ? '💇 Servicio' 
                                            : item.tipo_bien === 'insumo' || item.es_insumo_taller
                                              ? '🧪 Insumo'
                                              : item.tipo_bien === 'equipo' || item.es_equipo_dispositivo
                                                ? '🔌 Equipo'
                                                : item.tipo_bien === 'mueble' || item.es_mueble
                                                  ? '🛋️ Mueble'
                                                  : item.tipo_bien === 'maquina' || item.es_maquina
                                                    ? '⚙️ Máquina'
                                                    : '🛍️ Retail'}
                                        </span>
                                        <div>
                                          <p className="font-bold text-gray-900 text-sm leading-snug">{item.nombre}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{item.atributos_producto?.sku || 'SKU'}</span>
                                            <span>•</span>
                                            <span>{item.atributos_producto?.presentacion || 'Unidad'}</span>
                                            {item.atributos_producto?.proveedor && (
                                              <>
                                                <span>•</span>
                                                <span>Prov: {item.atributos_producto?.proveedor}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <p className="text-xs font-bold text-gray-400">PVP</p>
                                          <p className="text-sm font-black text-gray-900 font-mono">S/ {Number(item.precio_venta || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center gap-1 border-l border-gray-100 pl-3">
                                          <button onClick={() => openModal(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                          <button onClick={() => toggleStatus(item.id, item.atributos_producto?.estado === 'inactivo')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-xl transition" title={item.atributos_producto?.estado === 'inactivo' ? 'Reactivar' : 'Inactivar'}><Archive className="w-4 h-4" /></button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Ítem */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editItem ? 'Editar Ítem del Catálogo' : 'Nuevo Ítem en Catálogo'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure los datos maestros y jerarquía</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Nombre Comercial</label>
                  <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Olaplex Nº3 Hair Perfector" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Marca / Fabricante</label>
                  <input required type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} placeholder="Ej. L'Oréal, Olaplex" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Línea / Subcategoría</label>
                  <input required type="text" value={formData.linea} onChange={e => setFormData({...formData, linea: e.target.value})} placeholder="Ej. Blondage, Nutritive" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Presentación / Formato</label>
                  <input type="text" value={formData.presentacion} onChange={e => setFormData({...formData, presentacion: e.target.value})} placeholder="Ej. 250ml, Tubo 60g, Frasco" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Proveedor Principal</label>
                  <input type="text" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Clasificación del Bien</label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'retail', tipo_bien: 'producto'})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'retail'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>🛍️ Retail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'insumo', tipo_bien: 'insumo'})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'insumo'
                          ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Box className="w-4 h-4 text-amber-600" />
                      <span>🧪 Insumo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'servicio', tipo_bien: 'servicio', es_servicio: true})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'servicio'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Scissors className="w-4 h-4 text-indigo-600" />
                      <span>💇 Servicio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'equipo', tipo_bien: 'equipo'})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'equipo'
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-700 ring-2 ring-cyan-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-cyan-600" />
                      <span>🔌 Equipo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'mueble', tipo_bien: 'mueble'})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'mueble'
                          ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Armchair className="w-4 h-4 text-purple-600" />
                      <span>🛋️ Mueble</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({...formData, tipo_catalogo: 'maquina', tipo_bien: 'maquina'})}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        formData.tipo_catalogo === 'maquina'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-rose-600" />
                      <span>⚙️ Máquina</span>
                    </button>
                  </div>
                </div>

                {/* SI ES SERVICIO: Mostrar Selector de Moldes de Fábrica */}
                {formData.tipo_catalogo === 'servicio' && (
                  <div className="space-y-3 md:col-span-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Seleccionar Molde / Plantilla de Servicio
                      </label>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {modelosServicio.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeServicio(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 font-bold'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                              {(m.esquema_atributos as any)?.duracion_minutos || 45} min • {(m.esquema_atributos as any)?.estacion_sugerida || 'Sillón'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros Operativos del Servicio */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-indigo-100/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" /> Duración (min)
                        </label>
                        <input
                          type="number"
                          value={formData.duracion_minutos}
                          onChange={e => setFormData({...formData, duracion_minutos: e.target.value})}
                          min={5}
                          step={5}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-indigo-600" /> Estación Sugerida
                        </label>
                        <select
                          value={formData.estacion_sugerida}
                          onChange={e => setFormData({...formData, estacion_sugerida: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="Sillón de Corte">Sillón de Corte</option>
                          <option value="Sillón de Color">Sillón de Color</option>
                          <option value="Lavacabezas">Lavacabezas</option>
                          <option value="Mesa Manicura">Mesa Manicura</option>
                          <option value="Sillón Pedicura Spa">Sillón Pedicura Spa</option>
                          <option value="Cabina Estética">Cabina Estética</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-indigo-600" /> % Comisión Staff
                        </label>
                        <input
                          type="number"
                          value={formData.comision_porcentaje}
                          onChange={e => setFormData({...formData, comision_porcentaje: e.target.value})}
                          min={0}
                          max={100}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Puntos VP (💎)
                        </label>
                        <input
                          type="number"
                          value={formData.puntos_vp_otorgados}
                          onChange={e => setFormData({...formData, puntos_vp_otorgados: e.target.value})}
                          min={0}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Sub-Receta de Insumos en Taller */}
                    <div className="pt-3 border-t border-indigo-100/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requiere_insumos_taller}
                            onChange={e => setFormData({...formData, requiere_insumos_taller: e.target.checked})}
                            className="w-4 h-4 rounded text-indigo-600"
                          />
                          <span>Requiere Insumos / Despacho en Workspace Taller</span>
                        </label>

                        {formData.requiere_insumos_taller && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = formData.receta_insumos || [];
                              setFormData({
                                ...formData,
                                receta_insumos: [...current, { nombre: 'Insumo Químico', gramos_estimados: 30, tipo: 'FORMULA' }]
                              });
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Agregar Insumo
                          </button>
                        )}
                      </div>

                      {formData.requiere_insumos_taller && (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {(formData.receta_insumos || []).map((ins: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-100 text-xs">
                              <input
                                type="text"
                                placeholder="Nombre de insumo o químico..."
                                value={ins.nombre}
                                onChange={e => {
                                  const updated = [...formData.receta_insumos];
                                  updated[idx].nombre = e.target.value;
                                  setFormData({...formData, receta_insumos: updated});
                                }}
                                className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                              />
                              <div className="flex items-center gap-1 w-24">
                                <input
                                  type="number"
                                  placeholder="Gramos"
                                  value={ins.gramos_estimados}
                                  onChange={e => {
                                    const updated = [...formData.receta_insumos];
                                    updated[idx].gramos_estimados = Number(e.target.value);
                                    setFormData({...formData, receta_insumos: updated});
                                  }}
                                  className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-right"
                                />
                                <span className="text-[10px] text-gray-500 font-bold">g/ml</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = formData.receta_insumos.filter((_: any, i: number) => i !== idx);
                                  setFormData({...formData, receta_insumos: updated});
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* SI ES INSUMO / TALLER: Mostrar Selector de Moldes de Insumo IoT */}
                {formData.tipo_catalogo === 'insumo' && (
                  <div className="space-y-3 md:col-span-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-amber-600" />
                        Seleccionar Molde / Plantilla de Insumo Metrológico IoT
                      </label>
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset Taller
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modelosInsumo.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeInsumo(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20 font-bold'
                                : 'bg-white text-gray-700 border-amber-200 hover:border-amber-400'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                              Neto: {(m.esquema_atributos as any)?.peso_neto_total_gramos || 60}{(m.esquema_atributos as any)?.unidad_medida || 'g'} • Tara: {(m.esquema_atributos as any)?.peso_envase_tara_gramos || 0}g
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros Metrológicos para Balanzas IoT */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-amber-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-amber-600" /> Peso Neto (g/ml)
                        </label>
                        <input
                          type="number"
                          value={formData.peso_neto_total_gramos}
                          onChange={e => setFormData({...formData, peso_neto_total_gramos: e.target.value})}
                          min={1}
                          step={1}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Box className="w-3.5 h-3.5 text-amber-600" /> Tara Envase Vacío (g)
                        </label>
                        <input
                          type="number"
                          value={formData.peso_envase_tara_gramos}
                          onChange={e => setFormData({...formData, peso_envase_tara_gramos: e.target.value})}
                          min={0}
                          step={1}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Droplet className="w-3.5 h-3.5 text-amber-600" /> Densidad (g/ml)
                        </label>
                        <input
                          type="number"
                          value={formData.factor_densidad}
                          onChange={e => setFormData({...formData, factor_densidad: e.target.value})}
                          min={0.1}
                          step={0.01}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-amber-600" /> % Merma Tolerada
                        </label>
                        <input
                          type="number"
                          value={formData.merma_tolerancia_porcentaje}
                          onChange={e => setFormData({...formData, merma_tolerancia_porcentaje: e.target.value})}
                          min={0}
                          max={20}
                          step={0.5}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-amber-600" /> Alerta Quiebre (g/ml)
                        </label>
                        <input
                          type="number"
                          value={formData.stock_minimo_alerta_gramos}
                          onChange={e => setFormData({...formData, stock_minimo_alerta_gramos: e.target.value})}
                          min={10}
                          step={10}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> PAO (Meses Abierto)
                        </label>
                        <input
                          type="number"
                          value={formData.pao_meses}
                          onChange={e => setFormData({...formData, pao_meses: e.target.value})}
                          min={1}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-amber-600" /> Unidad Medida
                        </label>
                        <select
                          value={formData.unidad_medida}
                          onChange={e => setFormData({...formData, unidad_medida: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="g">Gramos (g)</option>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="oz">Onzas (oz)</option>
                          <option value="und">Unidades (und)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Box className="w-3.5 h-3.5 text-amber-600" /> Centro de Uso BOH
                        </label>
                        <select
                          value={formData.area_produccion_boh}
                          onChange={e => setFormData({...formData, area_produccion_boh: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="LABORATORIO_CENTRAL">Laboratorio Central</option>
                          <option value="LAVACABEZAS">Lavacabezas / Backbar</option>
                          <option value="BARRA_COLOR">Barra de Color</option>
                          <option value="CABINA_FACIAL">Cabina Facial</option>
                        </select>
                      </div>
                    </div>

                    {/* Costeo de Fórmulas por Gramo en Tiempo Real */}
                    {parseFloat(formData.costo_unitario) > 0 && parseFloat(formData.peso_neto_total_gramos) > 0 && (
                      <div className="mt-2 p-2.5 bg-amber-100/70 rounded-xl border border-amber-300 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                          <Activity className="w-4 h-4 text-amber-700" />
                          <span>Costo Unitario por Gramo / ml para Fórmulas ODI:</span>
                        </div>
                        <span className="font-mono font-black text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-300">
                          S/ {((parseFloat(formData.costo_unitario) || 0) / (parseFloat(formData.peso_neto_total_gramos) || 1)).toFixed(4)} / {formData.unidad_medida || 'g'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* SI ES PRODUCTO RETAIL: Mostrar Selector de Moldes de Producto */}
                {formData.tipo_catalogo === 'retail' && (
                  <div className="space-y-3 md:col-span-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-600" />
                        Seleccionar Molde / Plantilla de Producto Retail
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modelosProducto.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeProducto(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-bold'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                              {(m.esquema_atributos as any)?.presentacion_default || 'Und'} • Alerta: {(m.esquema_atributos as any)?.stock_minimo_alerta || 5} und
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros Específicos de Producto Retail */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-emerald-100/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-emerald-600" /> Código EAN / Barras
                        </label>
                        <input
                          type="text"
                          placeholder="7751234567890"
                          value={formData.codigo_barras}
                          onChange={e => setFormData({...formData, codigo_barras: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" /> Stock Mín. Alerta
                        </label>
                        <input
                          type="number"
                          value={formData.stock_minimo_alerta}
                          onChange={e => setFormData({...formData, stock_minimo_alerta: e.target.value})}
                          min={1}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5 text-emerald-600" /> % Com. Venta
                        </label>
                        <input
                          type="number"
                          value={formData.comision_venta_porcentaje}
                          onChange={e => setFormData({...formData, comision_venta_porcentaje: e.target.value})}
                          min={0}
                          max={100}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" /> Puntos VP (💎)
                        </label>
                        <input
                          type="number"
                          value={formData.puntos_vp_otorgados}
                          onChange={e => setFormData({...formData, puntos_vp_otorgados: e.target.value})}
                          min={0}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* SI ES EQUIPO / DISPOSITIVO: Mostrar Selector de Moldes de Hardware IoT */}
                {formData.tipo_catalogo === 'equipo' && (
                  <div className="space-y-4 md:col-span-2 p-4 bg-cyan-50/50 rounded-2xl border border-cyan-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-cyan-600" />
                        Seleccionar Molde / Plantilla de Equipo o Dispositivo IoT
                      </label>
                      <span className="text-[10px] text-cyan-800 font-bold bg-cyan-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset Hardware
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modelosEquipo.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeEquipo(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20 font-bold'
                                : 'bg-white text-gray-700 border-cyan-200 hover:border-cyan-400'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-cyan-100' : 'text-gray-500'}`}>
                              {(m.esquema_atributos as any)?.protocolo_comunicacion || 'PLUG'} • Vida: {(m.esquema_atributos as any)?.vida_util_meses_base || 24}m
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros de Hardware y Conectividad */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-cyan-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-cyan-600" /> N° de Serie
                        </label>
                        <input
                          type="text"
                          placeholder="SN-998234-A"
                          value={formData.numero_serie}
                          onChange={e => setFormData({...formData, numero_serie: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-cyan-600" /> Protocolo Conexión
                        </label>
                        <select
                          value={formData.protocolo_comunicacion}
                          onChange={e => setFormData({...formData, protocolo_comunicacion: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="WEB_BLUETOOTH_BLE">Bluetooth BLE (Web)</option>
                          <option value="WEB_SERIAL_USB">Serial USB (Web Serial)</option>
                          <option value="WIFI_WEBSOCKET">WiFi / WebSocket Local</option>
                          <option value="NFC_READER">Lector NFC (Contactless)</option>
                          <option value="STANDALONE_PLUG">Enchufe / Standalone 220V</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-cyan-600" /> Estación Asignada
                        </label>
                        <select
                          value={formData.estacion_asignada}
                          onChange={e => setFormData({...formData, estacion_asignada: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="Mesa de Despacho Taller">Mesa de Despacho Taller</option>
                          <option value="Caja Principal">Caja Principal</option>
                          <option value="Recepción / Kiosko K-01">Recepción / Kiosko K-01</option>
                          <option value="Sillón de Corte">Sillón de Corte</option>
                          <option value="Sillón de Tratamientos">Sillón de Tratamientos</option>
                          <option value="Lavacabezas">Lavacabezas</option>
                          <option value="Almacén Técnico">Almacén Técnico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-cyan-600" /> Estado Operativo
                        </label>
                        <select
                          value={formData.estado_operativo}
                          onChange={e => setFormData({...formData, estado_operativo: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="OPERATIVO">🟢 Operativo</option>
                          <option value="CALIBRACION_PENDIENTE">🟡 Calibración Pendiente</option>
                          <option value="EN_MANTENIMIENTO">🟠 En Mantenimiento</option>
                          <option value="DEPRECIADO_PARA_RENOVACION">🔴 Depreciado / Renovar</option>
                        </select>
                      </div>
                    </div>

                    {/* Módulo de Vida Útil, Depreciación y Extensión por Reparaciones */}
                    <div className="pt-3 border-t border-cyan-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-cyan-700" />
                          Ciclo de Vida, Depreciación y Extensión por Reparación
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md font-bold">
                            Vida Total: {(parseInt(formData.vida_util_meses_base) || 24) + (parseInt(formData.meses_extension_reparacion) || 0)} Meses
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-cyan-100">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Vida Útil Base (Meses)</label>
                          <input
                            type="number"
                            value={formData.vida_util_meses_base}
                            onChange={e => setFormData({...formData, vida_util_meses_base: e.target.value})}
                            min={1}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Extensión (+Meses)</label>
                          <input
                            type="number"
                            value={formData.meses_extension_reparacion}
                            onChange={e => setFormData({...formData, meses_extension_reparacion: e.target.value})}
                            min={0}
                            className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Mantenimiento (Días)</label>
                          <input
                            type="number"
                            value={formData.frecuencia_mantenimiento_dias}
                            onChange={e => setFormData({...formData, frecuencia_mantenimiento_dias: e.target.value})}
                            min={10}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Fecha Adquisición</label>
                          <input
                            type="date"
                            value={formData.fecha_adquisicion}
                            onChange={e => setFormData({...formData, fecha_adquisicion: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Depreciación Mensual Estimada Banner */}
                      {parseFloat(formData.costo_unitario) > 0 && (
                        <div className="p-2.5 bg-cyan-100/70 rounded-xl border border-cyan-300 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-cyan-950 font-bold">
                            <TrendingUp className="w-4 h-4 text-cyan-700" />
                            <span>Depreciación Mensual Estimada:</span>
                          </div>
                          <span className="font-mono font-black text-cyan-900 bg-white px-2 py-0.5 rounded-md border border-cyan-300">
                            S/ {((parseFloat(formData.costo_unitario) || 0) / Math.max(1, (parseInt(formData.vida_util_meses_base) || 24) + (parseInt(formData.meses_extension_reparacion) || 0))).toFixed(2)} / mes
                          </span>
                        </div>
                      )}

                      {/* Historial de Reparaciones / Cambio de Componentes */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-700">Historial de Cambio de Partes / Reparaciones:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevaParte = {
                                fecha: new Date().toISOString().split('T')[0],
                                descripcion: 'Cambio de motor / batería / componente',
                                costo: 0,
                                meses_agregados: 12
                              };
                              const historialActual = formData.historial_reparaciones_partes || [];
                              setFormData({
                                ...formData,
                                historial_reparaciones_partes: [...historialActual, nuevaParte],
                                meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + 12
                              });
                            }}
                            className="text-[10px] font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer bg-cyan-100/70 px-2 py-1 rounded-lg"
                          >
                            <Plus className="w-3 h-3" /> Registrar Reparación (+12m vida útil)
                          </button>
                        </div>

                        {(formData.historial_reparaciones_partes || []).map((rep: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-cyan-100 text-xs">
                            <input
                              type="date"
                              value={rep.fecha}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].fecha = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Pieza cambiada / detalle técnico..."
                              value={rep.descripcion}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].descripcion = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">Vida:</span>
                              <input
                                type="number"
                                placeholder="+Meses"
                                value={rep.meses_agregados}
                                onChange={e => {
                                  const updated = [...formData.historial_reparaciones_partes];
                                  const diff = Number(e.target.value) - (updated[idx].meses_agregados || 0);
                                  updated[idx].meses_agregados = Number(e.target.value);
                                  setFormData({
                                    ...formData,
                                    historial_reparaciones_partes: updated,
                                    meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + diff
                                  });
                                }}
                                className="w-16 px-1.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 text-center"
                              />
                              <span className="text-[10px] text-emerald-700 font-bold">m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const mesesQuitados = formData.historial_reparaciones_partes[idx].meses_agregados || 0;
                                const updated = formData.historial_reparaciones_partes.filter((_: any, i: number) => i !== idx);
                                setFormData({
                                  ...formData,
                                  historial_reparaciones_partes: updated,
                                  meses_extension_reparacion: Math.max(0, (parseInt(formData.meses_extension_reparacion) || 0) - mesesQuitados)
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* SI ES MUEBLE / ESTACIÓN: Mostrar Selector de Moldes de Mobiliario */}
                {formData.tipo_catalogo === 'mueble' && (
                  <div className="space-y-4 md:col-span-2 p-4 bg-purple-50/50 rounded-2xl border border-purple-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Armchair className="w-4 h-4 text-purple-600" />
                        Seleccionar Molde / Plantilla de Mobiliario y Estaciones
                      </label>
                      <span className="text-[10px] text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset Mueble
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modelosMueble.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeMueble(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 font-bold'
                                : 'bg-white text-gray-700 border-purple-200 hover:border-purple-400'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-purple-100' : 'text-gray-500'}`}>
                              {(m.esquema_atributos as any)?.capacidad_carga_kg || 150}kg • Vida: {(m.esquema_atributos as any)?.vida_util_meses_base || 48}m
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros Ergonómicos y Físicos de Mobiliario */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-purple-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-purple-600" /> Tag Patrimonial
                        </label>
                        <input
                          type="text"
                          placeholder="ACT-MUE-001"
                          value={formData.codigo_patrimonial_tag}
                          onChange={e => setFormData({...formData, codigo_patrimonial_tag: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-purple-600" /> Tipo Mobiliario
                        </label>
                        <select
                          value={formData.tipo_mueble}
                          onChange={e => setFormData({...formData, tipo_mueble: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="SILLON_CORTE">Sillón de Corte Hidráulico</option>
                          <option value="LAVACABEZAS">Lavacabezas Ergonómico</option>
                          <option value="MESA_MANICURA">Mesa de Manicura con Extractor</option>
                          <option value="SILLON_PEDICURA_SPA">Sillón Pedicura Spa</option>
                          <option value="ESPEJO_TOCADOR">Espejo Tocador LED</option>
                          <option value="MOSTRADOR_RECEPCION">Mostrador de Recepción</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-purple-600" /> Carga Máx (kg)
                        </label>
                        <input
                          type="number"
                          value={formData.capacidad_carga_kg}
                          onChange={e => setFormData({...formData, capacidad_carga_kg: e.target.value})}
                          min={20}
                          step={5}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-purple-600" /> Reclinación (°)
                        </label>
                        <input
                          type="number"
                          value={formData.grados_reclinacion}
                          onChange={e => setFormData({...formData, grados_reclinacion: e.target.value})}
                          min={0}
                          max={180}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-purple-600" /> Material de Tapiz / Estructura
                        </label>
                        <input
                          type="text"
                          placeholder="Vinil Náutico Antimanchas / Cuero PU Hidrófugo"
                          value={formData.material_tapiz}
                          onChange={e => setFormData({...formData, material_tapiz: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Armchair className="w-3.5 h-3.5 text-purple-600" /> Estación Asignada
                        </label>
                        <select
                          value={formData.estacion_asignada}
                          onChange={e => setFormData({...formData, estacion_asignada: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="Sillón de Corte">Sillón de Corte</option>
                          <option value="Lavacabezas">Lavacabezas</option>
                          <option value="Mesa Manicura">Mesa Manicura</option>
                          <option value="Sillón Pedicura Spa">Sillón Pedicura Spa</option>
                          <option value="Recepción">Recepción</option>
                          <option value="Almacén Mobiliario">Almacén Mobiliario</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-purple-600" /> Estado Físico
                        </label>
                        <select
                          value={formData.estado_operativo}
                          onChange={e => setFormData({...formData, estado_operativo: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="OPERATIVO">🟢 Operativo / Impecable</option>
                          <option value="RETAPIZADO_PENDIENTE">🟡 Retapizado Pendiente</option>
                          <option value="EN_REPARACION_HIDRAULICA">🟠 Reparación Bomba / Pistón</option>
                          <option value="DEPRECIADO_PARA_RENOVACION">🔴 Depreciado / Renovar</option>
                        </select>
                      </div>
                    </div>

                    {/* Módulo de Vida Útil, Depreciación y Extensión por Retapizado */}
                    <div className="pt-3 border-t border-purple-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-purple-700" />
                          Ciclo de Vida & Extensión por Retapizado / Overhaul
                        </span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold">
                          Vida Total: {(parseInt(formData.vida_util_meses_base) || 48) + (parseInt(formData.meses_extension_reparacion) || 0)} Meses
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-purple-100">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Vida Útil Base (Meses)</label>
                          <input
                            type="number"
                            value={formData.vida_util_meses_base}
                            onChange={e => setFormData({...formData, vida_util_meses_base: e.target.value})}
                            min={1}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Extensión (+Meses)</label>
                          <input
                            type="number"
                            value={formData.meses_extension_reparacion}
                            onChange={e => setFormData({...formData, meses_extension_reparacion: e.target.value})}
                            min={0}
                            className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Revisión (Días)</label>
                          <input
                            type="number"
                            value={formData.frecuencia_mantenimiento_dias}
                            onChange={e => setFormData({...formData, frecuencia_mantenimiento_dias: e.target.value})}
                            min={10}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Fecha Compra</label>
                          <input
                            type="date"
                            value={formData.fecha_adquisicion}
                            onChange={e => setFormData({...formData, fecha_adquisicion: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Depreciación Mensual Estimada Banner */}
                      {parseFloat(formData.costo_unitario) > 0 && (
                        <div className="p-2.5 bg-purple-100/70 rounded-xl border border-purple-300 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-purple-950 font-bold">
                            <TrendingUp className="w-4 h-4 text-purple-700" />
                            <span>Depreciación Mensual de Mobiliario:</span>
                          </div>
                          <span className="font-mono font-black text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-300">
                            S/ {((parseFloat(formData.costo_unitario) || 0) / Math.max(1, (parseInt(formData.vida_util_meses_base) || 48) + (parseInt(formData.meses_extension_reparacion) || 0))).toFixed(2)} / mes
                          </span>
                        </div>
                      )}

                      {/* Historial de Retapizados y Mantenimiento Hidráulico */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-700">Historial de Retapizado / Bomba:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoRetapizado = {
                                fecha: new Date().toISOString().split('T')[0],
                                descripcion: 'Retapizado integral en vinil náutico / cambio de bomba',
                                costo: 0,
                                meses_agregados: 24
                              };
                              const historialActual = formData.historial_reparaciones_partes || [];
                              setFormData({
                                ...formData,
                                historial_reparaciones_partes: [...historialActual, nuevoRetapizado],
                                meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + 24
                              });
                            }}
                            className="text-[10px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer bg-purple-100/70 px-2 py-1 rounded-lg"
                          >
                            <Plus className="w-3 h-3" /> Registrar Retapizado (+24m vida útil)
                          </button>
                        </div>

                        {(formData.historial_reparaciones_partes || []).map((rep: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-100 text-xs">
                            <input
                              type="date"
                              value={rep.fecha}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].fecha = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Detalle de retapizado o cambio hidráulico..."
                              value={rep.descripcion}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].descripcion = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">Vida:</span>
                              <input
                                type="number"
                                placeholder="+Meses"
                                value={rep.meses_agregados}
                                onChange={e => {
                                  const updated = [...formData.historial_reparaciones_partes];
                                  const diff = Number(e.target.value) - (updated[idx].meses_agregados || 0);
                                  updated[idx].meses_agregados = Number(e.target.value);
                                  setFormData({
                                    ...formData,
                                    historial_reparaciones_partes: updated,
                                    meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + diff
                                  });
                                }}
                                className="w-16 px-1.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 text-center"
                              />
                              <span className="text-[10px] text-emerald-700 font-bold">m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const mesesQuitados = formData.historial_reparaciones_partes[idx].meses_agregados || 0;
                                const updated = formData.historial_reparaciones_partes.filter((_: any, i: number) => i !== idx);
                                setFormData({
                                  ...formData,
                                  historial_reparaciones_partes: updated,
                                  meses_extension_reparacion: Math.max(0, (parseInt(formData.meses_extension_reparacion) || 0) - mesesQuitados)
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* SI ES MÁQUINA / APARATOLOGÍA TERMO-MECÁNICA */}
                {formData.tipo_catalogo === 'maquina' && (
                  <div className="space-y-4 md:col-span-2 p-4 bg-rose-50/50 rounded-2xl border border-rose-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-rose-600" />
                        Seleccionar Molde / Plantilla de Máquinas & Aparatología
                      </label>
                      <span className="text-[10px] text-rose-800 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                        1-Clic Preset Máquina
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {modelosMaquina.map(m => {
                        const isSelected = formData.modelo_id === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => aplicarMoldeMaquina(m)}
                            className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 font-bold'
                                : 'bg-white text-gray-700 border-rose-200 hover:border-rose-400'
                            }`}
                          >
                            <span className="block font-bold text-[11px] truncate">{m.nombre}</span>
                            <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-rose-100' : 'text-gray-500'}`}>
                              {(m.esquema_atributos as any)?.potencia_watts || 1000}W • {(m.esquema_atributos as any)?.horas_vida_util_maxima || 6000} hrs
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Parámetros Electromecánicos & Horómetro */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-rose-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-rose-600" /> Tag Patrimonial / Serie
                        </label>
                        <input
                          type="text"
                          placeholder="ACT-MAQ-001"
                          value={formData.codigo_patrimonial_tag}
                          onChange={e => setFormData({...formData, codigo_patrimonial_tag: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-rose-600" /> Tipo de Máquina
                        </label>
                        <select
                          value={formData.tipo_maquina}
                          onChange={e => setFormData({...formData, tipo_maquina: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="CLIMAZON_TERMOESTIMULADOR">Climazón Giratorio Infrarrojo</option>
                          <option value="AUTOCLAVE_ESTERILIZADOR">Autoclave Clase B Grado Médico</option>
                          <option value="VAPORIZADOR_OZONO">Vaporizador Ozono Capilar/Facial</option>
                          <option value="COMPRESOR_AEROGRAFIA">Compresor Silencioso Aerografía</option>
                          <option value="LAVADO_BOMBA_RECIRCULACION">Bomba Recirculación Head Spa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-rose-600" /> Potencia (Watts)
                        </label>
                        <input
                          type="number"
                          value={formData.potencia_watts}
                          onChange={e => setFormData({...formData, potencia_watts: e.target.value})}
                          min={0}
                          step={50}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-rose-600" /> Voltaje
                        </label>
                        <select
                          value={formData.voltaje_operacion}
                          onChange={e => setFormData({...formData, voltaje_operacion: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="220V">220V (Monofásico)</option>
                          <option value="110V">110V</option>
                          <option value="TRIFASICO_380V">380V Trifásico</option>
                          <option value="BATERIA_LITIO">Batería Litio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-600" /> Horas Uso (Horómetro)
                        </label>
                        <input
                          type="number"
                          value={formData.horas_uso_acumuladas}
                          onChange={e => setFormData({...formData, horas_uso_acumuladas: e.target.value})}
                          min={0}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-rose-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-rose-600" /> Vida Máx (Horas)
                        </label>
                        <input
                          type="number"
                          value={formData.horas_vida_util_maxima}
                          onChange={e => setFormData({...formData, horas_vida_util_maxima: e.target.value})}
                          min={100}
                          step={100}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Wrench className="w-3.5 h-3.5 text-rose-600" /> Overhaul cada (Hrs)
                        </label>
                        <input
                          type="number"
                          value={formData.frecuencia_overhaul_horas}
                          onChange={e => setFormData({...formData, frecuencia_overhaul_horas: e.target.value})}
                          min={50}
                          step={50}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-rose-600" /> Estado Operativo
                        </label>
                        <select
                          value={formData.estado_operativo}
                          onChange={e => setFormData({...formData, estado_operativo: e.target.value})}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        >
                          <option value="OPERATIVO">🟢 Operativo / En Línea</option>
                          <option value="MANTENIMIENTO_OVERHAUL_PENDIENTE">🟡 Overhaul Requerido</option>
                          <option value="EN_REPARACION_MOTOR">🟠 Cambio Motor / Bomba</option>
                          <option value="DESCALCIFICACION_PENDIENTE">🟣 Descalcificación Requerida</option>
                          <option value="DEPRECIADA">🔴 Depreciada / Renovar</option>
                        </select>
                      </div>
                    </div>

                    {/* Módulo de Vida Útil, Depreciación y Extensión por Overhaul */}
                    <div className="pt-3 border-t border-rose-200/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-rose-700" />
                          Ciclo de Vida & Extensión por Overhaul / Repuestos de Motor
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">
                          Vida Total: {(parseInt(formData.vida_util_meses_base) || 60) + (parseInt(formData.meses_extension_reparacion) || 0)} Meses
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-rose-100">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Vida Útil Base (Meses)</label>
                          <input
                            type="number"
                            value={formData.vida_util_meses_base}
                            onChange={e => setFormData({...formData, vida_util_meses_base: e.target.value})}
                            min={1}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Extensión (+Meses)</label>
                          <input
                            type="number"
                            value={formData.meses_extension_reparacion}
                            onChange={e => setFormData({...formData, meses_extension_reparacion: e.target.value})}
                            min={0}
                            className="w-full px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Revisión (Días)</label>
                          <input
                            type="number"
                            value={formData.frecuencia_mantenimiento_dias}
                            onChange={e => setFormData({...formData, frecuencia_mantenimiento_dias: e.target.value})}
                            min={10}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Fecha Compra</label>
                          <input
                            type="date"
                            value={formData.fecha_adquisicion}
                            onChange={e => setFormData({...formData, fecha_adquisicion: e.target.value})}
                            className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Depreciación Mensual Estimada Banner */}
                      {parseFloat(formData.costo_unitario) > 0 && (
                        <div className="p-2.5 bg-rose-100/70 rounded-xl border border-rose-300 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-rose-950 font-bold">
                            <TrendingUp className="w-4 h-4 text-rose-700" />
                            <span>Depreciación Mensual de Maquinaria:</span>
                          </div>
                          <span className="font-mono font-black text-rose-900 bg-white px-2 py-0.5 rounded-md border border-rose-300">
                            S/ {((parseFloat(formData.costo_unitario) || 0) / Math.max(1, (parseInt(formData.vida_util_meses_base) || 60) + (parseInt(formData.meses_extension_reparacion) || 0))).toFixed(2)} / mes
                          </span>
                        </div>
                      )}

                      {/* Historial de Overhaul y Cambio de Piezas Mayores */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-700">Historial de Overhaul / Componentes Mayores:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoOverhaul = {
                                fecha: new Date().toISOString().split('T')[0],
                                descripcion: 'Overhaul mayor: Rebobinado de motor / cambio de bomba / resistencias',
                                costo: 0,
                                meses_agregados: 24
                              };
                              const historialActual = formData.historial_reparaciones_partes || [];
                              setFormData({
                                ...formData,
                                historial_reparaciones_partes: [...historialActual, nuevoOverhaul],
                                meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + 24,
                                horas_uso_acumuladas: Math.max(0, (parseFloat(formData.horas_uso_acumuladas) || 0) - 1000)
                              });
                            }}
                            className="text-[10px] font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-100/70 px-2 py-1 rounded-lg"
                          >
                            <Plus className="w-3 h-3" /> Registrar Overhaul (+24m vida útil y -1000h horómetro)
                          </button>
                        </div>

                        {(formData.historial_reparaciones_partes || []).map((rep: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-rose-100 text-xs">
                            <input
                              type="date"
                              value={rep.fecha}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].fecha = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="w-28 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Detalle de overhaul / cambio de bomba o resistencias..."
                              value={rep.descripcion}
                              onChange={e => {
                                const updated = [...formData.historial_reparaciones_partes];
                                updated[idx].descripcion = e.target.value;
                                setFormData({...formData, historial_reparaciones_partes: updated});
                              }}
                              className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-400">Vida:</span>
                              <input
                                type="number"
                                placeholder="+Meses"
                                value={rep.meses_agregados}
                                onChange={e => {
                                  const updated = [...formData.historial_reparaciones_partes];
                                  const diff = Number(e.target.value) - (updated[idx].meses_agregados || 0);
                                  updated[idx].meses_agregados = Number(e.target.value);
                                  setFormData({
                                    ...formData,
                                    historial_reparaciones_partes: updated,
                                    meses_extension_reparacion: (parseInt(formData.meses_extension_reparacion) || 0) + diff
                                  });
                                }}
                                className="w-16 px-1.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 text-center"
                              />
                              <span className="text-[10px] text-emerald-700 font-bold">m</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const mesesQuitados = formData.historial_reparaciones_partes[idx].meses_agregados || 0;
                                const updated = formData.historial_reparaciones_partes.filter((_: any, i: number) => i !== idx);
                                setFormData({
                                  ...formData,
                                  historial_reparaciones_partes: updated,
                                  meses_extension_reparacion: Math.max(0, (parseInt(formData.meses_extension_reparacion) || 0) - mesesQuitados)
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Precio Venta (PVP S/)</label>
                  <input type="number" step="0.01" value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Costo Unitario Ref. (S/)</label>
                  <input type="number" step="0.01" value={formData.costo_unitario} onChange={e => setFormData({...formData, costo_unitario: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                {/* Cálculo Dinámico de Margen Comercial */}
                {formData.tipo_catalogo === 'retail' && (parseFloat(formData.precio_venta) > 0 || parseFloat(formData.costo_unitario) > 0) && (
                  <div className="md:col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-600 font-medium">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Análisis de Margen:</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Ganancia Bruta</span>
                        <span className="font-bold font-mono text-gray-800">
                          S/ {Math.max(0, (parseFloat(formData.precio_venta) || 0) - (parseFloat(formData.costo_unitario) || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Margen Comercial</span>
                        {(() => {
                          const pvp = parseFloat(formData.precio_venta) || 0;
                          const costo = parseFloat(formData.costo_unitario) || 0;
                          const margen = pvp > 0 ? ((pvp - costo) / pvp) * 100 : 0;
                          const color = margen >= 40 ? 'bg-emerald-100 text-emerald-700' : margen >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
                          return (
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${color}`}>
                              {margen.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
                
                {!editItem && formData.tipo_catalogo !== 'servicio' && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-bold text-indigo-700">Stock Inicial (Admin)</label>
                    <input type="number" min="0" value={formData.stockInicial} onChange={e => setFormData({...formData, stockInicial: e.target.value})} className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-900 font-bold" />
                    <p className="text-[10px] text-indigo-500 leading-tight">Solo llenar si se desea inicializar inventario en esta Sede inmediatamente.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SKU Generado Automáticamente</p>
                  <p className="text-sm font-mono text-gray-800 mt-1 bg-white px-2 py-1 border border-gray-200 rounded-md inline-block">
                    {`${getFirst3Letters(formData.marca || (formData.tipo_catalogo === 'servicio' ? 'SALON' : 'Marca_Generica'))}-${getFirst3Letters(formData.linea || (formData.tipo_catalogo === 'servicio' ? 'SRV' : 'Linea_Generica'))}-${getFirst3Letters(formData.nombre)}-${formData.tipo_catalogo === 'servicio' ? 'SRV' : (formData.tipo_catalogo === 'insumo' ? 'INS' : 'RET')}-${getFirst3Letters(formData.presentacion || (formData.tipo_catalogo === 'servicio' ? 'SES' : 'Pres_Generica'))}`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                  {editItem ? 'Guardar Cambios' : 'Crear Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmConfig} />
      <PromptDialog {...promptConfig} />
    </>
    )}
  </div>
  );
}
