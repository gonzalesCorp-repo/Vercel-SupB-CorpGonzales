'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardDrive, UploadCloud, Video, Music, Image as ImageIcon, 
  FileText, Search, X, Copy, ExternalLink, Trash2, CheckCircle2,
  Folder, Play, Eye, Download, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { 
  DriveCuenta, 
  DriveArchivo, 
  obtenerCuentasDrive, 
  listarArchivosDrive, 
  subirArchivoDrive, 
  generarEnlaceCompartible,
  formatearTamanoBytes
} from '@/services/drive';

interface GoogleDriveExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entidadTipo?: 'CLIENTE' | 'MARCA' | 'OATC' | 'SEDE' | 'GENERAL';
  entidadId?: string;
  entidadNombre?: string;
}

export function GoogleDriveExplorerModal({
  isOpen,
  onClose,
  entidadTipo = 'GENERAL',
  entidadId,
  entidadNombre = 'Archivos de la Empresa'
}: GoogleDriveExplorerModalProps) {
  const [cuentas, setCuentas] = useState<DriveCuenta[]>([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState<string>('');
  const [archivos, setArchivos] = useState<DriveArchivo[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'VIDEOS' | 'AUDIOS' | 'IMAGENES' | 'DOCUMENTOS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Media Preview State
  const [previewFile, setPreviewFile] = useState<DriveArchivo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    obtenerCuentasDrive().then(data => {
      setCuentas(data);
      if (data.length > 0) {
        setSelectedCuentaId(data[0].id);
      }
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedCuentaId) return;
    cargarArchivos();
  }, [isOpen, selectedCuentaId, filtroTipo, busqueda]);

  const cargarArchivos = async () => {
    setLoading(true);
    const list = await listarArchivosDrive(selectedCuentaId, undefined, undefined, filtroTipo, busqueda);
    setArchivos(list);
    setLoading(false);
  };

  const handleFilesDropped = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedCuentaId) return;
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await subirArchivoDrive(
        selectedCuentaId,
        file,
        entidadTipo,
        entidadNombre,
        entidadId,
        (pct) => setUploadProgress(pct)
      );
    }

    setIsUploading(false);
    setFeedback(`¡${files.length} archivo(s) subido(s) a Google Drive con éxito!`);
    cargarArchivos();
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleCopiarEnlace = (archivo: DriveArchivo) => {
    const link = generarEnlaceCompartible(archivo);
    navigator.clipboard.writeText(link);
    setFeedback(`¡Enlace copiado al portapapeles: "${archivo.nombre_archivo}"!`);
    setTimeout(() => setFeedback(''), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header con Switcher de Cuentas */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Google Drive Cloud Storage</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase">
                  {entidadTipo}: {entidadNombre}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gestión de videos 4K, audios, fotos HD y documentación organizada en la nube.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Selector de Cuentas de Drive */}
            <select
              value={selectedCuentaId}
              onChange={(e) => setSelectedCuentaId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 max-w-xs truncate"
            >
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre_descriptivo} ({c.proposito})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros & Búsqueda */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Filtros de Tipo MIME */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'TODOS' as const, label: 'Todos', icon: Folder },
              { id: 'VIDEOS' as const, label: 'Videos 4K', icon: Video },
              { id: 'AUDIOS' as const, label: 'Audios', icon: Music },
              { id: 'IMAGENES' as const, label: 'Fotos HD', icon: ImageIcon },
              { id: 'DOCUMENTOS' as const, label: 'Docs / PDF', icon: FileText }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition ${
                  filtroTipo === f.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar archivos en Drive..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {feedback && (
          <div className="m-3 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Zona de Arrastre Drag & Drop Pesado */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesDropped(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                : 'border-slate-800 hover:border-amber-500/40 bg-slate-900/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => handleFilesDropped(e.target.files)}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white">
                  Arrastra archivos pesados aquí o <span className="text-amber-400 underline">haz clic para subir</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Soporta Videos MP4/MOV (hasta 5GB), Audios WAV/MP3, Fotos RAW/PNG y Documentos PDF.
                </p>
              </div>
            </div>

            {/* Barra de Progreso */}
            {isUploading && (
              <div className="mt-3 max-w-md mx-auto space-y-1 animate-in fade-in">
                <div className="flex justify-between text-[10px] text-amber-300 font-bold">
                  <span>Subiendo a Google Drive vía Stream...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista / Grid de Archivos */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {archivos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Folder className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs font-bold">No se encontraron archivos en este Drive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {archivos.map((a) => {
                const isVideo = a.mime_type.startsWith('video/');
                const isAudio = a.mime_type.startsWith('audio/');
                const isImage = a.mime_type.startsWith('image/');
                const isPdf = a.mime_type.includes('pdf');

                return (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg group"
                  >
                    {/* Header del Card de Archivo */}
                    <div className="flex items-start gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isVideo
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : isAudio
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : isImage
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isVideo && <Video className="w-4 h-4" />}
                        {isAudio && <Music className="w-4 h-4" />}
                        {isImage && <ImageIcon className="w-4 h-4" />}
                        {isPdf && <FileText className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate" title={a.nombre_archivo}>
                          {a.nombre_archivo}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {formatearTamanoBytes(a.tamano_bytes)} • <span className="text-slate-500">{a.carpeta_ruta}</span>
                        </p>
                      </div>
                    </div>

                    {/* Previsualización Miniatura si existe */}
                    {a.thumbnail_url && (
                      <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative group-hover:opacity-90 transition">
                        <img
                          src={a.thumbnail_url}
                          alt={a.nombre_archivo}
                          className="w-full h-full object-cover"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acciones del Archivo */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(a)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3 text-amber-400" />
                        <span>Previsualizar</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopiarEnlace(a)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                          title="Copiar Enlace Compartible"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={a.web_view_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg transition"
                          title="Abrir en Google Drive"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Previsualización Multimedia Embebida */}
        <AnimatePresence>
          {previewFile && (
            <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-white">{previewFile.nombre_archivo}</h3>
                    <p className="text-[10px] text-slate-400">
                      {formatearTamanoBytes(previewFile.tamano_bytes)} • {previewFile.mime_type}
                    </p>
                  </div>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="text-slate-400 hover:text-white font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Visor Contextual según MIME */}
                <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] max-h-[500px]">
                  {previewFile.mime_type.startsWith('video/') ? (
                    <video
                      controls
                      autoPlay
                      src={previewFile.web_view_link}
                      className="max-h-[480px] w-full object-contain"
                    />
                  ) : previewFile.mime_type.startsWith('audio/') ? (
                    <div className="p-8 w-full text-center space-y-4">
                      <Music className="w-12 h-12 text-sky-400 mx-auto" />
                      <audio controls src={previewFile.web_view_link} className="w-full" />
                    </div>
                  ) : previewFile.mime_type.startsWith('image/') ? (
                    <img
                      src={previewFile.web_view_link}
                      alt={previewFile.nombre_archivo}
                      className="max-h-[480px] max-w-full object-contain"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <FileText className="w-12 h-12 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300">Documento / PDF listo para visualización y descarga.</p>
                      <a
                        href={previewFile.web_view_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Abrir en Google Docs / Drive
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400">Subido por {previewFile.subido_por_nombre}</span>
                  <button
                    type="button"
                    onClick={() => handleCopiarEnlace(previewFile)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" /> Copiar Enlace Público
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
