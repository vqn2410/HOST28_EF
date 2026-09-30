import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import {
  LayoutDashboard, UserPlus, Users, GraduationCap, BookOpen,
  CalendarCheck, Calendar, FileSignature, Upload, TrendingUp,
  Shield, Award, ArrowRight, AlertCircle, Bell
} from 'lucide-react';

const colorMap = {
  primary: { icon: 'bg-primary-50 text-primary-600', border: 'hover:border-primary-500/50', text: 'group-hover:text-primary-600' },
  accent: { icon: 'bg-accent-50 text-accent-600', border: 'hover:border-accent-500/50', text: 'group-hover:text-accent-600' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', border: 'hover:border-emerald-500/50', text: 'group-hover:text-emerald-600' },
  amber: { icon: 'bg-amber-50 text-amber-600', border: 'hover:border-amber-500/50', text: 'group-hover:text-amber-600' },
  sky: { icon: 'bg-sky-50 text-sky-600', border: 'hover:border-sky-500/50', text: 'group-hover:text-sky-600' },
  violet: { icon: 'bg-violet-50 text-violet-600', border: 'hover:border-violet-500/50', text: 'group-hover:text-violet-600' },
  rose: { icon: 'bg-rose-50 text-rose-600', border: 'hover:border-rose-500/50', text: 'group-hover:text-rose-600' },
  gold: { icon: 'bg-amber-50 text-amber-700', border: 'hover:border-amber-500/50', text: 'group-hover:text-amber-700' }
};

const Dashboard = ({ onNavigate, onDocenteNav }) => {
  const { user, usuarios = [] } = useAuth();
  const { alumnos = [], cursosConfig = {}, solicitudesFaltantes = [], partes = [] } = useSchoolData();

  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      curso => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  const notificacionesPendientes = useMemo(() => {
    return solicitudesFaltantes.filter(sol => !sol.completada);
  }, [solicitudesFaltantes]);

  const SOCIOS = {
    "Equipo de Conducción": [
      { label: "Dashboard General", desc: "Panel administrativo de la institución.", icon: LayoutDashboard, path: '/admin', color: 'primary' },
      { label: "Carga de Usuarios", desc: "Registrar docentes, preceptores y directivos.", icon: UserPlus, path: '/admin/usuarios_carga', color: 'accent' },
      { label: "Personal Registrado", desc: "Listado completo del personal.", icon: Users, path: '/admin/usuarios_lista', color: 'sky' },
      { label: "Matricular Estudiantes", desc: "Alta de estudiantes de todas las divisiones.", icon: GraduationCap, path: '/admin/estudiantes_carga', color: 'amber' },
      { label: "Estudiantes Matriculados", desc: "Consulta y edición de la matrícula.", icon: BookOpen, path: '/admin/estudiantes_lista', color: 'rose' },
      { label: "Asignación Curricular EF", desc: "Configurar días, horarios y docentes de EF.", icon: CalendarCheck, path: '/admin/cursos_carga', color: 'violet' },
      { label: "Listado de Cursos", desc: "Configuración actual de los cursos.", icon: BookOpen, path: '/admin/cursos_lista', color: 'emerald' },
      { label: "Feriados y Patrias", desc: "Administrar feriados y receso de invierno.", icon: Calendar, path: '/admin/feriados_carga', color: 'gold' },
      { label: "Crear Parte Manual", desc: "Confeccionar un parte de asistencia manual.", icon: FileSignature, path: '/admin/partes_crear', color: 'primary' },
      { label: "Carga Masiva (CSV)", desc: "Importar partes diarios desde CSV.", icon: Upload, path: '/admin/partes_carga_masiva', color: 'accent' },
      { label: "Asistencia Mensual", desc: "Planillas e informes de asistencia de EF.", icon: Calendar, path: '/asistencia-mensual', color: 'emerald' },
      { label: "Reportes de Asistencia", desc: "Gráficas mensuales y comparativas por curso.", icon: TrendingUp, path: '/reportes', color: 'violet' },
      { label: "Libro de Temas (Visar)", desc: "Visar los partes firmados por los docentes.", icon: Shield, path: '/asistencia', color: 'rose' }
    ],
    "Preceptor": [
      { label: "Matricular Estudiante", desc: "Alta de un estudiante de forma individual.", icon: GraduationCap, path: '/admin/estudiantes_carga', color: 'amber' },
      { label: "Listado de Estudiantes", desc: "Consulta de la matrícula escolar.", icon: BookOpen, path: '/admin/estudiantes_lista', color: 'rose' },
      { label: "Asistencia Mensual", desc: "Planillas y solicitudes de partes faltantes.", icon: Calendar, path: '/asistencia-mensual', color: 'emerald' },
      { label: "Solicitud de Parte", desc: "Solicitar partes faltantes a los docentes y seguir su cumplimiento.", icon: Bell, path: '/solicitudes-parte', color: 'rose' },
      { label: "Reportes de Asistencia", desc: "Gráficas mensuales por curso.", icon: TrendingUp, path: '/reportes', color: 'violet' }
    ],
    "Docente": [
      { label: "Crear Parte Diario", desc: "Toma asistencia, temática y firma digital.", icon: CalendarCheck, path: null, tab: 'asistencia', color: 'primary' },
      { label: "Libro de Temas", desc: "Contenidos desarrollados en tus clases.", icon: BookOpen, path: null, tab: 'libro-de-temas', color: 'accent' },
      { label: "Asistencia Mensual", desc: "Planilla general del mes de tus alumnos.", icon: Calendar, path: null, tab: 'planilla-mensual', color: 'emerald' },
      { label: "Mis Informes", desc: "Reportes de seguimiento por alumno.", icon: AlertCircle, path: null, tab: 'mis-informes', color: 'amber' },
      { label: "Reportes de Asistencia", desc: "Gráficas de asistencia de tus cursos.", icon: TrendingUp, path: '/reportes', color: 'violet' }
    ]
  };

  const shortcuts = SOCIOS[user.rol] || [];

  const handleShortcutClick = (shortcut) => {
    if (shortcut.tab && onDocenteNav) {
      onDocenteNav(shortcut.tab);
    } else if (shortcut.path) {
      onNavigate(shortcut.path);
    }
  };

  const stats = (() => {
    if (user.rol === "Docente") {
      return [
        { label: "Cursos Asignados", value: cursosAsignados.length, icon: BookOpen, color: 'text-accent-600' },
        { label: "Partes Cargados", value: partes.filter(p => p.docenteNombre && cursosAsignados.includes(p.curso)).length, icon: FileSignature, color: 'text-primary-600' },
        { label: "Solicitudes Pendientes", value: notificacionesPendientes.filter(s => cursosAsignados.includes(s.curso)).length, icon: Bell, color: 'text-red-600' }
      ];
    }
    if (user.rol === "Preceptor") {
      return [
        { label: "Estudiantes", value: alumnos.length, icon: GraduationCap, color: 'text-amber-600' },
        { label: "Cursos Asignados", value: (user.cursosAsignados || []).length, icon: BookOpen, color: 'text-accent-600' },
        { label: "Solicitudes Pendientes", value: notificacionesPendientes.length, icon: Bell, color: 'text-red-600' }
      ];
    }
    return [
      { label: "Usuarios", value: usuarios.length, icon: Users, color: 'text-sky-600' },
      { label: "Estudiantes", value: alumnos.length, icon: GraduationCap, color: 'text-amber-600' },
      { label: "Cursos Configurados", value: Object.keys(cursosConfig).length, icon: BookOpen, color: 'text-accent-600' },
      { label: "Solicitudes Pendientes", value: notificacionesPendientes.length, icon: Bell, color: 'text-red-600' }
    ];
  })();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fade-in">
      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-accent-500/5 rounded-full blur-2xl -ml-8 -mb-8"></div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-primary-500/10 border border-primary-500/20 text-primary-600 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider mb-3">
            <Award size={14} className="animate-pulse" />
            <span>Panel de Inicio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            ¡Hola, {user.nombre} {user.apellido}!
          </h1>
          <p className="text-slate-600 text-xs mt-1 max-w-xl leading-relaxed">
            {user.rol === "Docente"
              ? "Bienvenido a tu panel docente. Confecciona partes diarios, registra tus temáticas y consulta la asistencia de tus cursos."
              : user.rol === "Preceptor"
                ? "Bienvenido a tu panel de gestión. Administra la matrícula, la asistencia mensual y las solicitudes de partes faltantes."
                : "Bienvenido al panel de conducción. Gestiona usuarios, estudiantes, cursos y supervisa la asistencia de Educación Física."}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-200 p-4 rounded-2xl flex gap-6 text-xs text-slate-500 self-start md:self-center shrink-0 shadow-sm">
          <div>
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Rol</span>
            <span className="font-bold text-slate-800">{user.rol}</span>
          </div>
          <div className="border-l border-slate-200 pl-6">
            <span className="block text-[9px] uppercase tracking-wide text-slate-400 font-bold mb-0.5">Correo</span>
            <span className="font-mono text-slate-800">{user.correo}</span>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-slate-50 border border-slate-200 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <span className="block text-lg font-extrabold text-slate-900">{s.value}</span>
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Accesos directos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-extrabold text-slate-800 font-display uppercase tracking-wider">
            Accesos Directos
          </h2>
          <span className="text-[10px] bg-white border border-slate-200 text-slate-600 font-bold px-3 py-1 rounded-xl shadow-sm">
            {shortcuts.length} secciones
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shortcuts.map(sc => {
            const c = colorMap[sc.color] || colorMap.primary;
            return (
              <button
                key={sc.label}
                type="button"
                onClick={() => handleShortcutClick(sc)}
                className="glass-panel group text-left p-5 rounded-3xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all cursor-pointer relative overflow-hidden bg-white hover:bg-slate-50"
              >
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -mr-6 -mt-6 bg-slate-100 group-hover:bg-primary-500/10 transition-colors`}></div>
                <div className="flex items-start gap-3 relative">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${c.icon}`}>
                    <sc.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-display font-bold text-sm text-slate-900 transition-colors ${c.text}`}>{sc.label}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed line-clamp-2">{sc.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-[10px] font-extrabold uppercase tracking-wide text-slate-400 group-hover:text-primary-500 transition-colors relative">
                  <span>Ir a la sección</span>
                  <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;