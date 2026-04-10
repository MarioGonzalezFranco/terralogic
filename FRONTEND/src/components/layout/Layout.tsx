import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { TabId } from '../../types';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  // Sincroniza el Tab activo con la URL actual
  const getTabFromUrl = (): TabId => {
    const path = location.pathname.split('/')[1];
    return (path as TabId) || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<TabId>(getTabFromUrl());

  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.pathname]);

  const handleSignOut = () => {
    sessionStorage.clear();
    window.location.href = '/auth';
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        alertCount={5} 
        onSignOut={handleSignOut}
        onNewReport={() => console.log("Nuevo Reporte")}
      />

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 relative overflow-y-auto p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}