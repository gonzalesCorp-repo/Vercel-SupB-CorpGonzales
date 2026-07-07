'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, RefreshCw, Box, Tag, DollarSign, Database, ChevronDown, ChevronRight, Edit2, Archive, ArchiveRestore, Edit3, Settings2 } from 'lucide-react';
import { getCatalogo, guardarBien, inactivarBien, actualizarJerarquia, inactivarJerarquia } from './actions';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

import { ConfirmDialog, PromptDialog } from '@/components/ui/PremiumDialog';
import { BulkUploader } from '@/components/ui/BulkUploader';

function getFirst3Letters(str: string) {
  if (!str) return 'XXX';
  return String(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
}

export default function CatalogoMasterPage() {
  const [bienes, setBienes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'insumo' | 'producto' | 'servicio'>('todos');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const { sedeActiva } = useAppStore();

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
    tipo_catalogo: 'retail', stockInicial: 0
  });

  const cargarBienes = async () => {
    setIsLoading(true);
    try {
      const data = await getCatalogo(filtroTipo, mostrarInactivos);
      if (data) setBienes(data);
    } catch (error: any) {
      alert("Error cargando catálogo: " + error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarBienes();
  }, [filtroTipo, mostrarInactivos]);

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
      setFormData({
        nombre: item.nombre,
        categoria: item.categoria,
        tipo_bien: item.tipo_bien,
        precio_venta: item.precio_venta || 0,
        marca: item.atributos_producto?.marca || '',
        linea: item.atributos_producto?.linea || '',
        presentacion: item.atributos_producto?.presentacion || '',
        proveedor: item.atributos_producto?.proveedor || '',
        costo_unitario: item.atributos_producto?.costo_unitario || 0,
        tipo_catalogo: item.atributos_producto?.tipo_catalogo || 'retail',
        stockInicial: 0
      });
    } else {
      setEditItem(null);
      setFormData({
        nombre: '', categoria: '', tipo_bien: 'producto', precio_venta: 0,
        marca: '', linea: '', presentacion: '', proveedor: '', costo_unitario: 0,
        tipo_catalogo: filtroTipo === 'insumo' ? 'insumo' : 'retail', stockInicial: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tipoSku = formData.tipo_catalogo === 'insumo' ? 'INS' : 'RET';
    const skuMarca = formData.marca || 'Marca_Generica';
    const skuLinea = formData.linea || 'Linea_Generica';
    const skuPres = formData.presentacion || 'Pres_Generica';
    const sku = `${getFirst3Letters(skuMarca)}-${getFirst3Letters(skuLinea)}-${getFirst3Letters(formData.nombre)}-${tipoSku}-${getFirst3Letters(skuPres)}`;
    
    const payload = {
      nombre: formData.nombre,
      categoria: formData.linea || formData.categoria,
      tipo_bien: formData.tipo_bien,
      precio_venta: parseFloat(formData.precio_venta) || 0,
      stockInicial: parseInt(formData.stockInicial) || 0,
      atributos_producto: {
        sku,
        marca: formData.marca,
        linea: formData.linea,
        presentacion: formData.presentacion,
        proveedor: formData.proveedor,
        costo_unitario: parseFloat(formData.costo_unitario) || 0,
        tipo_catalogo: formData.tipo_catalogo,
        estado: editItem?.atributos_producto?.estado // preserve state
      }
    };

    try {
      await guardarBien(editItem?.id || null, payload, sedeActiva?.id || '', true); // assuming admin
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
              title="Importar Excel" 
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
            {['todos', 'insumo', 'producto', 'servicio'].map(tipo => (
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
                        className="p-4 space-y-3 bg-white"
                      >
                        {Object.entries(lineas).map(([linea, items]) => {
                          const lineaKey = `${marca}-${linea}`;
                          return (
                            <div key={lineaKey} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                              <div className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors group/linea">
                                <button 
                                  onClick={() => toggleLinea(lineaKey)}
                                  className="flex items-center gap-3 pl-4 flex-1 text-left"
                                >
                                  {expandedLineas[lineaKey] ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-indigo-500" />}
                                  <span className="font-bold text-gray-800">{linea}</span>
                                </button>
                                <div className="flex items-center gap-2 pr-2">
                                  <div className="opacity-0 group-hover/linea:opacity-100 transition-opacity flex items-center gap-1">
                                    <button onClick={() => handleRenameHierarchy('linea', linea)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Renombrar Línea"><Edit3 className="w-3 h-3" /></button>
                                    <button onClick={() => handleDisableHierarchy('linea', linea, false)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Inactivar Línea"><Archive className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              </div>
                              
                              <AnimatePresence>
                              {expandedLineas[lineaKey] && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="p-0 overflow-x-auto"
                                >
                                <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-50 text-gray-500 border-y border-gray-100 text-xs uppercase">
                                    <tr>
                                      <th className="py-2 px-4">SKU</th>
                                      <th className="py-2 px-4">Nombre / Presentación</th>
                                      <th className="py-2 px-4">Clasificación</th>
                                      <th className="py-2 px-4 text-right">Precios</th>
                                      <th className="py-2 px-4 text-center">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {items.map(bien => {
                                      const isInactive = bien.atributos_producto?.estado === 'inactivo';
                                      return (
                                        <tr key={bien.id} className={`hover:bg-gray-50/50 transition-colors group/item ${isInactive ? 'opacity-50 grayscale' : ''}`}>
                                          <td className="py-2 px-4">
                                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md ${isInactive ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                              {bien.atributos_producto?.sku || '---'}
                                            </span>
                                            {isInactive && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">INACTIVO</span>}
                                          </td>
                                          <td className="py-2 px-4">
                                            <div className="font-bold text-gray-900 group-hover/item:text-indigo-700">{bien.nombre}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1"><Box className="w-3 h-3" /> {bien.atributos_producto?.presentacion || 'Unidad'}</div>
                                          </td>
                                          <td className="py-2 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                              bien.atributos_producto?.tipo_catalogo === 'insumo' ? 'bg-amber-100 text-amber-700' :
                                              bien.atributos_producto?.tipo_catalogo === 'retail' ? 'bg-emerald-100 text-emerald-700' :
                                              'bg-blue-100 text-blue-700'
                                            }`}>
                                              {bien.atributos_producto?.tipo_catalogo || bien.tipo_bien}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                              {bien.precio_venta != null && bien.precio_venta > 0 && (
                                                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                                  <DollarSign className="w-3 h-3" />{bien.precio_venta.toFixed(2)}
                                                </div>
                                              )}
                                              {bien.atributos_producto?.costo_unitario != null && (
                                                <div className="flex items-center gap-1 text-gray-400 font-medium text-[10px]">
                                                  Costo: ${parseFloat(bien.atributos_producto.costo_unitario).toFixed(2)}
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                              <button onClick={() => openModal(bien)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                                                <Edit2 className="w-4 h-4" />
                                              </button>
                                              <button onClick={() => toggleStatus(bien.id, isInactive)} className={`p-1.5 rounded-lg transition-colors ${isInactive ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={isInactive ? 'Reactivar' : 'Inactivar'}>
                                                {isInactive ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-black text-gray-800">{editItem ? 'Editar Ítem del Catálogo' : 'Nuevo Ítem de Catálogo'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Nombre del Ítem</label>
                  <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Marca</label>
                  <input type="text" placeholder="Ej. Kerastase" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Línea / Categoría</label>
                  <input type="text" placeholder="Ej. Densifique" value={formData.linea} onChange={e => setFormData({...formData, linea: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Presentación</label>
                  <input type="text" placeholder="Ej. 500ml, Unidad, Caja" value={formData.presentacion} onChange={e => setFormData({...formData, presentacion: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Proveedor Principal</label>
                  <input type="text" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Clasificación</label>
                  <select value={formData.tipo_catalogo} onChange={e => setFormData({...formData, tipo_catalogo: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                    <option value="retail">Producto Final (Retail)</option>
                    <option value="insumo">Insumo / Consumible</option>
                    <option value="servicio">Servicio (No inventariable)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Precio Venta (PVP)</label>
                  <input type="number" step="0.01" value={formData.precio_venta} onChange={e => setFormData({...formData, precio_venta: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Costo Unitario Ref.</label>
                  <input type="number" step="0.01" value={formData.costo_unitario} onChange={e => setFormData({...formData, costo_unitario: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                {!editItem && (
                  <div className="space-y-1">
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
                    {`${getFirst3Letters(formData.marca || 'Marca_Generica')}-${getFirst3Letters(formData.linea || 'Linea_Generica')}-${getFirst3Letters(formData.nombre)}-${formData.tipo_catalogo === 'insumo' ? 'INS' : 'RET'}-${getFirst3Letters(formData.presentacion || 'Pres_Generica')}`}
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
    </div>
  );
}
