import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles, children, currentPath, onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

  // Redirigir a login si no está autenticado. Cumple con las reglas de Hooks.
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('/login');
    }
  }, [isAuthenticated, onNavigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Si no se especifican roles, todos los autenticados acceden
  if (!allowedRoles || allowedRoles.includes(user.rol)) {
    return <>{children}</>;
  }

  // Si el rol no está permitido, mostrar pantalla de acceso denegado premium
  return (
    <div className="flex items-center justify-center min-h-[70svh] px-4">
      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-red-500/20 text-center relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6 animate-pulse">
          <ShieldAlert size={32} />
        </div>

        <h2 className="text-2xl font-bold text-slate-100 mb-2 font-display">Acceso Denegado</h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Tu rol actual (<strong className="text-slate-200">{user.rol}</strong>) no tiene los permisos necesarios para acceder a <span className="text-red-400 font-mono text-xs bg-red-500/10 px-1.5 py-0.5 rounded">{currentPath}</span>.
        </p>

        <div className="space-y-4">
          <div className="text-xs text-left bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-400">
            <span className="font-semibold block text-slate-300 mb-1">Permisos por Rol:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Equipo de Conducción:</strong> Acceso Total.</li>
              <li><strong>Preceptor:</strong> Matrícula y Asistencia Mensual.</li>
              <li><strong>Docente:</strong> Asistencia diaria, Libro de Temas e Informes.</li>
            </ul>
          </div>

          <button
            onClick={() => {
              if (user.rol === "Equipo de Conducción") onNavigate('/admin');
              else if (user.rol === "Preceptor") onNavigate('/asistencia-mensual');
              else if (user.rol === "Docente") onNavigate('/asistencia');
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2.5 px-4 rounded-xl transition-all duration-300 border border-slate-700"
          >
            <ArrowLeft size={16} />
            Volver a mi Panel Autorizado
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
