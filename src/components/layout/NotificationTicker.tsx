'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight, Activity } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
  "🎫 Nuevo OATC generado para cliente 'María López'.",
  "✅ Estilista 'Jessica Huaman' finalizó servicio.",
  "🔔 Ingreso de 'Juan Pérez' a la sede.",
  "⏳ Cliente 'Carlos' lleva 15 min esperando.",
  "💆‍♀️ Cabina 2 ocupada por 'Cosmiatra Laura'."
];

export function NotificationTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Rotar notificaciones cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % MOCK_NOTIFICATIONS.length);
        setIsVisible(true);
      }, 500); // 500ms para la transición de desvanecimiento
      
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
      <div className="bg-slate-50 border border-slate-200 rounded-full py-1.5 px-4 flex items-center gap-3 overflow-hidden shadow-inner relative group cursor-pointer hover:bg-slate-100 transition-colors">
        
        {/* Icono animado */}
        <div className="relative flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="absolute top-0 right-0 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </div>

        {/* Separador */}
        <div className="h-4 w-px bg-slate-300"></div>

        {/* Texto del Ticker */}
        <div className="flex-1 relative h-5 overflow-hidden flex items-center">
          <p 
            className={`text-xs font-medium text-slate-700 truncate transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
          >
            <span className="font-bold text-blue-700 mr-2">EN VIVO:</span>
            {MOCK_NOTIFICATIONS[currentIndex]}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  );
}
