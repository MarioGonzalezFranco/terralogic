// ─────────────────────────────────────────────────────────────
// AnalysisPage.tsx
// Selector de campo existente O nombre personalizado + análisis.
// PARA EL BACKEND: reemplazar processFile con Firebase Storage
// ─────────────────────────────────────────────────────────────

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, FileText, Droplets, Bug, Loader2,
  ImageOff, X, CheckCircle, ChevronDown, Plus,
} from 'lucide-react';
import { PageHeader } from '../components/ui';
import { RECENT_FIELDS } from '../constants';

const ACCEPTED_FORMATS = ['JPG', 'PNG', 'WEBP'];
const ACCEPTED_MIME    = 'image/jpeg,image/png,image/webp';

interface AnalysisPageProps {
  onNotify:           (msg: string) => void;
  onAnalysisComplete: (imageUrl: string, fieldId: string) => void;
}

export default function AnalysisPage({ onNotify, onAnalysisComplete }: AnalysisPageProps) {
  // Modo de selección de campo: 'existing' = elegir de la lista, 'new' = escribir nombre
  const [fieldMode,     setFieldMode]     = useState<'existing' | 'new'>('existing');
  const [selectedField, setSelectedField] = useState('');
  const [customField,   setCustomField]   = useState('');

  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging,   setIsDragging]   = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName,      setFileName]     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campo efectivo según el modo activo
  const effectiveField = fieldMode === 'existing' ? selectedField : customField.trim();

  const handleZoneClick = () => {
    if (!effectiveField) {
      onNotify('Por favor selecciona o escribe el nombre del campo antes de subir.');
      return;
    }
    if (!isAnalyzing) fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify('Formato no válido. Usa JPG, PNG o WEBP.');
      return;
    }
    if (!effectiveField) {
      onNotify('Por favor indica el campo antes de subir la imagen.');
      return;
    }
    setFileName(file.name);
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setTimeout(() => {
        setUploadedImage(imageUrl);
        setIsAnalyzing(false);
        onAnalysisComplete(imageUrl, effectiveField);
        onNotify(`Análisis de ${effectiveField} completado con éxito.`);
      }, 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleClear = () => { setUploadedImage(null); setFileName(null); };

  const handleGeneratePDF = () => {
    setIsGenerating(true);
    setTimeout(() => { setIsGenerating(false); onNotify('Reporte PDF generado y listo para descargar.'); }, 2000);
  };

  const selectedFieldData = fieldMode === 'existing'
    ? RECENT_FIELDS.find(f => f.id === selectedField)
    : null;

  const switchMode = (mode: 'existing' | 'new') => {
    setFieldMode(mode);
    setSelectedField('');
    setCustomField('');
    handleClear();
  };

  return (
    <div className="space-y-10">
      <PageHeader
        label="Inteligencia Artificial"
        title="Análisis Avanzado de Cultivos"
        description="Selecciona o nombra el campo a analizar, sube la imagen del dron y la IA hará el resto."
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">

          {/* ─── PASO 1: Seleccionar o crear campo ─────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-earth-200 shadow-xl shadow-earth-900/5 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-agri-green-800 text-white flex items-center justify-center font-black text-sm shadow-md">1</div>
              <div>
                <h3 className="font-black text-agri-green-950 tracking-tight">Identificar Campo</h3>
                <p className="text-xs font-bold text-earth-400 mt-0.5">Elige un sector existente o escribe un nombre nuevo</p>
              </div>
            </div>

            {/* Tabs: Existente / Nuevo */}
            <div className="flex gap-2 p-1.5 bg-earth-200/40 rounded-2xl mb-6">
              <button
                onClick={() => switchMode('existing')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                  fieldMode === 'existing' ? 'bg-white text-agri-green-800 shadow-md' : 'text-earth-500 hover:text-earth-700'
                }`}
              >
                Campo existente
              </button>
              <button
                onClick={() => switchMode('new')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  fieldMode === 'new' ? 'bg-white text-agri-green-800 shadow-md' : 'text-earth-500 hover:text-earth-700'
                }`}
              >
                <Plus size={14} strokeWidth={3} /> Nuevo campo
              </button>
            </div>

            <AnimatePresence mode="wait">
              {fieldMode === 'existing' ? (
                <motion.div key="existing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <div className="relative group">
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                    <select
                      value={selectedField}
                      onChange={(e) => { setSelectedField(e.target.value); handleClear(); }}
                      className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl px-5 py-4 text-sm font-bold appearance-none cursor-pointer focus:ring-0 focus:border-agri-green-500 focus:bg-white transition-all outline-none pr-10"
                    >
                      <option value="">— Selecciona un campo —</option>
                      {RECENT_FIELDS.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} — {f.crop} (ID: {f.id})</option>
                      ))}
                    </select>
                  </div>
                  {selectedFieldData && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-4 p-4 bg-agri-green-50 border border-agri-green-100 rounded-2xl"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ${
                        selectedFieldData.status === 'Saludable' ? 'bg-agri-green-100 text-agri-green-700' :
                        selectedFieldData.status === 'Atención'  ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>{selectedFieldData.health}%</div>
                      <div>
                        <p className="font-black text-agri-green-950 text-sm">{selectedFieldData.name}</p>
                        <p className="text-xs font-bold text-earth-400 uppercase tracking-widest mt-0.5">{selectedFieldData.crop} · {selectedFieldData.status}</p>
                      </div>
                      <span className={`ml-auto px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        selectedFieldData.status === 'Saludable' ? 'bg-agri-green-100 text-agri-green-700' :
                        selectedFieldData.status === 'Atención'  ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                      }`}>{selectedFieldData.status}</span>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="new" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
                  <input
                    type="text"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    placeholder="Ej. Sector Norte Lote 7, Parcela B-12, Invernadero 3..."
                    className="w-full bg-earth-200/20 border-2 border-earth-200 rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-earth-300 focus:ring-0 focus:border-agri-green-500 focus:bg-white transition-all outline-none"
                  />
                  {customField.trim().length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-3 bg-agri-green-50 border border-agri-green-100 rounded-xl"
                    >
                      <CheckCircle size={15} className="text-agri-green-500" />
                      <p className="text-xs font-black text-agri-green-800">
                        Se creará el análisis para: <span className="text-agri-green-600">"{customField.trim()}"</span>
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Input oculto */}
          <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME} onChange={handleFileChange} className="hidden" />

          {/* ─── PASO 2: Subir imagen ───────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${effectiveField ? 'bg-agri-green-800 text-white' : 'bg-earth-200 text-earth-400'}`}>2</div>
              <div>
                <h3 className={`font-black tracking-tight ${effectiveField ? 'text-agri-green-950' : 'text-earth-400'}`}>Subir Imagen del Dron</h3>
                <p className="text-xs font-bold text-earth-400 mt-0.5">{effectiveField ? 'Arrastra o selecciona la imagen a analizar' : 'Primero identifica el campo'}</p>
              </div>
            </div>

            <div
              onClick={handleZoneClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-white rounded-[2.5rem] p-16 border-2 border-dashed flex flex-col items-center justify-center text-center group transition-all relative overflow-hidden ${
                !effectiveField ? 'border-earth-100 opacity-50 cursor-not-allowed' :
                isDragging ? 'border-agri-green-500 bg-agri-green-50/50 scale-[1.01] cursor-pointer' :
                'border-earth-200 hover:border-agri-green-500 hover:bg-agri-green-50/30 cursor-pointer'
              }`}
            >
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-agri-green-600 mb-4" size={48} />
                  <p className="text-agri-green-900 font-black text-lg">Analizando imagen con IA...</p>
                  <p className="text-earth-400 font-medium text-sm mt-2">Procesando {effectiveField}...</p>
                </div>
              )}
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-all duration-500 ${
                isDragging ? 'bg-agri-green-500 text-white scale-110' :
                effectiveField ? 'bg-earth-100 text-agri-green-700 group-hover:scale-110 group-hover:bg-agri-green-500 group-hover:text-white' : 'bg-earth-100 text-earth-300'
              }`}><Upload size={36} /></div>
              <h3 className="text-2xl font-black text-agri-green-950 tracking-tight">
                {isDragging ? 'Suelta la imagen aquí' : 'Subir Imagen de Dron'}
              </h3>
              <p className="text-earth-500 mt-2 font-medium">
                {effectiveField ? 'Arrastra y suelta, o haz clic para seleccionar' : 'Identifica el campo para continuar'}
              </p>
              <div className="mt-8 flex gap-3">
                {ACCEPTED_FORMATS.map((f) => (
                  <span key={f} className="px-5 py-2 bg-white rounded-xl text-[10px] font-black text-earth-400 border border-earth-200 uppercase tracking-widest shadow-sm">.{f}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Visor */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-[2.5rem] overflow-hidden border border-earth-200 shadow-2xl shadow-earth-900/10"
          >
            <div className="aspect-video bg-earth-100/50 relative group">
              {uploadedImage ? (
                <>
                  <img src={uploadedImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-95" alt="Imagen analizada" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-agri-green-500/20 via-transparent to-red-500/10 mix-blend-overlay" />
                  <div className="absolute top-6 left-6 flex gap-3">
                    <button className="bg-white/90 backdrop-blur-xl px-5 py-2.5 rounded-xl text-[10px] font-black text-agri-green-950 shadow-xl uppercase tracking-widest border border-white/20">Original</button>
                    <button className="bg-agri-green-600 px-5 py-2.5 rounded-xl text-[10px] font-black text-white shadow-xl uppercase tracking-widest">Índice NDVI</button>
                  </div>
                  <button onClick={handleClear} className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-xl rounded-xl flex items-center justify-center text-earth-600 hover:text-red-600 shadow-xl transition-colors">
                    <X size={18} />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                  <div className="w-16 h-16 rounded-2xl bg-earth-100 flex items-center justify-center text-earth-300 mb-4"><ImageOff size={32} /></div>
                  <p className="text-earth-400 font-bold text-sm">Sube una imagen para ver el análisis aquí</p>
                </div>
              )}
            </div>
            <div className="p-8 flex justify-between items-center bg-white/30 flex-wrap gap-4">
              <div className="flex gap-8 items-center flex-wrap">
                {fileName && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-agri-green-500" />
                    <span className="text-sm font-black text-agri-green-800 tracking-tight truncate max-w-[180px]">{fileName}</span>
                  </div>
                )}
                {[['ID Campo', effectiveField || '—'], ['Resolución', '2.4 cm/px'], ['Fecha', 'Hoy']].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-earth-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="font-black text-agri-green-950 tracking-tight">{value}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleGeneratePDF} disabled={isGenerating || !uploadedImage}
                className="flex items-center gap-3 bg-agri-green-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                {isGenerating ? 'Generando...' : 'Generar Reporte PDF'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Resultados IA */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="col-span-12 lg:col-span-4">
          <div className="bg-white p-8 rounded-[2.5rem] border border-earth-200 shadow-xl shadow-earth-900/5 sticky top-24">
            <h2 className="text-2xl font-black text-agri-green-950 tracking-tight mb-8">Resultados IA</h2>
            {!uploadedImage ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-earth-100 flex items-center justify-center text-earth-300 mb-4"><Bug size={28} /></div>
                <p className="text-earth-400 font-bold text-sm leading-relaxed">{effectiveField ? 'Sube una imagen para ver los resultados' : 'Identifica el campo y sube una imagen'}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {effectiveField && (
                  <div className="p-4 bg-agri-green-50 border border-agri-green-100 rounded-2xl">
                    <p className="text-[10px] font-black text-agri-green-600 uppercase tracking-widest mb-1">Campo analizado</p>
                    <p className="font-black text-agri-green-950 text-sm">{selectedFieldData?.name || effectiveField}</p>
                    {selectedFieldData && <p className="text-xs font-bold text-earth-400">{selectedFieldData.crop}</p>}
                  </div>
                )}
                <div className="p-5 bg-white rounded-2xl flex justify-between items-center border border-earth-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-agri-green-100 text-agri-green-600 rounded-xl shadow-sm"><Bug size={24} /></div>
                    <span className="text-sm font-black text-earth-700 tracking-tight">Enfermedades</span>
                  </div>
                  <span className="text-3xl font-black text-agri-green-600 tracking-tighter">0</span>
                </div>
                <div className="p-5 bg-white rounded-2xl flex justify-between items-center border border-earth-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm"><Droplets size={24} /></div>
                    <span className="text-sm font-black text-earth-700 tracking-tight">Estrés Hídrico</span>
                  </div>
                  <span className="text-3xl font-black text-orange-600 tracking-tighter">12%</span>
                </div>
                <div className="p-7 bg-agri-green-950 text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-agri-green-500/10 rounded-full blur-2xl" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-agri-green-400 mb-3">Insight de IA</p>
                  <p className="text-sm font-medium italic leading-relaxed opacity-90">
                    "El vigor de la vegetación está un 4% por encima del promedio estacional. Se recomienda optimizar el riego en la Sección B."
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
