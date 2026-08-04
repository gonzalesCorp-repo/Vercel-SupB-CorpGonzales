'use client';

import { Search, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { OATC, Bien } from '@/services/recepcion';

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOatc: OATC | null;
  catalogo: Bien[];
  searchCat: string;
  setSearchCat: (s: string) => void;
  handleAgregarServicio: (bien: Bien) => void;
  handleRemoverServicio: (index: number) => void;
  handleUpdatePrecio?: (index: number, newPrice: number) => void;
}

export default function AddServiceModal({
  isOpen,
  onClose,
  selectedOatc,
  catalogo,
  searchCat,
  setSearchCat,
  handleAgregarServicio,
  handleRemoverServicio,
  handleUpdatePrecio
}: AddServiceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Servicios de: ${selectedOatc?.cliente_nombre || ''}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 mt-2">
        <h3 className="font-bold text-gray-700">Servicios Actuales</h3>
        <div className="space-y-2 mb-6">
          {selectedOatc?.punto_partida?.map((srv: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-xl bg-gray-50">
              <div className="flex-1 pr-3">
                <p className="font-bold text-gray-800">{srv.nombre}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white px-2 py-1.5 rounded-lg border border-gray-300 shadow-sm">
                  <span className="text-xs font-bold text-gray-500">S/</span>
                  <input 
                    type="number" 
                    value={srv.precio ?? srv.monto ?? srv.precio_venta ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (handleUpdatePrecio) {
                        handleUpdatePrecio(idx, val);
                      }
                    }}
                    className="w-20 font-bold text-gray-900 text-sm bg-transparent focus:outline-none text-right"
                    step="0.5"
                  />
                </div>
                <button
                  onClick={() => handleRemoverServicio(idx)}
                  className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                  title="Eliminar servicio"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {(!selectedOatc?.punto_partida || selectedOatc.punto_partida.length === 0) && (
            <p className="text-sm text-gray-500 italic">No hay servicios asociados.</p>
          )}
        </div>

        <hr className="border-gray-200" />
        <h3 className="font-bold text-gray-700 mt-4">Añadir Nuevo Servicio</h3>

        <div className="relative mb-4">
          <input
            type="text"
            value={searchCat}
            onChange={(e) => setSearchCat(e.target.value)}
            placeholder="Buscar en catálogo..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 bg-gray-50"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
        </div>

        <div className="space-y-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
          {catalogo
            .filter((b) => b.nombre.toLowerCase().includes(searchCat.toLowerCase()))
            .map((bien) => (
              <div
                key={bien.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-bold text-gray-800">{bien.nombre}</p>
                  <p className="text-xs text-gray-500">Precio Ref: ${bien.precio_venta}</p>
                </div>
                <button
                  onClick={() => handleAgregarServicio(bien)}
                  className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 transition-colors"
                  title="Añadir"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          {catalogo.length === 0 && (
            <p className="text-center text-gray-500 py-4">No hay servicios disponibles.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
