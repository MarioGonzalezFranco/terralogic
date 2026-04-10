// ─────────────────────────────────────────────────────────────
// HistoryPage.tsx — Historial de análisis con eliminación y resultados IA.
// PARA EL BACKEND: colección 'analyses' de Firestore, deleteDoc para eliminar
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Filter, Download, ChevronRight, Search, X, ChevronDown, ChevronLeft, Trash2, Bug, Droplets, Leaf, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ANALYSIS_HISTORY } from '../constants';
import { AnalysisRecord, AnalysisResultFilter } from '../types';
import { StatusBadge, PageHeader, ConfirmDialog } from '../components/ui';

const RESULT_FILTERS: { label: string; value: AnalysisResultFilter }[] = [
  { label: 'Todos', value: 'Todos' }, { label: 'Saludable', value: 'Saludable' },
  { label: 'Alerta', value: 'Alerta' }, { label: 'Estrés', value: 'Estrés' },
];

const PAGE_SIZE = 5;

// Resultados IA mock por análisis — el backend los proveerá de Firestore
const AI_RESULTS: Record<string, { ndvi: number; humidity: number; diseases: number; insight: string }> = {
  'VALLE-N-042': { ndvi: 0.61, humidity: 58, diseases: 2, insight: 'Déficit hídrico moderado detectado en el cuadrante noreste. Se recomienda aumentar la frecuencia de riego en un 20% durante los próximos 7 días.' },
  'SUR-V-008':   { ndvi: 0.84, humidity: 75, diseases: 0, insight: 'Cultivo en condiciones óptimas. Índice de clorofila por encima del promedio estacional. Continuar con el plan de manejo actual.' },
  'ESTE-T-115':  { ndvi: 0.42, humidity: 38, diseases: 1, insight: 'Estrés térmico detectado. Temperatura del dosel supera umbrales críticos. Se sugiere activar riego por aspersión como sistema de enfriamiento.' },
};

interface HistoryPageProps {
  lastAnalysisField: string | null;
}

export default function HistoryPage({ lastAnalysisField }: HistoryPageProps) {
  const [records,        setRecords]        = useState<AnalysisRecord[]>(ANALYSIS_HISTORY);
  const [search,         setSearch]         = useState('');
  const [resultFilter,   setResultFilter]   = useState<AnalysisResultFilter>('Todos');
  const [showFilters,    setShowFilters]    = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [page,           setPage]           = useState(1);
  const [deleteTarget,   setDeleteTarget]   = useState<AnalysisRecord | null>(null);

  const filtered = records.filter((r) => {
    const matchSearch = r.fieldId.toLowerCase().includes(search.toLowerCase()) ||
                        r.crop.toLowerCase().includes(search.toLowerCase()) ||
                        r.type.toLowerCase().includes(search.toLowerCase());
    const matchResult = resultFilter === 'Todos' || r.result === resultFilter;
    return matchSearch && matchResult;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resetPage  = () => setPage(1);
  const hasFilters = search !== '' || resultFilter !== 'Todos';

  // PARA EL BACKEND: deleteDoc(doc(db, 'analyses', record.id))
  const handleDelete = (record: AnalysisRecord) => {
    setRecords(prev => prev.filter(r => r.id !== record.id));
    if (selectedRecord?.id === record.id) setSelectedRecord(null);
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const csv = [
      ['Fecha', 'Hora', 'ID Campo', 'Cultivo', 'Tipo', 'Resultado'].join(','),
      ...filtered.map(r => [r.date, r.time, r.fieldId, r.crop, r.type, r.result].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'historial-analisis.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-10">

        {/* Encabezado */}
        <div className="flex justify-between items-end">
          <PageHeader label="Registros Históricos" title="Historial de Análisis" description="Registro detallado de monitoreo aéreo por dron." />
          <div className="flex gap-3 mb-1">
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${showFilters ? 'bg-agri-green-50 border-agri-green-200 text-agri-green-700' : 'bg-white border-earth-200 text-earth-600'}`}>
              <Filter size={15} /> Filtros
              <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-5 py-3 bg-agri-green-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-agri-green-900 transition-all shadow-sm">
              <Download size={15} /> Exportar CSV
            </button>
          </div>
        </div>

        {/* Último análisis de la sesión destacado */}
        {lastAnalysisField && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-5 bg-agri-green-50 border border-agri-green-200 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-agri-green-500 flex items-center justify-center text-white flex-shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-agri-green-600 uppercase tracking-widest mb-0.5">Último análisis de esta sesión</p>
              <p className="font-black text-agri-green-950 text-sm">Campo: <span className="text-agri-green-700">{lastAnalysisField}</span></p>
            </div>
          </motion.div>
        )}

        {/* Filtros expandibles */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white rounded-[2rem] border border-earth-200 shadow-xl shadow-earth-900/5 p-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 group-focus-within:text-agri-green-600 transition-colors" />
                  <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                    placeholder="Buscar por campo, cultivo o tipo..."
                    className="w-full bg-white border border-earth-200 rounded-2xl pl-11 pr-10 py-3 text-sm font-medium focus:ring-4 focus:ring-agri-green-500/10 focus:border-agri-green-500 transition-all outline-none" />
                  {search && <button onClick={() => { setSearch(''); resetPage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-300 hover:text-earth-500"><X size={15} /></button>}
                </div>
                <div className="flex gap-2 p-1.5 bg-earth-200/40 rounded-2xl">
                  {RESULT_FILTERS.map(({ label, value }) => (
                    <button key={value} onClick={() => { setResultFilter(value); resetPage(); }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${resultFilter === value ? 'bg-white text-agri-green-800 shadow-md' : 'text-earth-500 hover:text-earth-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabla + panel de detalle */}
        <div className="grid grid-cols-12 gap-6">

          {/* Tabla */}
          <div className={`${selectedRecord ? 'col-span-12 lg:col-span-7' : 'col-span-12'} bg-white rounded-[2.5rem] border border-earth-200 shadow-xl shadow-earth-900/5 overflow-hidden transition-all duration-500`}>

            {/* Contador — solo cuando hay filtros activos o múltiples páginas */}
            {(hasFilters || totalPages > 1) && (
              <div className="px-8 py-4 border-b border-earth-100 flex items-center justify-between bg-white/50">
                <p className="text-[10px] font-black text-earth-400 uppercase tracking-[0.2em]">
                  {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                  {totalPages > 1 && ` · Pág. ${page}/${totalPages}`}
                </p>
                {hasFilters && (
                  <button onClick={() => { setSearch(''); setResultFilter('Todos'); resetPage(); }}
                    className="text-[10px] font-black text-earth-400 uppercase tracking-widest hover:text-agri-green-600 transition-colors flex items-center gap-1">
                    <X size={11} /> Limpiar filtros
                  </button>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/50 border-b border-earth-100">
                  <tr>
                    {['Fecha', 'ID Campo', 'Cultivo', 'Resultado', ''].map((col) => (
                      <th key={col} className="px-6 py-5 text-[10px] font-black text-earth-400 uppercase tracking-[0.2em]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-50">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center">
                        <p className="text-earth-400 font-bold text-sm">
                          {records.length === 0 ? 'No hay análisis registrados aún.' : 'Sin registros que coincidan con los filtros.'}
                        </p>
                        {hasFilters && (
                          <button onClick={() => { setSearch(''); setResultFilter('Todos'); resetPage(); }}
                            className="mt-3 text-xs font-black text-agri-green-600 uppercase tracking-widest hover:underline">
                            Limpiar filtros
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginated.map((record) => (
                      <motion.tr key={record.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={`transition-all group cursor-pointer ${selectedRecord?.id === record.id ? 'bg-agri-green-50/50' : 'hover:bg-earth-200/20'}`}>
                        <td className="px-6 py-4" onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}>
                          <p className="text-sm font-black text-earth-900 tracking-tight">{record.date}</p>
                          <p className="text-[10px] font-bold text-earth-400 uppercase tracking-widest">{record.time}</p>
                        </td>
                        <td className="px-6 py-4 font-black text-sm text-agri-green-800 tracking-tight" onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}>{record.fieldId}</td>
                        <td className="px-6 py-4 text-sm font-bold text-earth-600" onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}>{record.crop}</td>
                        <td className="px-6 py-4" onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}>
                          <StatusBadge status={record.result} size="md" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Papelera siempre visible (no opacity-0) — accesible en mobile */}
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(record); }}
                              className="w-9 h-9 rounded-xl bg-white text-earth-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center border border-earth-100 hover:border-red-200 transition-all">
                              <Trash2 size={14} />
                            </button>
                            <button onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                              className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-sm ${selectedRecord?.id === record.id ? 'bg-agri-green-600 text-white' : 'bg-white text-earth-400 group-hover:bg-agri-green-600 group-hover:text-white border border-earth-100'}`}>
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación — solo cuando hay más de 1 página */}
            {totalPages > 1 && (
              <div className="px-8 py-5 border-t border-earth-100 flex items-center justify-between bg-white/50">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black text-earth-600 uppercase tracking-widest hover:text-agri-green-700 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={15} /> Anterior
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === p ? 'bg-agri-green-800 text-white shadow-md' : 'bg-white border border-earth-200 text-earth-500'}`}>
                      {p}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black text-earth-600 uppercase tracking-widest hover:text-agri-green-700 disabled:opacity-30 transition-colors">
                  Siguiente <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Panel de detalle con resultados IA */}
          <AnimatePresence>
            {selectedRecord && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}
                className="col-span-12 lg:col-span-5 bg-white rounded-[2.5rem] border border-agri-green-200 shadow-xl shadow-earth-900/5 overflow-hidden self-start">
                <div className="p-6 bg-agri-green-900 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-agri-green-500/10 rounded-full" />
                  <div className="relative flex justify-between items-start">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-agri-green-400 mb-1">Análisis seleccionado</p>
                      <h3 className="font-black text-white text-lg tracking-tight">{selectedRecord.fieldId}</h3>
                      <p className="text-white/50 text-xs font-bold mt-0.5">{selectedRecord.date} · {selectedRecord.time}</p>
                    </div>
                    <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Cultivo',    value: selectedRecord.crop       },
                      { label: 'Tipo',       value: selectedRecord.type       },
                      { label: 'Resolución', value: selectedRecord.resolution },
                      { label: 'Resultado',  value: selectedRecord.result     },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-earth-200/20 rounded-2xl p-3.5">
                        <p className="text-[9px] font-black text-earth-400 uppercase tracking-widest mb-1">{label}</p>
                        <p className="font-black text-agri-green-950 text-sm">{value}</p>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const ai = AI_RESULTS[selectedRecord.id];
                    if (!ai) return (
                      <div className="p-4 bg-earth-200/20 rounded-2xl text-center">
                        <p className="text-earth-400 text-xs font-bold">Resultados de IA no disponibles para este registro.</p>
                      </div>
                    );
                    return (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-earth-400 uppercase tracking-widest">Resultados de la IA</p>
                        <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-agri-green-100 text-agri-green-600 rounded-xl"><Leaf size={15} /></div>
                            <span className="text-sm font-black text-earth-700">Índice NDVI</span>
                          </div>
                          <span className="font-black text-agri-green-700">{ai.ndvi}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Droplets size={15} /></div>
                            <span className="text-sm font-black text-earth-700">Humedad del suelo</span>
                          </div>
                          <span className="font-black text-orange-600">{ai.humidity}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${ai.diseases > 0 ? 'bg-red-100 text-red-600' : 'bg-agri-green-100 text-agri-green-600'}`}><Bug size={15} /></div>
                            <span className="text-sm font-black text-earth-700">Enfermedades</span>
                          </div>
                          <span className={`font-black ${ai.diseases > 0 ? 'text-red-600' : 'text-agri-green-600'}`}>{ai.diseases}</span>
                        </div>
                        <div className="p-5 bg-agri-green-950 text-white rounded-2xl relative overflow-hidden">
                          <div className="absolute -right-4 -top-4 w-20 h-20 bg-agri-green-500/10 rounded-full blur-xl" />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-agri-green-400 mb-2">Insight de IA</p>
                          <p className="text-xs font-medium leading-relaxed opacity-90">{ai.insight}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <button onClick={() => setDeleteTarget(selectedRecord)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 border border-red-100 hover:bg-red-50 transition-all">
                    <Trash2 size={14} /> Eliminar este análisis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="¿Eliminar análisis?"
        description={`Se eliminará permanentemente el análisis del campo "${deleteTarget?.fieldId}" del ${deleteTarget?.date}. Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar" cancelText="Cancelar" danger
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
