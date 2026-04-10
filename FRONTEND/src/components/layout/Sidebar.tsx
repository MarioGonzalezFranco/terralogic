import {
  LayoutDashboard, Sprout, Microscope,
  History, BellRing, Settings, Plus, HelpCircle, LogOut, type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE
import { TabId } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { ConfirmDialog } from '../ui';

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  fields: Sprout,
  analysis: Microscope,
  history: History,
  alerts: BellRing,
  settings: Settings,
};

interface SidebarProps {
  activeTab:    TabId;
  setActiveTab: (id: TabId) => void;
  alertCount:   number;
  onSignOut:    () => void;
  onNewReport:  () => void;
}

export default function Sidebar({ activeTab, setActiveTab, alertCount, onSignOut, onNewReport }: SidebarProps) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <aside className="h-screen w-64 bg-white flex flex-col py-8 z-50 shadow-2xl border-r border-earth-200 flex-shrink-0">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-agri-green-500 flex items-center justify-center text-white shadow-lg shadow-agri-green-500/20">
              <Sprout size={20} />
            </div>
            <h2 className="text-2xl font-black text-agri-green-950 tracking-tighter">TerraLogic</h2>
          </div>
          <p className="text-[9px] font-black text-agri-green-600 uppercase tracking-[0.2em] opacity-70">
            IA Agrícola de Precisión
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-4">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.id as keyof typeof ICON_MAP] || LayoutDashboard;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(`/${item.id}`); // <--- Esto cambia la URL
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-agri-green-800 text-white shadow-xl shadow-agri-green-900/20'
                    : 'text-earth-500 hover:text-agri-green-900 hover:bg-white'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-agri-green-400 rounded-r-full" />
                )}
                <Icon size={20} className={isActive ? 'text-agri-green-400' : 'text-earth-400 group-hover:text-agri-green-600 transition-colors'} />
                <span className="text-sm font-bold tracking-tight flex-1 text-left">{item.label}</span>
                
                {item.id === 'alerts' && alertCount > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center bg-red-500 text-white">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-5 mt-auto space-y-6">
          <button onClick={onNewReport} className="w-full bg-agri-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-agri-green-500/10 flex items-center justify-center gap-2 hover:bg-agri-green-600 transition-all active:scale-[0.98]">
            <Plus size={18} strokeWidth={3} /> Nuevo Análisis
          </button>
          <div className="pt-6 border-t border-earth-100 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-earth-400 hover:text-agri-green-900 transition-colors text-xs font-bold uppercase tracking-widest">
              <HelpCircle size={18} /> Ayuda
            </button>
            <button onClick={() => setShowSignOutConfirm(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-earth-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest">
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        open={showSignOutConfirm}
        title="¿Cerrar sesión?"
        description="Se cerrará tu sesión actual y regresarás a la pantalla de inicio de sesión."
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        danger
        onConfirm={() => { setShowSignOutConfirm(false); onSignOut(); }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </>
  );
}