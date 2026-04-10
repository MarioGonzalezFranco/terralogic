import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Tipos - Asegúrate de que 'Alert' esté exportado en tu archivo de tipos
import { TabId, Alert } from './types'; 

// Páginas
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage from './pages/FieldsPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage from './pages/HistoryPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // CORRECCIÓN 1: Tipar el estado como Alert[] en lugar de dejar que infiera never[]
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // CORRECCIÓN 2: Ajustar onNotify para que coincida con la firma (msg: string) => void
  // Si tus componentes solo esperan un argumento, debemos dárselo así:
  const handleNotifySimple = (msg: string) => {
    console.log(`[TerraLogic Notify]: ${msg}`);
  };

  const handleNavigate = (tab: TabId) => {
    console.log(`Navegando a: ${tab}`);
  };

  if (isAuthenticated === null) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/dashboard" replace />} 
        />

        {isAuthenticated ? (
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/dashboard" element={
                  <DashboardPage 
                    lastAnalysisImage={null} 
                    lastAnalysisField={null} 
                    onNavigate={handleNavigate} 
                  />
                } />

                <Route path="/fields" element={
                  <FieldsPage onNavigate={handleNavigate} />
                } />

                {/* CORRECCIÓN 3: Usar la firma simple de onNotify */}
                <Route path="/analysis" element={
                  <AnalysisPage 
                    onNotify={handleNotifySimple} 
                    onAnalysisComplete={(res) => console.log("Análisis terminado", res)} 
                  />
                } />

                <Route path="/history" element={
                  <HistoryPage lastAnalysisField={null} />
                } />

                {/* CORRECCIÓN 4: setAlerts ahora es compatible gracias al tipado de Alert[] */}
                <Route path="/alerts" element={
                  <AlertsPage 
                    alerts={alerts} 
                    setAlerts={setAlerts} 
                    onNavigate={handleNavigate} 
                  />
                } />

                {/* CORRECCIÓN 5: Usar la firma simple de onNotify */}
                <Route path="/settings" element={
                  <SettingsPage onNotify={handleNotifySimple} />
                } />

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          } />
        ) : (
          <Route path="*" element={<Navigate to="/auth" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}