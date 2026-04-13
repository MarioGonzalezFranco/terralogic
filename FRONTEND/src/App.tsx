import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { TabId, Alert } from './types';
import { type AlertItem } from './services/alerts.service';

import AuthPage     from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FieldsPage   from './pages/FieldsPage';
import AnalysisPage from './pages/AnalysisPage';
import HistoryPage  from './pages/HistoryPage';
import AlertsPage   from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

// Tipo del resultado de Gemini — compartido entre AnalysisPage y DashboardPage
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // ── Estado compartido del último análisis ─────────────────
  const [lastAnalysisImage,  setLastAnalysisImage]  = useState<string | null>(null);
  const [lastAnalysisField,  setLastAnalysisField]  = useState<string | null>(null);
  const [lastAnalysisResult, setLastAnalysisResult] = useState<GeminiResult | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleNotify = (msg: string) => {
    console.log(`[TerraLogic]: ${msg}`);
  };

  const handleNavigate = (tab: TabId) => {
    console.log(`Navegando a: ${tab}`);
  };

  // Cuando AnalysisPage completa un análisis, actualiza el estado global
  const handleAnalysisComplete = (
    imageUrl: string,
    fieldId: string,
    result?: GeminiResult,
  ) => {
    setLastAnalysisImage(imageUrl);
    setLastAnalysisField(fieldId);
    if (result) setLastAnalysisResult(result);
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
                    lastAnalysisImage={lastAnalysisImage}
                    lastAnalysisField={lastAnalysisField}
                    lastAnalysisResult={lastAnalysisResult}
                    onNavigate={handleNavigate}
                  />
                } />

                <Route path="/fields" element={
                  <FieldsPage onNavigate={handleNavigate} />
                } />

                <Route path="/analysis" element={
                  <AnalysisPage
                    onNotify={handleNotify}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                } />

                <Route path="/history" element={
                  <HistoryPage lastAnalysisField={lastAnalysisField} />
                } />

                <Route path="/alerts" element={
                  <AlertsPage
                    alerts={alerts}
                    setAlerts={setAlerts}
                    onNavigate={handleNavigate}
                  />
                } />

                <Route path="/settings" element={
                  <SettingsPage onNotify={handleNotify} />
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