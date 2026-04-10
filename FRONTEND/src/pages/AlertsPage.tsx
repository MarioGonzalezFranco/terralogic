import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, CheckCircle2, ArrowRight, BellOff, X, type LucideIcon } from 'lucide-react';
import { Alert, AlertType, TabId } from '../types';
import { PageHeader, ConfirmDialog } from '../components/ui';

const ALERT_STYLES: Record<AlertType, { wrapper: string; icon: string; badge: string; IconComponent: LucideIcon }> = {
  critical: { wrapper: 'bg-red-50/50 border-red-100',               icon: 'bg-red-100 text-red-600',                   badge: 'bg-red-100 text-red-700',               IconComponent: AlertTriangle },
  warning:  { wrapper: 'bg-orange-50/50 border-orange-100',         icon: 'bg-orange-100 text-orange-600',             badge: 'bg-orange-100 text-orange-700',         IconComponent: Info          },
  info:     { wrapper: 'bg-agri-green-50/50 border-agri-green-100', icon: 'bg-agri-green-100 text-agri-green-600',     badge: 'bg-agri-green-100 text-agri-green-700', IconComponent: CheckCircle2  },
};
const ALERT_LABELS: Record<AlertType, string> = { critical: 'Crítico', warning: 'Advertencia', info: 'Informativo' };

interface AlertsPageProps {
  alerts:     Alert[];
  setAlerts:  React.Dispatch<React.SetStateAction<Alert[]>>;
  onNavigate: (tab: TabId) => void;
}

export default function AlertsPage({ alerts, setAlerts, onNavigate }: AlertsPageProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const requestDismiss = (alert: Alert) => {
    alert.type === 'critical' ? setConfirmId(alert.id) : dismiss(alert.id);
  };
  const dismiss    = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const dismissAll = () => setAlerts([]);
  const confirmAlert = alerts.find(a => a.id === confirmId);

  return (
    <>
      <div className="space-y-10">
        <div className="flex justify-between items-end">
          <PageHeader label="Monitoreo Crítico" title="Centro de Alertas" description="Notificaciones críticas y preventivas detectadas por la IA." />
          {alerts.length > 0 && (
            <div className="flex items-center gap-4 mb-2">
              <span className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100">
                {alerts.length} activa{alerts.length !== 1 ? 's' : ''}
              </span>
              <button onClick={dismissAll} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-earth-200 rounded-xl text-xs font-black text-earth-500 uppercase tracking-widest hover:border-red-200 hover:text-red-600 transition-all shadow-sm">
                <X size={14} /> Limpiar todo
              </button>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-agri-green-50 border border-agri-green-100 flex items-center justify-center text-agri-green-400 mb-6"><BellOff size={36} /></div>
                <h3 className="text-2xl font-black text-agri-green-950 tracking-tight mb-2">Sin alertas activas</h3>
                <p className="text-earth-400 font-medium text-sm max-w-sm leading-relaxed mb-6">Todos los sectores funcionan correctamente.</p>
                <button onClick={() => onNavigate('dashboard')} className="bg-agri-green-800 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-agri-green-900 transition-all">
                  Volver al Dashboard →
                </button>
              </motion.div>
            ) : (
              alerts.map((alert) => {
                const { wrapper, icon, badge, IconComponent } = ALERT_STYLES[alert.type];
                return (
                  <motion.div key={alert.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }} transition={{ duration: 0.3 }}
                    className={`p-8 rounded-[2.5rem] border-2 flex gap-8 shadow-xl shadow-earth-900/5 hover:scale-[1.005] transition-all ${wrapper}`}
                  >
                    <div className={`p-5 rounded-2xl h-fit shadow-lg ${icon}`}><IconComponent size={32} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-black text-earth-900 tracking-tight">{alert.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badge}`}>{ALERT_LABELS[alert.type]}</span>
                        </div>
                        <span className="text-[10px] font-black text-earth-400 uppercase tracking-[0.2em] whitespace-nowrap flex-shrink-0">{alert.time}</span>
                      </div>
                      <p className="text-xs font-black text-agri-green-800 uppercase tracking-widest mb-4">{alert.field}</p>
                      <p className="text-base text-earth-600 leading-relaxed font-medium mb-6">{alert.desc}</p>
                      <div className="flex items-center gap-6">
                        <button onClick={() => onNavigate('fields')} className="text-xs font-black text-agri-green-800 uppercase tracking-widest hover:text-agri-green-600 transition-colors flex items-center gap-2">
                          Ver en Campos <ArrowRight size={14} />
                        </button>
                        <button onClick={() => requestDismiss(alert)} className="text-xs font-black text-earth-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1.5">
                          <X size={12} /> Descartar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Descartar alerta crítica?"
        description={`"${confirmAlert?.title}" requiere atención inmediata. ¿Estás seguro de que deseas descartarla?`}
        confirmText="Sí, descartar" cancelText="Cancelar" danger
        onConfirm={() => { if (confirmId) dismiss(confirmId); setConfirmId(null); }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
