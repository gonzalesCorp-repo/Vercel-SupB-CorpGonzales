'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'

export interface KudosModalProps {
  isOpen: boolean
  onClose: () => void
  receiverId: string
  receiverName: string
  onSend: (tipo: string, mensaje: string) => void
}

const KUDOS_TYPES = [
  { id: 'tijeras', emoji: '✂️', name: 'Tijeras Doradas', desc: 'Excelente técnica y estilo' },
  { id: 'estrella', emoji: '⭐', name: 'Estrella Brillante', desc: 'Actitud positiva contagiosa' },
  { id: 'mano', emoji: '🤝', name: 'Mano Amiga', desc: 'Gran trabajo en equipo' },
  { id: 'corona', emoji: '👑', name: 'Corona de Oro', desc: 'Servicio al cliente premium' },
]

export default function KudosModal({ isOpen, onClose, receiverId, receiverName, onSend }: KudosModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSend = () => {
    if (!selectedType) return
    onSend(selectedType, message)
    setIsSuccess(true)
    setTimeout(() => {
      setIsSuccess(false)
      setSelectedType(null)
      setMessage('')
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-slate-900 border-t border-slate-800 rounded-t-[2rem] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-800/50 rounded-full">
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-100">Enviar Kudos</h2>
              <p className="text-slate-400 text-sm mt-1">Reconoce el gran trabajo de <span className="text-indigo-400 font-bold">{receiverName}</span></p>
            </div>

            {isSuccess ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1 }}
                  className="text-6xl mb-4"
                >
                  ✨
                </motion.div>
                <h3 className="text-xl font-bold text-slate-100">¡Kudos enviados!</h3>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {KUDOS_TYPES.map((kudo) => (
                    <button
                      key={kudo.id}
                      onClick={() => setSelectedType(kudo.id)}
                      className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                        selectedType === kudo.id 
                          ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] scale-105' 
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-4xl mb-2">{kudo.emoji}</span>
                      <span className="text-slate-200 font-bold text-sm text-center">{kudo.name}</span>
                    </button>
                  ))}
                </div>

                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <textarea
                      placeholder="Escribe un mensaje (opcional)..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none"
                    />
                    <button
                      onClick={handleSend}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    >
                      <span>Enviar Kudos</span>
                      <Send size={18} />
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
