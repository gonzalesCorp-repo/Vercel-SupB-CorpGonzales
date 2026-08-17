'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Cliente } from '@/services/recepcion';
import DirectorioClientesModal from './DirectorioClientesModal';
import { SmartClientAutocomplete } from '@/components/ui/watermelon-patterns/smart-client-autocomplete';

interface ClientSearchProps {
  onSelect: (cliente: Cliente | null) => void;
  selectedClientName?: string;
}

export default function ClientSearch({ onSelect, selectedClientName }: ClientSearchProps) {
  const [showDirectorioModal, setShowDirectorioModal] = useState(false);

  const handleSelectClienteDirecto = (cli: Cliente | null) => {
    onSelect(cli);
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <SmartClientAutocomplete
            onSelect={handleSelectClienteDirecto}
            selectedClient={selectedClientName ? { nombre: selectedClientName } as any : null}
            placeholder="Buscar por DNI, Nombre o Celular..."
          />
        </div>

        {/* Botón Lupa / Directorio Multisede */}
        <button
          type="button"
          onClick={() => setShowDirectorioModal(true)}
          title="Abrir Directorio Multisede de Clientes"
          className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-2xl transition flex items-center justify-center gap-1 shrink-0 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-bold hidden sm:inline">Directorio</span>
        </button>
      </div>

      {/* Modal Directorio Multisede */}
      <DirectorioClientesModal
        isOpen={showDirectorioModal}
        onClose={() => setShowDirectorioModal(false)}
        onSelectCliente={(cli) => {
          handleSelectClienteDirecto(cli);
          setShowDirectorioModal(false);
        }}
      />
    </div>
  );
}
