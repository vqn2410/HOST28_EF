import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Shield, BookOpen, FileText, KeyRound, UserSquare } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { login, seedUsers } = useAuth();
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dni || !password) {
      setError("Por favor complete todos los campos.");
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const res = login(dni, password);
      setIsLoading(false);
      if (res.success) {
        onNavigate('/dashboard');
      } else {
        setError(res.message);
      }
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80svh] px-4 py-8 relative">
      {/* Decorative Brand Light Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-200/80 shadow-2xl relative">

        {/* Brand Header with Real Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            className="w-20 h-20 object-contain mx-auto mb-4 animate-float"
            alt="Logo Oficial"
          />
          <h1 className="text-3xl font-black tracking-tight text-primary-500 font-display">
            HOST 28
          </h1>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-bold">
            E.E.S N°28 - "Gustavo Cerati"
          </p>
          <span className="inline-block mt-2 px-3 py-1 bg-accent-500/10 text-accent-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-accent-500/20">
            Módulo: Educación Física
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              <UserSquare size={14} className="text-primary-500" />
              DNI del Usuario
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingrese su DNI"
              className="w-full bg-white/80 border border-slate-300 focus:border-primary-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all font-mono"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              <KeyRound size={14} className="text-primary-500" />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/80 border border-slate-300 focus:border-primary-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-primary-500/10 hover:shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn size={16} />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
