import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Shield, GraduationCap, Calendar, User, Clock, 
  CalendarCheck, BookOpen, AlertCircle, LayoutDashboard, 
  Users, UserPlus, Menu, X, Upload
} from 'lucide-react';

const Sidebar = ({ currentPath, onNavigate, isMobileOpen, setIsMobileOpen, docenteTab, setDocenteTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleNav = (path) => {
    onNavigate(path);
    setIsMobileOpen(false);
  };

  const handleDocenteNav = (tab) => {
    onNavigate('/asistencia');
    if (setDocenteTab) setDocenteTab(tab);
    setIsMobileOpen(false);
  };

  const NavItem = ({ icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
        isActive
          ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-4">
        {title}
      </span>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:w-64 md:shrink-0`}>
        
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              className="w-8 h-8 object-contain"
              alt="Logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <span className="font-display font-black text-sm text-slate-900 tracking-tight block -mb-1">
                HOST 28
              </span>
              <span className="text-[8px] block text-slate-500 font-bold uppercase tracking-wider">
                Gestión Escolar
              </span>
            </div>
          </div>
          <button 
            className="md:hidden text-slate-500 p-1 rounded hover:bg-slate-100"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Content */}
        <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          
          {/* MENU PARA EQUIPO DE CONDUCCIÓN */}
          {user.rol === "Equipo de Conducción" && (
            <>
              <Section title="Inicio">
                <NavItem icon={LayoutDashboard} label="Dashboard General" isActive={currentPath === '/admin'} onClick={() => handleNav('/admin')} />
              </Section>
              
              <Section title="Usuarios y Personal">
                <NavItem icon={UserPlus} label="Carga de Usuarios" isActive={currentPath === '/admin/usuarios_carga'} onClick={() => handleNav('/admin/usuarios_carga')} />
                <NavItem icon={Users} label="Personal Registrado" isActive={currentPath === '/admin/usuarios_lista'} onClick={() => handleNav('/admin/usuarios_lista')} />
              </Section>

              <Section title="Estudiantes">
                <NavItem icon={GraduationCap} label="Matricular Estudiantes" isActive={currentPath === '/admin/estudiantes_carga'} onClick={() => handleNav('/admin/estudiantes_carga')} />
                <NavItem icon={BookOpen} label="Estudiantes Matriculados" isActive={currentPath === '/admin/estudiantes_lista'} onClick={() => handleNav('/admin/estudiantes_lista')} />
              </Section>

              <Section title="Cursos y Fechas">
                <NavItem icon={CalendarCheck} label="Asignación Curricular EF" isActive={currentPath === '/admin/cursos_carga'} onClick={() => handleNav('/admin/cursos_carga')} />
                <NavItem icon={CalendarCheck} label="Listado de Cursos" isActive={currentPath === '/admin/cursos_lista'} onClick={() => handleNav('/admin/cursos_lista')} />
                <NavItem icon={Calendar} label="Feriados y Patrias" isActive={currentPath === '/admin/feriados_carga'} onClick={() => handleNav('/admin/feriados_carga')} />
              </Section>

              <Section title="Gestión de Partes">
                <NavItem icon={UserPlus} label="Crear Parte Manual" isActive={currentPath === '/admin/partes_crear'} onClick={() => handleNav('/admin/partes_crear')} />
                <NavItem icon={Upload} label="Carga Masiva (CSV)" isActive={currentPath === '/admin/partes_carga_masiva'} onClick={() => handleNav('/admin/partes_carga_masiva')} />
              </Section>

              <Section title="Supervisión">
                <NavItem icon={Calendar} label="Asistencia Mensual" isActive={currentPath === '/asistencia-mensual'} onClick={() => handleNav('/asistencia-mensual')} />
                <NavItem icon={Shield} label="Libro de Temas (Visar)" isActive={currentPath === '/asistencia'} onClick={() => handleNav('/asistencia')} />
              </Section>
            </>
          )}

          {/* MENU PARA PRECEPTOR */}
          {user.rol === "Preceptor" && (
            <>
              <Section title="Estudiantes">
                <NavItem icon={GraduationCap} label="Matricular Estudiante" isActive={currentPath === '/admin/estudiantes_carga'} onClick={() => handleNav('/admin/estudiantes_carga')} />
                <NavItem icon={BookOpen} label="Listado de Estudiantes" isActive={currentPath === '/admin/estudiantes_lista'} onClick={() => handleNav('/admin/estudiantes_lista')} />
              </Section>
              <Section title="Asistencia">
                <NavItem icon={Calendar} label="Asistencia Mensual" isActive={currentPath === '/asistencia-mensual'} onClick={() => handleNav('/asistencia-mensual')} />
              </Section>
            </>
          )}

          {/* MENU PARA DOCENTE */}
          {user.rol === "Docente" && (
            <>
              <Section title="Mi Panel">
                <NavItem icon={LayoutDashboard} label="Inicio" isActive={currentPath === '/asistencia' && docenteTab === 'dashboard'} onClick={() => handleDocenteNav('dashboard')} />
                <NavItem icon={CalendarCheck} label="Crear Parte Diario" isActive={currentPath === '/asistencia' && docenteTab === 'asistencia'} onClick={() => handleDocenteNav('asistencia')} />
                <NavItem icon={BookOpen} label="Libro de Temas" isActive={currentPath === '/asistencia' && docenteTab === 'libro-de-temas'} onClick={() => handleDocenteNav('libro-de-temas')} />
                <NavItem icon={Calendar} label="Asistencia Mensual" isActive={currentPath === '/asistencia' && docenteTab === 'planilla-mensual'} onClick={() => handleDocenteNav('planilla-mensual')} />
                <NavItem icon={AlertCircle} label="Mis Informes" isActive={currentPath === '/asistencia' && docenteTab === 'mis-informes'} onClick={() => handleDocenteNav('mis-informes')} />
              </Section>
            </>
          )}

        </div>

        {/* Footer del Sidebar (User Info & Logout) */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] block text-slate-800 font-bold truncate">
                {user.nombre} {user.apellido}
              </span>
              <span className="text-[9px] block text-slate-500 uppercase font-black truncate">
                {user.rol}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 p-2 text-red-500 font-bold text-xs bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 rounded-xl transition-all"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
