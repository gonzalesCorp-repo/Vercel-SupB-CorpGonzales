import React, { useState, useEffect } from 'react';

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Aceptar', confirmColor = 'bg-indigo-600 hover:bg-indigo-700' }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 font-medium">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-xl ${confirmColor}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export function PromptDialog({ isOpen, title, message, defaultValue, onConfirm, onCancel }: any) {
  const [val, setVal] = useState(defaultValue || '');
  
  useEffect(() => {
    if (isOpen) setVal(defaultValue || '');
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 font-medium mb-4">{message}</p>
          <input type="text" value={val} onChange={e=>setVal(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-800" autoFocus />
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onConfirm(val)} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}
