'use client';

import { useUIStore } from '@/store/useUIStore';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Modal } from './Modal';

export function GlobalUI() {
  const { toasts, removeToast, confirmState, closeConfirm } = useUIStore();

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'error': return 'bg-red-50 border-red-200 text-red-900';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-900';
      default: return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${getToastColors(toast.type)} min-w-[300px] max-w-sm animate-in slide-in-from-right-8 fade-in duration-300`}
          >
            <div className="shrink-0 mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="flex-1 text-sm font-medium pr-2">
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      <Modal 
        isOpen={confirmState.isOpen} 
        onClose={() => {
          if (confirmState.onCancel) confirmState.onCancel();
          closeConfirm();
        }} 
        title={confirmState.title} 
        maxWidth="max-w-sm"
      >
        <div className="space-y-6">
          <p className="text-slate-600 text-sm">{confirmState.message}</p>
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => {
                if (confirmState.onCancel) confirmState.onCancel();
                closeConfirm();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                confirmState.onConfirm();
                closeConfirm();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
