import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Leaf, Droplets, Bug, Waves, Sprout, ImageOff, Activity, TrendingUp, AlertTriangle, CheckCircle2, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabId } from '../types';
import { StatusBadge, PageHeader } from '../components/ui';
import { listFields, type FieldItem } from '../services/fields.service';

const ICON_MAP: Record<string, LucideIcon> = { Leaf, Droplets, Bug, Waves };

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
  const [fields,       setFields]       = useState<FieldItem[]>([]);
  const [fieldStats,   setFieldStats]   = useState({ total: 0, healthy: 0, attention: 0, critical: 0 });
  const [loadingFields, setLoadingFields] = useState(true);

  useEffect(() => {
    listFields()
      .then(data => { setFields(data.items); setFieldStats(data.stats); })
      .catch(() => {})
      .finally(() => setLoadingFields(false));
  }, []);

  // ── KPIs dinámicos ────────────────────────────────────────
  const metrics = lastAnalysisResult ? [
    {
      label: 'Salud del Campo',
      value: `${lastAnalysisResult.cobertura_vegetal}%`,
      change: lastAnalysisResult.resultado,
      trend: lastAnalysisResult.resultado === 'Saludable' ? 'up' : lastAnalysisResult.resultado === 'Estrés' ? 'down' : 'neutral',
      icon: 'Leaf',
      gradient: 'from-agri-green-500/10 to-agri-green-600/5',
      iconBg: 'bg-agri-green-100 text-agri-green-700',
    },
    {
      label: 'Estrés Hídrico',
      value: `${lastAnalysisResult.estres_hidrico.porcentaje}%`,
      change: lastAnalysisResult.estres_hidrico.nivel,
      trend: lastAnalysisResult.estres_hidrico.porcentaje > 50 ? 'down' : lastAnalysisResult.estres_hidrico.porcentaje > 25 ? 'neutral' : 'up',
      icon: 'Droplets',
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Plagas Activas',
      value: String(lastAnalysisResult.plagas.count).padStart(2, '0'),
      change: lastAnalysisResult.plagas.count === 0 ? 'Sin plagas' : 'Detectadas',
      trend: lastAnalysisResult.plagas.count > 0 ? 'down' : 'up',
      icon: 'Bug',
      gradient: 'from-orange-500/10 to-orange-600/5',
      iconBg: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Índice NDVI',
      value: lastAnalysisResult.ndvi.toFixed(2),
      change: lastAnalysisResult.ndvi >= 0.6 ? 'Óptimo' : lastAnalysisResult.ndvi >= 0.4 ? 'Moderado' : 'Bajo',
      trend: lastAnalysisResult.ndvi >= 0.6 ? 'up' : lastAnalysisResult.ndvi >= 0.4 ? 'neutral' : 'down',
      icon: 'Waves',
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
  ] : [
    { label: 'Salud del Campo',   value: '—', change: 'Sin datos', trend: 'neutral', icon: 'Leaf',     gradient: 'from-agri-green-500/10 to-agri-green-600/5', iconBg: 'bg-agri-green-100 text-agri-green-700' },
    { label: 'Estrés Hídrico',    value: '—', change: 'Sin datos', trend: 'neutral', icon: 'Droplets', gradient: 'from-blue-500/10 to-blue-600/5',             iconBg: 'bg-blue-100 text-blue-700'             },
    { label: 'Plagas Activas',    value: '—', change: 'Sin datos', trend: 'neutral', icon: 'Bug',      gradient: 'from-orange-500/10 to-orange-600/5',         iconBg: 'bg-orange-100 text-orange-700'         },
    { label: 'Índice NDVI',       value: '—', change: 'Sin datos', trend: 'neutral', icon: 'Waves',    gradient: 'from-emerald-500/10 to-emerald-600/5',       iconBg: 'bg-emerald-100 text-emerald-700'       },
  ] as const;

  const resultColor = {
    'Saludable': 'bg-agri-green-500',
    'Alerta':    'bg-orange-400',
    'Estrés':    'bg-red-500',
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8 p-4 md:p-6">

      <PageHeader
        label="Panel de Control"
        title="Vista General Ejecutiva"
        description="Inteligencia en tiempo real sobre tus cultivos. Monitoreo de precisión para optimizar rendimientos."
      />

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, i) => {
          const Icon = ICON_MAP[metric.icon];
          return (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative bg-white p-6 rounded-[2rem] border border-earth-100 shadow-xl shadow-earth-900/5 hover:shadow-2xl transition-all overflow-hidden group cursor-default">
              {/* Fondo degradado sutil */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className="flex justify-between items-start mb-5">
                  <div className={`p-3.5 rounded-2xl ${metric.iconBg} group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    metric.trend === 'up'   ? 'bg-agri-green-100 text-agri-green-700' :
                    metric.trend === 'down' ? 'bg-red-100 text-red-700'               :
                                             'bg-blue-100 text-blue-700'
                  }`}>
                    {metric.trend === 'up'   && <ArrowUpRight   size={11} />}
                    {metric.trend === 'down' && <ArrowDownRight size={11} />}
                    {metric.change}
                  </div>
                </div>
                <p className="text-[10px] font-black text-earth-400 uppercase tracking-[0.15em] mb-1">{metric.label}</p>
                <p className="text-4xl font-black text-agri-green-950 tracking-tighter">{metric.value}</p>

                {/* Barra de progreso para métricas con porcentaje */}
                {lastAnalysisResult && metric.value.includes('%') && metric.label !== 'Plagas Activas' && (
                  <div className="mt-4 h-1.5 bg-earth-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: metric.value }}
                      transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.3 }}
                      className={`h-full rounded-full ${metric.trend === 'up' ? 'bg-agri-green-500' : metric.trend === 'down' ? 'bg-red-400' : 'bg-orange-400'}`}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Resumen de campos + Último análisis ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Último análisis — ocupa 2/3 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-earth-100 shadow-xl overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
          <div className="p-7 border-b border-earth-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-agri-green-950 tracking-tight">Último Análisis Realizado</h2>
              <p className="text-xs font-bold text-earth-400 uppercase tracking-widest mt-1">
                {lastAnalysisImage ? 'Procesado con Gemini AI' : 'Sin análisis recientes'}
              </p>
            </div>
            {lastAnalysisResult && lastAnalysisField && (
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${resultColor[lastAnalysisResult.resultado]}`} />
                <span className="text-xs font-black text-earth-600 uppercase tracking-widest">
                  {lastAnalysisField} — {lastAnalysisResult.resultado}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 relative overflow-hidden bg-earth-50">
            {lastAnalysisImage ? (
              <>
                <img src={lastAnalysisImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Análisis" />
                <div className="absolute inset-0 bg-gradient-to-t from-agri-green-950/80 via-transparent to-transparent" />

                {/* Panel métricas flotante */}
                {lastAnalysisResult && (
                  <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/60 space-y-2.5 min-w-[160px]">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-earth-400">Resultados Gemini</p>
                    {[
                      { label: `NDVI: ${lastAnalysisResult.ndvi.toFixed(2)}`,                  ok: lastAnalysisResult.ndvi >= 0.5 },
                      { label: `Estrés: ${lastAnalysisResult.estres_hidrico.porcentaje}%`,     ok: lastAnalysisResult.estres_hidrico.porcentaje < 40 },
                      { label: `Enfermedades: ${lastAnalysisResult.enfermedades.count}`,       ok: lastAnalysisResult.enfermedades.count === 0 },
                      { label: `Confianza: ${Math.round(lastAnalysisResult.confianza * 100)}%`, ok: true },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-2">
                        {ok
                          ? <CheckCircle2 size={12} className="text-agri-green-500 flex-shrink-0" />
                          : <AlertTriangle size={12} className="text-orange-500 flex-shrink-0" />
                        }
                        <span className="text-xs font-bold text-earth-700">{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insight */}
                {lastAnalysisResult && (
                  <div className="absolute bottom-14 left-5 right-5 bg-agri-green-950/90 backdrop-blur-xl p-4 rounded-2xl border border-agri-green-800/30">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-agri-green-400 mb-1.5">Insight de Gemini</p>
                    <p className="text-xs text-white/85 font-medium leading-relaxed line-clamp-2">"{lastAnalysisResult.insight}"</p>
                  </div>
                )}

                <button onClick={() => onNavigate('analysis')}
                  className="absolute bottom-5 right-5 bg-agri-green-700 hover:bg-agri-green-800 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                  Nuevo Análisis →
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-[2rem] bg-earth-100 flex items-center justify-center text-earth-300 mb-6">
                  <ImageOff size={36} />
                </motion.div>
                <h3 className="text-xl font-black text-earth-400 tracking-tight mb-2">Aún no hay imágenes analizadas</h3>
                <p className="text-earth-400 font-medium text-sm max-w-sm leading-relaxed mb-6">
                  Sube tu primera imagen en la sección de Análisis y aquí verás los resultados en tiempo real.
                </p>
                <button onClick={() => onNavigate('analysis')}
                  className="bg-agri-green-800 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-agri-green-900 transition-all">
                  Ir a Análisis →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Panel derecho — estado de campos */}
        <div className="flex flex-col gap-5">

          {/* Resumen numérico */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-agri-green-950 rounded-[2rem] p-6 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-agri-green-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-agri-green-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-agri-green-400">Estado general</p>
              </div>
              <p className="text-5xl font-black tracking-tighter mb-1">{fieldStats.total}</p>
              <p className="text-agri-green-400 text-sm font-bold mb-5">campos monitoreados</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Saludables', count: fieldStats.healthy,   color: 'bg-agri-green-500' },
                  { label: 'En atención', count: fieldStats.attention, color: 'bg-orange-400'      },
                  { label: 'Críticos',    count: fieldStats.critical,  color: 'bg-red-500'         },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: fieldStats.total > 0 ? `${(count / fieldStats.total) * 100}%` : '0%' }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                    <span className="text-xs font-black text-white/70 w-16 text-right">{label}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Lista de campos reales */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] border border-earth-100 shadow-xl flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-5 border-b border-earth-50 flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-agri-green-950 tracking-tight">Campos Recientes</h2>
                <p className="text-[10px] font-bold text-earth-400 uppercase tracking-widest mt-0.5">Último análisis por campo</p>
              </div>
              <TrendingUp size={16} className="text-earth-300" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingFields ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-earth-100/50 rounded-2xl animate-pulse" />
                ))
              ) : fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sprout size={28} className="text-earth-200 mb-2" />
                  <p className="text-xs font-bold text-earth-300">Sin campos aún</p>
                  <p className="text-[10px] text-earth-300 mt-1">Aparecen al analizar imágenes</p>
                </div>
              ) : (
                fields.slice(0, 5).map((field, i) => (
                  <motion.div key={field.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                    onClick={() => onNavigate('fields')}
                    className="flex items-center justify-between p-3.5 hover:bg-earth-50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-earth-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        field.status === 'Saludable' ? 'bg-agri-green-50 text-agri-green-600' :
                        field.status === 'Atención'  ? 'bg-orange-50 text-orange-600'         : 'bg-red-50 text-red-600'
                      }`}>
                        <Sprout size={16} />
                      </div>
                      <div>
                        <p className="font-black text-sm text-agri-green-950 tracking-tight leading-none">{field.name}</p>
                        <p className="text-[10px] font-bold text-earth-400 mt-0.5">NDVI {field.ndvi.toFixed(2)} · {field.last_analysis}</p>
                      </div>
                    </div>
                    <StatusBadge status={field.status} size="sm" />
                  </motion.div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-earth-50 text-center">
              <button onClick={() => onNavigate('fields')}
                className="text-xs font-black text-agri-green-700 uppercase tracking-widest hover:text-agri-green-500 transition-colors">
                Ver todos los campos →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}