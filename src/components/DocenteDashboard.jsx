import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import DocenteAsistencia from './DocenteAsistencia';
import DocenteLibroTemas from './DocenteLibroTemas';
import DocenteInformes from './DocenteInformes';
import DocentePlanilla from './DocentePlanilla';
import { CalendarCheck, BookOpen, AlertCircle, Award, AlertOctagon, Bell, X, Calendar, LayoutDashboard } from 'lucide-react';

const DocenteDashboard = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
  const { user } = useAuth();
  const { solicitudesFaltantes = [], cursosConfig = {} } = useSchoolData();
  
  const [localActiveTab, setLocalActiveTab] = useState(() => {
    return user.rol === "Equipo de Conducción" ? 'dashboard' : 'dashboard';
  });

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

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
      <div className="hidden md:flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard size={16} />
          Inicio
        </button>

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
          onClick={() => setActiveTab('planilla-mensual')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'planilla-mensual'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} />
          Planilla Mensual
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
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
            <button onClick={() => setActiveTab('asistencia')} className="glass-panel text-left p-6 rounded-3xl border border-slate-200/60 hover:border-primary-500/50 shadow-lg hover:shadow-xl transition-all group flex flex-col gap-4 cursor-pointer relative overflow-hidden bg-white hover:bg-slate-50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary-500/10 transition-colors"></div>
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <CalendarCheck size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-primary-600 transition-colors">Crear Parte Diario</h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">Toma asistencia, registra la temática de la clase y declara firmas.</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('libro-de-temas')} className="glass-panel text-left p-6 rounded-3xl border border-slate-200/60 hover:border-accent-500/50 shadow-lg hover:shadow-xl transition-all group flex flex-col gap-4 cursor-pointer relative overflow-hidden bg-white hover:bg-slate-50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-accent-500/10 transition-colors"></div>
              <div className="w-12 h-12 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-accent-600 transition-colors">Libro de Temas</h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">Visita y edita las actas consolidadas y las temáticas desarrolladas en clases.</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('planilla-mensual')} className="glass-panel text-left p-6 rounded-3xl border border-slate-200/60 hover:border-emerald-500/50 shadow-lg hover:shadow-xl transition-all group flex flex-col gap-4 cursor-pointer relative overflow-hidden bg-white hover:bg-slate-50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors">Asistencia Mensual</h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">Verifica el panorama general de asistencia de todo el mes de tus alumnos.</p>
              </div>
            </button>
            <button onClick={() => setActiveTab('mis-informes')} className="glass-panel text-left p-6 rounded-3xl border border-slate-200/60 hover:border-amber-500/50 shadow-lg hover:shadow-xl transition-all group flex flex-col gap-4 cursor-pointer relative overflow-hidden bg-white hover:bg-slate-50">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">Reportes Individuales</h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">Genera reportes de seguimiento para alumnos específicos y notifica preceptoría.</p>
              </div>
            </button>
          </div>
        )}
        {activeTab === 'asistencia' && <DocenteAsistencia />}
        {activeTab === 'libro-de-temas' && <DocenteLibroTemas />}
        {activeTab === 'planilla-mensual' && <DocentePlanilla />}
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
            <div className="my-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-36 overflow-y-auto text-left text-xs font-semibold space-y-1.5 text-slate-700 shadow-inner">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Listado de partes solicitados:</span>
              {notificacionesFaltantes.map(sol => (
                <div key={sol.id} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-800 font-bold">Curso {sol.curso}</span>
                    <span className="font-mono text-primary-500">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                  </div>
                  {sol.comentario && (
                    <p className="text-[10px] text-slate-500 italic font-medium ml-2 bg-white/50 px-2 py-0.5 rounded border border-slate-150">
                      <strong>Nota preceptor:</strong> {sol.comentario}
                    </p>
                  )}
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
