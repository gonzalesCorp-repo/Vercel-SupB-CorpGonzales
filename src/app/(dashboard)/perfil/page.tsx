'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useThemeStore } from '@/store/useThemeStore';
import { KeyRound, Save, UserCircle2, Check, Palette, Moon, Sun, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiPerfilPage() {
  const [agente, setAgente] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const showAlert = useUIStore((state) => state.showAlert);
  
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const setPrimaryColor = useThemeStore((state) => state.setPrimaryColor);

  const colors = [
    { name: 'Índigo', value: '#4f46e5' },
    { name: 'Esmeralda', value: '#10b981' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Violeta', value: '#8b5cf6' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Rojo', value: '#ef4444' }
  ];

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data } = await supabase.from('agentes').select('*').eq('email', user.email).single();
        if (data) {
          setAgente(data);
          if (data.pin) setPin(data.pin);
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || isNaN(Number(pin))) {
      showAlert("El PIN debe ser un número de 4 dígitos", "error");
      return;
    }

    if (!agente?.id) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('agentes')
      .update({ pin })
      .eq('id', agente.id);

    setIsSaving(false);

    if (error) {
      showAlert("Error al guardar el PIN", "error");
    } else {
      showAlert("PIN actualizado exitosamente", "success");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-slate-200 border-t-transparent rounded-full"
          style={{ borderTopColor: primaryColor }}
        />
      </div>
    );
  }

  if (!agente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <UserCircle2 className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium">No tienes un perfil de agente asociado</h2>
      </div>
    );
  }

  return (
    <div className={`min-h-full transition-colors duration-500 ${themeMode === 'dark' ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative"
        >
          {/* Decorative ambient light */}
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: primaryColor }} />
          
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mi Cuenta
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Personaliza tu experiencia y configura tu seguridad.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* User Identity Card */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-slate-200 to-transparent dark:from-white/5 opacity-50 blur-2xl rounded-full transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="relative group">
                <div className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" style={{ backgroundColor: primaryColor }} />
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-inner relative z-10 overflow-hidden" style={{ backgroundColor: primaryColor }}>
                  <UserCircle2 className="w-14 h-14 opacity-90" />
                </div>
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{agente.nombre}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-3">{agente.email}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 shadow-sm backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    ROL: {agente.rol}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PIN Security Card */}
            <motion.div variants={itemVariants} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Seguridad PIN</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium relative z-10">
                Tu llave de acceso rápido para autorizar operaciones. Mantenla en secreto.
              </p>

              <form onSubmit={handleSavePin} className="mt-auto space-y-6 relative z-10">
                <div className="relative group">
                  <input
                    id="pinInput"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-4xl tracking-[1em] pl-[1em] text-center font-bold px-4 py-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 focus:border-transparent outline-none transition-all text-slate-800 dark:text-white shadow-inner relative z-10"
                    required
                  />
                  {/* Glowing border effect on focus */}
                  <div className="absolute inset-0 -z-10 rounded-2xl opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300" style={{ backgroundColor: primaryColor }} />
                </div>
                
                <motion.button
                  whileHover={{ scale: pin.length === 4 ? 1.02 : 1 }}
                  whileTap={{ scale: pin.length === 4 ? 0.98 : 1 }}
                  type="submit"
                  disabled={isSaving || pin.length !== 4}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 px-6 rounded-2xl shadow-lg disabled:opacity-50 transition-all border border-white/20"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Guardar PIN Operativo</span>
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* Theme Customization Card */}
            <motion.div variants={itemVariants} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Personalización</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium relative z-10">
                Adapta la interfaz a tu estilo. Tus "skins" se guardan automáticamente.
              </p>

              <div className="space-y-8 mt-auto relative z-10">
                {/* Theme Mode Toggle */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Modo de Visualización</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode('light')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium ${themeMode === 'light' ? 'border-transparent text-white shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      style={themeMode === 'light' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Sun className="w-4 h-4" /> Claro
                    </button>
                    <button
                      type="button"
                      onClick={() => setThemeMode('dark')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-medium ${themeMode === 'dark' ? 'border-transparent text-white shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      style={themeMode === 'dark' ? { backgroundColor: primaryColor } : {}}
                    >
                      <Moon className="w-4 h-4" /> Oscuro
                    </button>
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Color de Acento</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const isSelected = primaryColor === color.value;
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setPrimaryColor(color.value)}
                          title={color.name}
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? 'scale-110 shadow-lg' : 'hover:scale-110 shadow-sm'}`}
                          style={{ backgroundColor: color.value }}
                        >
                          {isSelected && (
                            <motion.div 
                              layoutId="outline"
                              className="absolute -inset-1.5 rounded-full border-2"
                              style={{ borderColor: color.value }}
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                          )}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Check className="w-5 h-5 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
