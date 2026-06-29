import React, { useState, useEffect, useRef } from 'react';
import { X, GripHorizontal } from 'lucide-react';

interface FloatingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FloatingWindow({ isOpen, onClose, title, children }: FloatingWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      // Center the window initially
      const initialX = window.innerWidth / 2 - 250;
      const initialY = window.innerHeight / 2 - 300;
      setPosition({ x: Math.max(0, initialX), y: Math.max(0, initialY) });
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  return (
    <div 
      style={{ left: position.x, top: position.y, minWidth: '320px', minHeight: '400px' }}
      className={`fixed z-50 bg-white rounded-xl shadow-2xl shadow-indigo-900/10 border border-slate-300 flex flex-col w-[90vw] max-w-[500px] transition-shadow ${isDragging ? 'shadow-3xl opacity-95' : ''} resize overflow-hidden`}
    >
      <div 
        className="px-4 py-3 border-b border-slate-200 flex items-center justify-between cursor-move bg-slate-100 rounded-t-xl select-none group"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-1 flex-1 min-h-0 overflow-y-auto bg-slate-50 rounded-b-xl">
        {children}
      </div>
    </div>
  );
}
