'use client';

import { useState, useEffect } from 'react';
import { Search, X, Scissors, Beaker, Plus } from 'lucide-react';
import { obtenerCatalogo, Bien } from '@/services/recepcion';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'servicio' | 'producto' | null;
  onAdd: (bien: Bien) => void;
}

export default function CatalogModal({ isOpen, onClose, tipo, onAdd }: CatalogModalProps) {
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [query, setQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tipo) {
      cargarCatalogo();
    } else {
      // Reset state when closing
      setQuery('');
      setCategoriaSeleccionada('todas');
    }
  }, [isOpen, tipo]);

  const cargarCatalogo = async () => {
    if (!tipo) return;
    setIsLoading(true);
    const data = await obtenerCatalogo(tipo);
    setBienes(data);
    
    // Extraer categorías únicas
    const catSet = new Set<string>();
    data.forEach(b => {
      if (b.categoria) catSet.add(b.categoria.trim());
    });
    setCategorias(Array.from(catSet).sort());
    
    setIsLoading(false);
  };

  if (!isOpen || !tipo) return null;

  // Filtrado
  const filteredBienes = bienes.filter(b => {
    const matchCat = categoriaSeleccionada === 'todas' || b.categoria?.trim() === categoriaSeleccionada;
    
    const q = query.toLowerCase();
    let matchText = false;
    if (q === '') {
      matchText = true;
    } else {
      const nombre = b.nombre?.toLowerCase() || '';
      const cat = b.categoria?.toLowerCase() || '';
      let matchMarca = false;
      if (tipo === 'producto' && b.atributos_producto?.marca) {
        matchMarca = b.atributos_producto.marca.toLowerCase().includes(q);
      }
      matchText = nombre.includes(q) || cat.includes(q) || matchMarca;
    }
    
    return matchCat && matchText;
  });

  const isServicio = tipo === 'servicio';
  const colorTheme = isServicio ? 'blue' : 'green';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-xl flex items-center justify-center w-12 h-12 bg-${colorTheme}-100 text-${colorTheme}-600`}>
              {isServicio ? <Scissors className="w-6 h-6" /> : <Beaker className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {isServicio ? 'Catálogo de Servicios' : 'Catálogo de Productos (Retail)'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50">
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl p-3 pl-10 shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors" 
              placeholder="Buscar por nombre, categoría o marca..." 
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
            <button 
              onClick={() => setCategoriaSeleccionada('todas')}
              className={`px-5 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border shadow-sm ${categoriaSeleccionada === 'todas' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button 
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-5 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-colors border shadow-sm capitalize ${categoriaSeleccionada === cat ? (isServicio ? 'bg-blue-600 text-white border-blue-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <span className="text-gray-500">Cargando catálogo...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBienes.map(bien => (
                <div key={bien.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider line-clamp-1 ${isServicio ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                        {bien.categoria}
                      </span>
                      {bien.precio_venta && (
                        <span className="text-sm font-black text-gray-900 shrink-0">
                          S/ {bien.precio_venta}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-[15px] mb-2 leading-snug line-clamp-2">{bien.nombre}</h3>
                    
                    {/* Atributos dinámicos */}
                    <div className="text-[11px] text-gray-500 mt-3 space-y-1.5 bg-gray-50 p-2 rounded-lg">
                      {!isServicio && bien.atributos_producto ? (
                        <div className="flex flex-col gap-1">
                          {bien.atributos_producto.marca && (
                            <p className="flex items-center gap-1"><span className="font-bold text-gray-600">Marca:</span> <span className="truncate">{bien.atributos_producto.marca}</span></p>
                          )}
                          {bien.atributos_producto.linea && (
                            <p className="flex items-center gap-1"><span className="font-bold text-gray-600">Línea:</span> <span className="truncate">{bien.atributos_producto.linea}</span></p>
                          )}
                        </div>
                      ) : isServicio && bien.atributos_servicio ? (
                        <div className="flex flex-col gap-1">
                          {bien.atributos_servicio.tiempo_estimado_min && (
                            <p className="flex items-center gap-1">
                              ⏱️ <span>{bien.atributos_servicio.tiempo_estimado_min} min</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="italic text-gray-400">Sin atributos adicionales</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      onAdd(bien);
                      onClose(); // Optional: close modal after add, or leave open. Let's close for now.
                    }} 
                    className={`mt-4 w-full font-bold rounded-xl text-xs px-4 py-2.5 transition-all flex items-center justify-center gap-2 border ${isServicio ? 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600' : 'text-green-600 bg-green-50 border-green-100 hover:bg-green-600 hover:text-white hover:border-green-600'}`}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar al Ticket
                  </button>
                </div>
              ))}
              
              {filteredBienes.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Sin resultados</h3>
                  <p className="text-sm text-gray-500 max-w-sm">No encontramos ningún ítem que coincida con tu búsqueda. Intenta con otros términos o selecciona "Todas".</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
