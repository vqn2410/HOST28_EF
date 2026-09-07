import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import DocenteAsistencia from './DocenteAsistencia';
import DocenteLibroTemas from './DocenteLibroTemas';
import DocenteInformes from './DocenteInformes';
import DocentePlanilla from './DocentePlanilla';
import { CalendarCheck, BookOpen, AlertCircle, Award, Calendar, LayoutDashboard, Bell, UserX, CheckCircle2, MailOpen } from 'lucide-react';

const DocenteDashboard = ({ activeTab: propActiveTab, setActiveTab: propSetActiveTab }) => {
  const { user } = useAuth();
  const { notificaciones, marcarNotificacionLeida } = useSchoolData();
  
  const [localActiveTab, setLocalActiveTab] = useState(() => {
    return user.rol === "Equipo de Conducción" ? 'dashboard' : 'dashboard';
  });

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  const esDirectivo = user.rol === "Equipo de Conducción";

  const cursosAsignados = useMemo(() => {
    return (user.cursosAsignados || user.perfil?.cursosAsignados || []);
  }, [user]);

  // Notificaciones dirigidas a los cursos de este docente (bajas de estudiantes, etc.)
  const notificacionesDocente = useMemo(() => {
    return notificaciones
      .filter(n => cursosAsignados.includes(n.curso))
      .sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
  }, [notificaciones, cursosAsignados]);

  const notificacionesNoLeidas = useMemo(() => {
    return notificacionesDocente.filter(n => !(n.leidaPor || []).includes(user.dni));
  }, [notificacionesDocente, user.dni]);

  const notificacionesBajas = useMemo(() => {
    return notificacionesDocente.filter(n => n.tipo === 'estudiante_baja');
  }, [notificacionesDocente]);

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
          <div className="space-y-6">
            {/* Panel de Novedades / Notificaciones para el Docente */}
            {notificacionesDocente.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-accent-500/5 to-transparent">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-600 flex items-center justify-center">
                        <Bell size={16} />
                      </div>
                      {notificacionesNoLeidas.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                          {notificacionesNoLeidas.length}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 font-display">Novedades de tus Cursos</h3>
                      <p className="text-[10px] text-slate-500 font-semibold">
                        {notificacionesNoLeidas.length > 0
                          ? `${notificacionesNoLeidas.length} sin leer • bajas, asistencias y avisos`
                          : 'Todas las novedades fueron leídas'}
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto custom-scrollbar">
                  {notificacionesDocente.map((n) => {
                    const leida = (n.leidaPor || []).includes(user.dni);
                    const esBaja = n.tipo === 'estudiante_baja';
                    return (
                      <li key={n.id} className={`px-5 py-3 flex items-start gap-3 transition-colors ${leida ? 'bg-white opacity-70' : 'bg-accent-500/[0.03]'}`}>
                        <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${esBaja ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                          {esBaja ? <UserX size={14} /> : <MailOpen size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 leading-relaxed">{n.mensaje}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase flex items-center gap-1.5">
                            <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{n.curso}</span>
                            <span>{new Date(n.fechaCreacion || n.fecha).toLocaleDateString('es-AR')}</span>
                            {esBaja && <span className="inline-block bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Baja</span>}
                          </p>
                        </div>
                        {!leida && (
                          <button
                            onClick={() => marcarNotificacionLeida(n.id, user.dni)}
                            className="shrink-0 inline-flex items-center gap-1 bg-white hover:bg-accent-50 text-accent-600 border border-accent-200 hover:border-accent-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            <CheckCircle2 size={11} />
                            Marcar leída
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {notificacionesBajas.length > 0 && (
                  <div className="px-5 py-3 bg-gradient-to-r from-red-500/5 to-transparent border-t border-slate-100">
                    <span className="text-[10px] text-red-600 font-bold uppercase flex items-center gap-1.5">
                      <UserX size={12} />
                      En {notificacionesBajas.length} baja{notificacionesBajas.length > 1 ? 's' : ''} de matrícula detectada{notificacionesBajas.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

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
          </div>
        )}
        {activeTab === 'asistencia' && <DocenteAsistencia />}
        {activeTab === 'libro-de-temas' && <DocenteLibroTemas />}
        {activeTab === 'planilla-mensual' && <DocentePlanilla />}
        {activeTab === 'mis-informes' && <DocenteInformes />}
      </div>
    </div>
  );
};

export default DocenteDashboard;
