// ─────────────────────────────────────────────────────────────
// FieldsPage.tsx
// Lista de campos con panel de detalle al hacer clic en la flecha.
// PARA EL BACKEND: RECENT_FIELDS → colección 'fields' de Firestore
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  Sprout, Plus, Search, MapPin, Activity,
  ChevronRight, Filter, X, Leaf, Droplets, Bug,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RECENT_FIELDS } from '../constants';
import { Field, FieldStatus, FieldStatusFilter, TabId } from '../types';
import { StatusBadge, PageHeader } from '../components/ui';

const STATUS_FILTERS: { label: string; value: FieldStatusFilter }[] = [
  { label: 'Todos', value: 'Todos' }, { label: 'Saludable', value: 'Saludable' },
  { label: 'Atención', value: 'Atención' }, { label: 'Crítico', value: 'Crítico' },
];

// Datos de detalle mock por campo — el backend los reemplaza con datos reales
const FIELD_DETAIL: Record<string, {
  area: string; lastAnalysis: string; humidity: number; temperature: string;
  ndvi: number; diseases: number; recommendation: string;
}> = {
  'A-01':  { area: '12.4 ha', lastAnalysis: '24 Oct, 2023', humidity: 78, temperature: '22°C', ndvi: 0.82, diseases: 0, recommendation: 'Cultivo en óptimas condiciones. Continuar con el plan de riego actual.' },
  'G-12':  { area: '8.7 ha',  lastAnalysis: '22 Oct, 2023', humidity: 62, temperature: '24°C', ndvi: 0.64, diseases: 1, recommendation: 'Presencia temprana de roya detectada. Aplicar fungicida preventivo en zona noreste.' },
  'F-04':  { area: '15.2 ha', lastAnalysis: '19 Oct, 2023', humidity: 41, temperature: '26°C', ndvi: 0.38, diseases: 3, recommendation: 'URGENTE: Falla en sistema de irrigación. Riesgo de pérdida de cultivo si no se atiende en 24h.' },
  'CN-01': { area: '9.8 ha',  lastAnalysis: 'Hoy',          humidity: 81, temperature: '21°C', ndvi: 0.88, diseases: 0, recommendation: 'Campo optimizado por IA. Rendimiento esperado 18% por encima del promedio.' },
};

interface FieldsPageProps {
  onNavigate: (tab: TabId) => void;
}

export default function FieldsPage({ onNavigate }: FieldsPageProps) {
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState<FieldStatusFilter>('Todos');
  const [selectedField,  setSelectedField]  = useState<Field | null>(null);

  const filteredFields = RECENT_FIELDS.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                        f.crop.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     RECENT_FIELDS.length,
    healthy:   RECENT_FIELDS.filter(f => f.status === 'Saludable').length,
    attention: RECENT_FIELDS.filter(f => f.status === 'Atención').length,
    critical:  RECENT_FIELDS.filter(f => f.status === 'Crítico').length,
  };

  const handleRowClick = (field: Field) => {
    setSelectedField(prev => prev?.id === field.id ? null : field);
  };

  return (
    <div className="space-y-10">

      <div className="flex justify-between items-end">
        <PageHeader label="Gestión Agrícola" title="Mis Campos" description="Monitorea y gestiona todos tus sectores agrícolas en un solo lugar." />
        <button onClick={() => onNavigate('analysis')}
          className="flex items-center gap-2 bg-agri-green-800 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-agri-green-900/20 hover:bg-agri-green-900 transition-all active:scale-[0.98] mb-1">
          <Plus size={16} strokeWidth={3} /> Nuevo Análisis
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total de Campos', value: stats.total,     color: 'text-agri-green-700', bg: 'bg-agri-green-50 border-agri-green-100' },
          { label: 'Saludables',      value: stats.healthy,   color: 'text-agri-green-700', bg: 'bg-agri-green-50 border-agri-green-100' },
          { label: 'En Atención',     value: stats.attention, color: 'text-orange-700',     bg: 'bg-orange-50 border-orange-100'          },
          { label: 'Críticos',        value: stats.critical,  color: 'text-red-700',        bg: 'bg-red-50 border-red-100'                },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-[1.75rem] border border-earth-200 shadow-xl shadow-earth-900/5 p-6"
          >
            <p className="text-[10px] font-black text-earth-400 uppercase tracking-[0.15em] mb-2">{stat.label}</p>
            <p className="text-4xl font-black text-agri-green-950 tracking-tighter">{stat.value}</p>
            <div className={`mt-3 inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${stat.bg} ${stat.color}`}>
              {stat.value} sector{stat.value !== 1 ? 'es' : ''}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-400 group-focus-within:text-agri-green-600 transition-colors" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o tipo de cultivo..."
            className="w-full bg-white border border-earth-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-agri-green-500/10 focus:border-agri-green-500 transition-all outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-earth-200/40 rounded-2xl">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button key={value} onClick={() => { setStatusFilter(value); setSearch(''); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${statusFilter === value ? 'bg-white text-agri-green-800 shadow-md' : 'text-earth-500 hover:text-earth-700'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Tabla + panel de detalle */}
      <div className="grid grid-cols-12 gap-6">

        {/* Tabla */}
        <div className={`${selectedField ? 'col-span-12 lg:col-span-7' : 'col-span-12'} bg-white rounded-[2.5rem] border border-earth-200 shadow-xl shadow-earth-900/5 overflow-hidden transition-all duration-500`}>
          {filteredFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-earth-100 flex items-center justify-center text-earth-300 mb-4"><Filter size={28} /></div>
              <h3 className="text-xl font-black text-earth-400 tracking-tight mb-2">Sin resultados</h3>
              <p className="text-earth-300 font-medium text-sm">No hay campos que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/50 border-b border-earth-100">
                  <tr>
                    {['Campo', 'Cultivo', 'Salud', 'Estado', ''].map((col) => (
                      <th key={col} className="px-6 py-5 text-[10px] font-black text-earth-400 uppercase tracking-[0.2em]">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-50">
                  {filteredFields.map((field, i) => (
                    <motion.tr key={field.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      onClick={() => handleRowClick(field)}
                      className={`transition-all group cursor-pointer ${selectedField?.id === field.id ? 'bg-agri-green-50/60' : 'hover:bg-agri-green-50/30'}`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            field.status === 'Saludable' ? 'bg-agri-green-50 text-agri-green-600' :
                            field.status === 'Atención'  ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                          }`}><Sprout size={18} /></div>
                          <div>
                            <p className="font-black text-sm text-agri-green-950 tracking-tight">{field.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin size={10} className="text-earth-300" />
                              <p className="text-[10px] font-bold text-earth-400 uppercase tracking-widest">ID: {field.id}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-earth-600">{field.crop}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-earth-100 rounded-full overflow-hidden max-w-[80px]">
                            <div className={`h-full rounded-full ${field.health >= 80 ? 'bg-agri-green-500' : field.health >= 50 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${field.health}%` }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity size={11} className="text-earth-400" />
                            <span className="text-xs font-black text-earth-600">{field.health}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><StatusBadge status={field.status as FieldStatus} size="md" /></td>
                      <td className="px-6 py-5 text-right">
                        <button className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-sm ${
                          selectedField?.id === field.id ? 'bg-agri-green-600 text-white' : 'bg-white text-earth-400 group-hover:bg-agri-green-600 group-hover:text-white border border-earth-100'
                        }`}><ChevronRight size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        <AnimatePresence>
          {selectedField && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="col-span-12 lg:col-span-5 bg-white rounded-[2.5rem] border border-agri-green-200 shadow-xl shadow-earth-900/5 overflow-hidden"
            >
              {/* Encabezado del detalle */}
              <div className={`p-6 relative overflow-hidden ${
                selectedField.status === 'Saludable' ? 'bg-agri-green-800' :
                selectedField.status === 'Atención'  ? 'bg-orange-700'     : 'bg-red-800'
              }`}>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Campo seleccionado</p>
                    <h3 className="font-black text-white text-xl tracking-tight">{selectedField.name}</h3>
                    <p className="text-white/60 text-xs font-bold mt-1">{selectedField.crop} · ID: {selectedField.id}</p>
                  </div>
                  <button onClick={() => setSelectedField(null)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <X size={15} />
                  </button>
                </div>
                {/* Barra de salud */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Salud del cultivo</span>
                    <span className="text-sm font-black text-white">{selectedField.health}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedField.health}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-white/80 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Datos del campo */}
              {(() => {
                const detail = FIELD_DETAIL[selectedField.id];
                if (!detail) return null;
                return (
                  <div className="p-6 space-y-5">
                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Área',          value: detail.area                          },
                        { label: 'Último análisis', value: detail.lastAnalysis                },
                        { label: 'Temperatura',   value: detail.temperature                   },
                        { label: 'Humedad',       value: `${detail.humidity}%`                },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-earth-200/20 rounded-2xl p-3.5">
                          <p className="text-[9px] font-black text-earth-400 uppercase tracking-widest mb-1">{label}</p>
                          <p className="font-black text-agri-green-950 text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Resultados IA */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-earth-400 uppercase tracking-widest">Resultados de la IA</p>
                      <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-agri-green-100 text-agri-green-600 rounded-xl"><Leaf size={16} /></div>
                          <span className="text-sm font-black text-earth-700">Índice NDVI</span>
                        </div>
                        <span className="font-black text-agri-green-700">{detail.ndvi}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Droplets size={16} /></div>
                          <span className="text-sm font-black text-earth-700">Humedad del suelo</span>
                        </div>
                        <span className="font-black text-orange-600">{detail.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-earth-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${detail.diseases > 0 ? 'bg-red-100 text-red-600' : 'bg-agri-green-100 text-agri-green-600'}`}><Bug size={16} /></div>
                          <span className="text-sm font-black text-earth-700">Enfermedades</span>
                        </div>
                        <span className={`font-black ${detail.diseases > 0 ? 'text-red-600' : 'text-agri-green-600'}`}>{detail.diseases}</span>
                      </div>
                    </div>

                    {/* Recomendación */}
                    <div className="p-5 bg-agri-green-950 text-white rounded-2xl relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-agri-green-500/10 rounded-full blur-xl" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-agri-green-400 mb-2">Recomendación IA</p>
                      <p className="text-xs font-medium leading-relaxed opacity-90">{detail.recommendation}</p>
                    </div>

                    {/* Acción */}
                    <button onClick={() => onNavigate('analysis')}
                      className="w-full bg-agri-green-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-agri-green-900 transition-all"
                    >
                      Analizar este campo →
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
