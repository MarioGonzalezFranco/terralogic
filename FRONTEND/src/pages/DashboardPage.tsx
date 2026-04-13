import { ArrowUpRight, ArrowDownRight, Leaf, Droplets, Bug, Waves, Sprout, ImageOff, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabId } from '../types';
import { RECENT_FIELDS } from '../constants';
import { StatusBadge, PageHeader, SkeletonMetricCard, SkeletonFieldItem } from '../components/ui';

const ICON_MAP: Record<string, LucideIcon> = { Leaf, Droplets, Bug, Waves };

// ── Tipos del resultado de Gemini ─────────────────────────────
interface GeminiResult {
  field_name:        string;
  resultado:         'Saludable' | 'Alerta' | 'Estrés';
  enfermedades:      { count: number; detalle: string };
  estres_hidrico:    { porcentaje: number; nivel: string };
  plagas:            { count: number; detalle: string };
  ndvi:              number;
  cobertura_vegetal: number;
  insight:           string;
  confianza:         number;
}

interface DashboardPageProps {
  lastAnalysisImage:  string | null;
  lastAnalysisField:  string | null;
  lastAnalysisResult: GeminiResult | null;
  onNavigate:         (tab: TabId) => void;
}

export default function DashboardPage({
  lastAnalysisImage,
  lastAnalysisField,
  lastAnalysisResult,
  onNavigate,
}: DashboardPageProps) {
  const isLoading = false;

  // Metricas dinamicas desde Gemini o valores por defecto
  const metrics = lastAnalysisResult ? [
    {
      label: 'Salud del Campo',
      value: `${lastAnalysisResult.cobertura_vegetal}%`,
      change: lastAnalysisResult.resultado,
      trend: lastAnalysisResult.resultado === 'Saludable' ? 'up' : lastAnalysisResult.resultado === 'Estrés' ? 'down' : 'neutral',
      icon: 'Leaf',
      color: 'text-green-600',
    },
    {
      label: 'Estrés Hídrico',
      value: lastAnalysisResult.estres_hidrico.porcentaje > 0
        ? `${lastAnalysisResult.estres_hidrico.porcentaje}%`
        : 'Óptimo',
      change: lastAnalysisResult.estres_hidrico.nivel,
      trend: lastAnalysisResult.estres_hidrico.porcentaje > 50 ? 'down'
           : lastAnalysisResult.estres_hidrico.porcentaje > 25 ? 'neutral' : 'up',
      icon: 'Droplets',
      color: 'text-blue-600',
    },
    {
      label: 'Plagas Activas',
      value: String(lastAnalysisResult.plagas.count).padStart(2, '0'),
      change: lastAnalysisResult.plagas.count === 0 ? 'Sin plagas' : 'Detectadas',
      trend: lastAnalysisResult.plagas.count > 0 ? 'down' : 'up',
      icon: 'Bug',
      color: 'text-orange-600',
    },
    {
      label: 'Índice NDVI',
      value: lastAnalysisResult.ndvi.toFixed(2),
      change: lastAnalysisResult.ndvi >= 0.6 ? 'Óptimo'
            : lastAnalysisResult.ndvi >= 0.4 ? 'Moderado' : 'Bajo',
      trend: lastAnalysisResult.ndvi >= 0.6 ? 'up'
           : lastAnalysisResult.ndvi >= 0.4 ? 'neutral' : 'down',
      icon: 'Waves',
      color: 'text-emerald-600',
    },
  ] : [
    { label: 'Salud del Campo',   value: '—',  change: 'Sin datos',  trend: 'neutral', icon: 'Leaf',     color: 'text-green-600'   },
    { label: 'Estrés Hídrico',    value: '—',  change: 'Sin datos',  trend: 'neutral', icon: 'Droplets', color: 'text-blue-600'    },
    { label: 'Plagas Activas',    value: '—',  change: 'Sin datos',  trend: 'neutral', icon: 'Bug',      color: 'text-orange-600'  },
    { label: 'Índice NDVI',       value: '—',  change: 'Sin datos',  trend: 'neutral', icon: 'Waves',    color: 'text-emerald-600' },
  ] as const;

  // ── Color del badge de resultado ──────────────────────────────
  const resultBadge = {
    'Saludable': 'bg-green-50 text-green-700 border-green-100',
    'Alerta':    'bg-orange-50 text-orange-700 border-orange-100',
    'Estrés':    'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-10 p-4 md:p-6">

      <PageHeader
        label="Panel de Control"
        title="Vista General Ejecutiva"
        description="Inteligencia en tiempo real sobre tus cultivos. Monitoreo de precisión para optimizar rendimientos."
      />

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonMetricCard key={i} />)
          : metrics.map((metric, i) => {
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
                      metric.trend === 'up'      ? 'bg-green-100 text-green-700'  :
                      metric.trend === 'down'    ? 'bg-red-100 text-red-700'      :
                                                   'bg-blue-100 text-blue-700'
                    }`}>
                      {metric.trend === 'up'   && <ArrowUpRight size={12} />}
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

      {/* ── Último análisis + Campos ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Último análisis */}
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
                {lastAnalysisImage ? 'Imagen procesada con Gemini AI' : 'Sin análisis recientes'}
              </p>
            </div>
            {lastAnalysisResult && lastAnalysisField && (
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${resultBadge[lastAnalysisResult.resultado]}`}>
                {lastAnalysisField} — {lastAnalysisResult.resultado}
              </span>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden group bg-gray-50">
            {lastAnalysisImage ? (
              <>
                <img
                  src={lastAnalysisImage}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000"
                  alt="Último análisis"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 via-transparent to-orange-500/10 mix-blend-overlay" />

                {/* Panel de resultados reales */}
                {lastAnalysisResult && (
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-white/40 min-w-[180px]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Resultados Gemini</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                        <span className="text-xs font-bold text-gray-700">
                          NDVI: {lastAnalysisResult.ndvi.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                          lastAnalysisResult.estres_hidrico.porcentaje > 50 ? 'bg-red-500' :
                          lastAnalysisResult.estres_hidrico.porcentaje > 25 ? 'bg-orange-400' : 'bg-blue-400'}`} />
                        <span className="text-xs font-bold text-gray-700">
                          Estrés: {lastAnalysisResult.estres_hidrico.porcentaje}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-3 h-3 rounded-full shadow-sm ${lastAnalysisResult.enfermedades.count > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-xs font-bold text-gray-700">
                          Enfermedades: {lastAnalysisResult.enfermedades.count}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insight de Gemini */}
                {lastAnalysisResult && (
                  <div className="absolute bottom-16 left-6 right-6 bg-green-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-400 mb-1">Insight de Gemini</p>
                    <p className="text-xs text-white/80 font-medium leading-relaxed line-clamp-2">
                      "{lastAnalysisResult.insight}"
                    </p>
                  </div>
                )}

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

        {/* Campos recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col h-[550px]"
        >
          <div className="p-8 border-b border-gray-50 bg-white/50">
            <h2 className="text-2xl font-black text-green-950 tracking-tight">Campos Recientes</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Haz clic para ver detalle</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonFieldItem key={i} />)
              : RECENT_FIELDS.map((field, i) => (
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
                        field.status === 'Atención'  ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
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