import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DocenteAsistencia from './DocenteAsistencia';
import DocenteLibroTemas from './DocenteLibroTemas';
import DocenteInformes from './DocenteInformes';
import { CalendarCheck, BookOpen, AlertCircle, Award } from 'lucide-react';

const DocenteDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('asistencia'); // 'asistencia' | 'libro-de-temas' | 'mis-informes'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Cabecera / Banner del Docente */}
      <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Glowing visual decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-accent-500/5 rounded-full blur-2xl -ml-8 -mb-8"></div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary-500/10 border border-primary-500/20 text-primary-600 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider mb-3">
            <Award size={14} className="animate-pulse" />
            <span>Perfil Docente Verificado</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            ¡Hola, Prof. {user.nombre} {user.apellido}!
          </h1>
          <p className="text-slate-600 text-xs mt-1 max-w-xl leading-relaxed">
            Bienvenido al portal de carga escolar del HOST 28. Aquí podrás confeccionar partes de Educación Física, registrar el avance de tus contenidos pedagógicos y firmar reportes de clase.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl flex gap-6 text-xs text-slate-500 self-start md:self-center shrink-0 shadow-sm">
          <div>
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Correo</span>
            <span className="font-mono text-slate-800">{user.correo}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Cargo</span>
            <span className="font-bold text-slate-800">Prof. de Educación Física</span>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas / Tab Menu */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('asistencia')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'asistencia'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck size={16} />
          Asistencia
        </button>

        <button
          onClick={() => setActiveTab('libro-de-temas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'libro-de-temas'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <BookOpen size={16} />
          Libro de Temas
        </button>

        <button
          onClick={() => setActiveTab('mis-informes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'mis-informes'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <AlertCircle size={16} />
          Mis Informes
        </button>
      </div>

      {/* Renderizado Dinámico */}
      <div className="pt-2 animate-fade-in">
        {activeTab === 'asistencia' && <DocenteAsistencia />}
        {activeTab === 'libro-de-temas' && <DocenteLibroTemas />}
        {activeTab === 'mis-informes' && <DocenteInformes />}
      </div>
    </div>
  );
};

export default DocenteDashboard;
