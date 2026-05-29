import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import PreceptorDashboard from './components/PreceptorDashboard';
import DocenteDashboard from './components/DocenteDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { LogOut, Shield, GraduationCap, Calendar, User, Clock } from 'lucide-react';

const Navigation = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-200/80 px-6 py-3.5 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Brand Logo - Integrando el Logo PNG Real de la Escuela */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            className="w-11 h-11 object-contain animate-float"
            alt="Logotipo Oficial HOST 28"
            onError={(e) => {
              // Fallback por si la imagen no se carga
              e.target.style.display = 'none';
            }}
          />
          <div>
            <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight block -mb-1">
              HOST 28
            </span>
            <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider">
              E.E.S N°28 - "Gustavo cerati"
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Links based on Role con Colores del Logotipo */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          {/* 1. Equipo de Conducción: Acceso total */}
          {user.rol === "Equipo de Conducción" && (
            <>
              <button
                onClick={() => onNavigate('/admin')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/admin'
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                  }`}
              >
                <Shield size={14} />
                Matrícula (Admin)
              </button>
              <button
                onClick={() => onNavigate('/asistencia-mensual')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/asistencia-mensual'
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                  }`}
              >
                <Calendar size={14} />
                Asistencia Mensual
              </button>
              <button
                onClick={() => onNavigate('/asistencia')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/asistencia'
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                  }`}
              >
                <GraduationCap size={14} />
                Panel Docente
              </button>
            </>
          )}

          {/* 2. Preceptor: Acceso a /matricula y /asistencia-mensual */}
          {user.rol === "Preceptor" && (
            <>
              <button
                onClick={() => onNavigate('/admin')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/admin'
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                  }`}
              >
                <Shield size={14} />
                Matrícula (Admin)
              </button>
              <button
                onClick={() => onNavigate('/asistencia-mensual')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/asistencia-mensual'
                  ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                  }`}
              >
                <Calendar size={14} />
                Asistencia Mensual
              </button>
            </>
          )}

          {/* 3. Docente: Acceso a /asistencia (que contiene sus 3 pestañas) */}
          {user.rol === "Docente" && (
            <button
              onClick={() => onNavigate('/asistencia')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${currentPath === '/asistencia'
                ? 'bg-primary-500/10 border-primary-500/30 text-primary-500'
                : 'bg-transparent border-transparent text-slate-600 hover:text-primary-500 hover:bg-slate-100'
                }`}
            >
              <GraduationCap size={14} />
              Mi Panel Docente
            </button>
          )}
        </div>

        {/* User Chip & Logout */}
        <div className="flex items-center gap-4 self-start md:self-center ml-auto md:ml-0">
          <div className="bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center">
              <User size={12} />
            </div>
            <div>
              <span className="text-[10px] block text-slate-800 font-bold -mb-0.5">{user.nombre} {user.apellido}</span>
              <span className="text-[8px] block text-slate-500 uppercase font-bold">{user.rol}</span>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              onNavigate('/login');
            }}
            className="flex items-center justify-center p-2 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-500/10 border border-slate-200 hover:border-red-500/20 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </nav>
  );
};

const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

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
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc] text-slate-900 font-sans">
      <div>
        {/* Navigation Bar */}
        <Navigation currentPath={currentPath} onNavigate={handleNavigate} />

        {/* View Switching protected by ProtectedRoute */}
        <main className="py-6">
          {currentPath === '/login' && <Login onNavigate={handleNavigate} />}

          {currentPath === '/admin' && (
            <ProtectedRoute
              allowedRoles={['Equipo de Conducción', 'Preceptor']}
              currentPath="/matricula"
              onNavigate={handleNavigate}
            >
              <AdminPanel />
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
              <DocenteDashboard />
            </ProtectedRoute>
          )}
        </main>
      </div>

      {/* Footer Premium en Modo Claro */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 text-center text-xs text-slate-500 font-sans shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-8 h-8 object-contain" alt="Logo Escuela" />
            <span className="font-semibold text-slate-700">HOST 28 • Escuela de Educación Secundaria N° 28 - "Gustavo Cerati"</span>
          </div>
          <p className="text-slate-400 font-mono text-[10px]">
            © {new Date().getFullYear()} Sistema de Gestión Escolar EF. Conexión SSL Segura.
          </p>
        </div>
      </footer>
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
