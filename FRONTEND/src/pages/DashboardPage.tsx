import { ArrowUpRight, ArrowDownRight, Leaf, Droplets, Bug, Waves, Sprout, ImageOff, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion'; // Asegúrate de usar framer-motion o motion/react según tu setup
import { TabId } from '../types';
import { DASHBOARD_METRICS, RECENT_FIELDS } from '../constants';
import { StatusBadge, PageHeader, SkeletonMetricCard, SkeletonFieldItem } from '../components/ui';

const ICON_MAP: Record<string, LucideIcon> = { Leaf, Droplets, Bug, Waves };

interface DashboardPageProps {
  lastAnalysisImage: string | null;
  lastAnalysisField: string | null;
  onNavigate: (tab: TabId) => void;
}

export default function DashboardPage({ lastAnalysisImage, lastAnalysisField, onNavigate }: DashboardPageProps) {
  const isLoading = false;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-10 p-4 md:p-6">
      {/* Encabezado de Página */}
      <PageHeader 
        label="Panel de Control" 
        title="Vista General Ejecutiva" 
        description="Inteligencia en tiempo real sobre tus cultivos. Monitoreo de precisión para optimizar rendimientos." 
      />

      {/* SECCIÓN 1: KPIs (4 Columnas en Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />) :
          DASHBOARD_METRICS.map((metric, i) => {
            const Icon = ICON_MAP[metric.icon];
            return (
              <motion.div 
                key={metric.label} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.08 }}
                className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-900/5 hover:shadow-2xl hover:shadow-gray-900/10 transition-all group cursor-default"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-white ${metric.color} group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon size={26} />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    metric.trend === 'up' ? 'bg-green-100 text-green-700' : 
                    metric.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {metric.trend === 'up' && <ArrowUpRight size={12} />}
                    {metric.trend === 'down' && <ArrowDownRight size={12} />}
                    {metric.change}
                  </div>
                </div>
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">{metric.label}</h3>
                <p className="text-4xl font-black text-green-950 tracking-tighter">{metric.value}</p>
              </motion.div>
            );
          })
        }
      </div>

      {/* SECCIÓN 2: Análisis y Campos (Distribución 2:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Último Análisis (Ocupa 2/3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col min-h-[550px]"
        >
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white/50">
            <div>
              <h2 className="text-2xl font-black text-green-950 tracking-tight">Último Análisis Realizado</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                {lastAnalysisImage ? 'Imagen procesada con inteligencia artificial' : 'Sin análisis recientes'}
              </p>
            </div>
            {lastAnalysisImage && lastAnalysisField && (
              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-100">
                {lastAnalysisField}
              </span>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden group bg-gray-50">
            {lastAnalysisImage ? (
              <>
                <img src={lastAnalysisImage} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" alt="Último análisis" />
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 via-transparent to-orange-500/10 mix-blend-overlay" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/40">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Resultados</p>
                  <div className="space-y-2">
                    {[
                      { color: 'bg-green-500', label: 'Dosel Saludable' }, 
                      { color: 'bg-yellow-400', label: 'Crecimiento Normal' }, 
                      { color: 'bg-orange-500', label: 'Déficit de Humedad' }
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
                        <span className="text-xs font-bold text-gray-700">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => onNavigate('analysis')} 
                  className="absolute bottom-6 right-6 bg-green-800 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-green-900 transition-all"
                >
                  Ver Análisis Completo →
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
                  <ImageOff size={40} />
                </div>
                <h3 className="text-xl font-black text-gray-400 tracking-tight mb-2">Aún no hay imágenes analizadas</h3>
                <p className="text-gray-400 font-medium text-sm max-w-sm leading-relaxed mb-6">
                  Sube tu primera imagen en la sección de Análisis y aquí verás los resultados.
                </p>
                <button 
                  onClick={() => onNavigate('analysis')} 
                  className="bg-green-800 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-green-900 transition-all"
                >
                  Ir a Análisis →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Columna Derecha: Campos Recientes (Ocupa 1/3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col h-[550px]"
        >
          <div className="p-8 border-b border-gray-50 bg-white/50">
            <h2 className="text-2xl font-black text-green-950 tracking-tight">Campos Recientes</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Estado en vivo · Haz clic para ver detalle</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonFieldItem key={i} />) :
              RECENT_FIELDS.map((field, i) => (
                <motion.div 
                  key={field.id} 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.4 + i * 0.07 }}
                  onClick={() => onNavigate('fields')}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                      field.status === 'Saludable' ? 'bg-green-50 text-green-600' : 
                      field.status === 'Atención' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <Sprout size={20} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-green-950 tracking-tight">{field.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{field.crop}</p>
                    </div>
                  </div>
                  <StatusBadge status={field.status} />
                </motion.div>
              ))
            }
          </div>
          <div className="p-6 border-t border-gray-50 bg-white/30 text-center">
            <button 
              onClick={() => onNavigate('fields')} 
              className="text-xs font-black text-green-800 uppercase tracking-widest hover:text-green-600 transition-colors"
            >
              Ver Todos los Sectores →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}