
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { CameraProvider } from './contexts/CameraContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ModulePage from './pages/ModulePage';
import ConfigurationPage from './pages/ConfigurationPage';

const AppLayout = () => {
  const { user } = useAuth();
  const hasConfigAccess = user?.role === 'admin';

  return (
    <div className="flex flex-col h-screen text-gray-800 dark:text-gray-200 transition-colors duration-300 font-sans">
      <Header />
      <main className="flex-1 overflow-auto bg-gray-100 dark:bg-[#0b1120]">
        <Routes>
          <Route path="/" element={<Navigate to="/module/liveview" replace />} />
          <Route path="/module/:moduleId" element={<ModulePage />} />
          {hasConfigAccess && <Route path="/module/server-config" element={<ConfigurationPage />} />}
        </Routes>
      </main>
    </div>
  );
}

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <CameraProvider>
              <AppLayout />
            </CameraProvider>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};


function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <HashRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </HashRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;