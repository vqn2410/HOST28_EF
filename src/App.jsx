import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PreceptorDashboard from './components/PreceptorDashboard';
import DocenteDashboard from './components/DocenteDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';

// Removing TopNavigation and BottomNavbar in favor of Sidebar

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();
  const [docenteTab, setDocenteTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Limpieza única de localStorage residual para iniciar la aplicación desde 0
  useEffect(() => {
    const isWiped = localStorage.getItem('host28_is_wiped_v2');
    if (!isWiped) {
      localStorage.clear();
      localStorage.setItem('host28_is_wiped_v2', 'true');
      window.location.reload();
    }
  }, []);

  // Custom synced Hash Router State
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return '/login';
    return hash;
  });

  // Escuchar y sincronizar con los cambios del hash del navegador
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setCurrentPath(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Función navegadora
  const handleNavigate = (path) => {
    window.location.hash = `#${path}`;
    setCurrentPath(path);
  };

  // Redirección por defecto
  useEffect(() => {
    if (!isAuthenticated) {
      handleNavigate('/login');
    } else if (currentPath === '/login') {
      if (user.rol === "Equipo de Conducción") handleNavigate('/admin');
      else if (user.rol === "Preceptor") handleNavigate('/asistencia-mensual');
      else if (user.rol === "Docente") handleNavigate('/asistencia');
    }
  }, [isAuthenticated, user, currentPath]);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      
      {isAuthenticated && user && currentPath !== '/login' && (
        <Sidebar 
          currentPath={currentPath}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          docenteTab={docenteTab}
          setDocenteTab={setDocenteTab}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        {isAuthenticated && user && currentPath !== '/login' && (
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="font-display font-black text-sm text-slate-900 tracking-tight">HOST 28</span>
            </div>
            <button 
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </header>
        )}

        {/* View Switching protected by ProtectedRoute */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          {currentPath === '/login' && <Login onNavigate={handleNavigate} />}

          {currentPath.startsWith('/admin') && (
            <ProtectedRoute
              allowedRoles={['Equipo de Conducción', 'Preceptor']}
              currentPath="/matricula"
              onNavigate={handleNavigate}
            >
              <AdminPanel
                activeTabOverride={currentPath.replace('/admin', '').replace('/', '') || null}
                onNavigate={handleNavigate}
              />
            </ProtectedRoute>
          )}

          {currentPath === '/asistencia-mensual' && (
            <ProtectedRoute
              allowedRoles={['Equipo de Conducción', 'Preceptor']}
              currentPath="/asistencia-mensual"
              onNavigate={handleNavigate}
            >
              <PreceptorDashboard />
            </ProtectedRoute>
          )}

          {currentPath === '/asistencia' && (
            <ProtectedRoute
              allowedRoles={['Equipo de Conducción', 'Docente']}
              currentPath="/asistencia"
              onNavigate={handleNavigate}
            >
              <DocenteDashboard activeTab={docenteTab} setActiveTab={setDocenteTab} />
            </ProtectedRoute>
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SchoolDataProvider>
        <AppContent />
      </SchoolDataProvider>
    </AuthProvider>
  );
}

export default App;
