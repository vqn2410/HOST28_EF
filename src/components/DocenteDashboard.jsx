import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import DocenteAsistencia from './DocenteAsistencia';
import DocenteLibroTemas from './DocenteLibroTemas';
import DocenteInformes from './DocenteInformes';
import { CalendarCheck, BookOpen, AlertCircle, Award, AlertOctagon, Bell, X } from 'lucide-react';

const DocenteDashboard = () => {
  const { user } = useAuth();
  const { solicitudesFaltantes = [], cursosConfig = {} } = useSchoolData();
  const [activeTab, setActiveTab] = useState(() => {
    return user.rol === "Equipo de Conducción" ? 'libro-de-temas' : 'asistencia';
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  const esDirectivo = user.rol === "Equipo de Conducción";

  // Computar cursos asignados dinámicamente
  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      (curso) => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  // Filtrar solicitudes de partes faltantes pendientes para este docente
  const notificacionesFaltantes = useMemo(() => {
    return solicitudesFaltantes.filter(
      sol => cursosAsignados.includes(sol.curso) && !sol.completada
    );
  }, [solicitudesFaltantes, cursosAsignados]);

  // Mostrar modal de advertencia al inicio si hay partes faltantes
  useEffect(() => {
    if (user.rol === "Docente" && notificacionesFaltantes.length > 0) {
      setShowPendingModal(true);
    }
  }, [notificacionesFaltantes.length, user.rol]);

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
            <span>{esDirectivo ? "Equipo de Conducción Verificado" : "Perfil Docente Verificado"}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            ¡Hola, {esDirectivo ? "" : "Prof. "}{user.nombre} {user.apellido}!
          </h1>
          <p className="text-slate-600 text-xs mt-1 max-w-xl leading-relaxed">
            {esDirectivo 
              ? "Bienvenido al portal de supervisión y gestión curricular de E.E.S N° 28. Aquí podrás visar los contenidos del Libro de Temas de los docentes de Educación Física y verificar actas oficiales."
              : "Bienvenido al portal de carga escolar del HOST 28. Aquí podrás confeccionar partes de Educación Física, registrar el avance de tus contenidos pedagógicos y firmar reportes de clase."}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl flex gap-6 text-xs text-slate-500 self-start md:self-center shrink-0 shadow-sm">
          <div>
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Correo</span>
            <span className="font-mono text-slate-800">{user.correo}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Cargo</span>
            <span className="font-bold text-slate-800">
              {esDirectivo ? "Equipo de Conducción (Directivo)" : "Prof. de Educación Física"}
            </span>
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

      {/* VENTANA EMERGENTE: AVISO DE REPORTES PENDIENTES */}
      {showPendingModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center">
            {/* Glowing background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>
            
            <button
              type="button"
              onClick={() => setShowPendingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <X size={14} />
            </button>

            {/* Warning Icon animated */}
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-550 mb-4 shadow-sm animate-pulse">
              <AlertOctagon className="text-red-500" size={26} />
            </div>

            <h3 className="text-lg font-bold text-red-800 font-display">
              ¡Tiene Reportes Pendientes!
            </h3>
            <p className="text-xs text-slate-550 text-slate-600 mt-2 leading-relaxed font-semibold">
              Se han detectado <strong className="text-red-600 font-extrabold">{notificacionesFaltantes.length}</strong> solicitudes de partes diarios requeridos por la preceptora o la dirección escolar.
            </p>

            {/* Listado de Solicitudes */}
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-32 overflow-y-auto text-left text-xs font-semibold space-y-1.5 text-slate-700 shadow-inner">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Listado de partes solicitados:</span>
              {notificacionesFaltantes.map(sol => (
                <div key={sol.id} className="flex justify-between border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                  <span className="text-slate-800 font-bold">Curso {sol.curso}</span>
                  <span className="font-mono text-primary-500">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                </div>
              ))}
            </div>

            {/* Botonera Premium */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowPendingModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPendingModal(false);
                  setActiveTab('asistencia');
                }}
                className="w-full bg-red-500 hover:bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer active:scale-95 uppercase tracking-wide"
              >
                Ver y Confeccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteDashboard;
