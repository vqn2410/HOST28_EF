import React, { useState, useMemo } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { Filter, BarChart3, AlertCircle, Clock, Bell, FileText, Check, Plus, Calendar, X, FileSignature } from 'lucide-react';

const PreceptorDashboard = () => {
  const { 
    alumnos, 
    partes, 
    cursosConfig, 
    informes, 
    solicitudesFaltantes, 
    agregarSolicitudParteFaltante,
    notificaciones = [],
    marcarNotificacionLeida
  } = useSchoolData();
  const { user } = useAuth();

  // Navegación de Pestañas
  const [activeTab, setActiveTab] = useState('planilla'); // 'planilla' | 'solicitudes' | 'informes'
  const [selectedParteDetail, setSelectedParteDetail] = useState(null);



  // Estados del Formulario (Solicitud Parte Faltante)
  const [solCurso, setSolCurso] = useState(() => {
    return user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
  });
  const [solFecha, setSolFecha] = useState('');
  const [solError, setSolError] = useState('');
  const [solSuccess, setSolSuccess] = useState('');

  // Divisiones oficiales de la escuela (1°1° a 6°2°)
  const CURSOS = useMemo(() => [
    '1°1°', '1°2°', '1°3°',
    '2°1°', '2°2°', '2°3°',
    '3°1°', '3°2°',
    '4°1°', '4°2°',
    '5°1°', '5°2°',
    '6°1°', '6°2°'
  ], []);

  // Cursos visibles según la asignación administrativa del Preceptor
  const cursosVisibles = useMemo(() => {
    if (user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0) {
      return user.cursosAsignados;
    }
    return CURSOS;
  }, [user, CURSOS]);

  const misNotificaciones = useMemo(() => {
    if (!user || !user.cursosAsignados) return [];
    return notificaciones.filter(n => 
      user.cursosAsignados.includes(n.curso) &&
      !(n.leidaPor || []).includes(user.dni)
    );
  }, [notificaciones, user]);

  // Estados de Filtro (Planilla)
  const [selectedMes, setSelectedMes] = useState("05"); // Mayo por defecto
  const [selectedCurso, setSelectedCurso] = useState(() => {
    return user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
  });
  const [selectedTurno, setSelectedTurno] = useState(() => {
    const defaultCurso = user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
    return defaultCurso.endsWith('1°') ? 'Mañana' : 'Tarde';
  });

  // Escuchar y corregir el curso seleccionado si no coincide con los visibles
  React.useEffect(() => {
    if (cursosVisibles.length > 0 && !cursosVisibles.includes(selectedCurso)) {
      setSelectedCurso(cursosVisibles[0]);
      setSelectedTurno(cursosVisibles[0].endsWith('1°') ? 'Mañana' : 'Tarde');
    }
  }, [cursosVisibles, selectedCurso]);

  const MESES = [
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" }
  ];

  // Regla de días de clase de EF: se leen dinámicamente de la configuración administrativa
  const claseDiasSemana = useMemo(() => {
    const config = cursosConfig[selectedCurso];
    return config ? config.dias : (selectedCurso.endsWith('1°') ? [1, 3] : [2, 4]);
  }, [cursosConfig, selectedCurso]);

  // Calcular todos los días del mes seleccionado en los que hay clase de EF (para el año 2026)
  const diasClaseMes = useMemo(() => {
    const year = 2026;
    const monthIndex = parseInt(selectedMes) - 1;
    const date = new Date(year, monthIndex, 1);
    const dias = [];

    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      if (claseDiasSemana.includes(dayOfWeek)) {
        const dayNum = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${selectedMes}-${dayNum}`;
        const label = dayOfWeek === 1 ? `Lun ${date.getDate()}` :
                      dayOfWeek === 2 ? `Mar ${date.getDate()}` :
                      dayOfWeek === 3 ? `Mié ${date.getDate()}` : `Jue ${date.getDate()}`;
        dias.push({ dateStr: formattedDate, label });
      }
      date.setDate(date.getDate() + 1);
    }
    return dias;
  }, [selectedMes, claseDiasSemana]);

  // 1. Filtrar Alumnos Oficiales / Regulares
  const alumnosRegulares = useMemo(() => {
    return alumnos.filter(al => al.cursoEF === selectedCurso);
  }, [alumnos, selectedCurso]);

  // 2. Filtrar Alumnos Matriculados en este curso pero que hacen EF en otro curso
  const alumnosReasignados = useMemo(() => {
    return alumnos.filter(al => 
      al.cursoOrigen === selectedCurso && 
      al.cursoEF !== selectedCurso
    );
  }, [alumnos, selectedCurso]);

  // Días de clase de EF para el curso de la solicitud
  const solCursoDiasSemana = useMemo(() => {
    const config = cursosConfig[solCurso];
    return config ? config.dias : (solCurso.endsWith('1°') ? [1, 3] : [2, 4]);
  }, [cursosConfig, solCurso]);

  // Calcular fechas de clase del mes para el curso seleccionado que NO tienen parte registrado ni solicitudes pendientes
  const fechasSinCompletar = useMemo(() => {
    const year = 2026;
    const monthIndex = parseInt(selectedMes) - 1;
    const date = new Date(year, monthIndex, 1);
    const faltantes = [];

    const hoyStr = new Date().toISOString().split('T')[0];

    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      if (solCursoDiasSemana.includes(dayOfWeek)) {
        const dayNum = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${selectedMes}-${dayNum}`;
        
        // Solo sugerir fechas pasadas o del día de hoy
        if (formattedDate <= hoyStr) {
          const tieneParte = partes.some(p => p.fecha === formattedDate && p.curso === solCurso);
          const tieneSolicitudPendiente = solicitudesFaltantes.some(
            s => s.curso === solCurso && s.fecha === formattedDate && !s.completada
          );

          if (!tieneParte && !tieneSolicitudPendiente) {
            faltantes.push(formattedDate);
          }
        }
      }
      date.setDate(date.getDate() + 1);
    }
    return faltantes;
  }, [selectedMes, solCurso, solCursoDiasSemana, partes, solicitudesFaltantes]);

  // Calcular estadísticas acumuladas por alumno en su respectivo curso de EF
  const calcularEstadisticasAlumnoReasignado = (alumno) => {
    const cursoEF = alumno.cursoEF;
    const config = cursosConfig[cursoEF];
    const diasSemana = config ? config.dias : (cursoEF.endsWith('1°') ? [1, 3] : [2, 4]);

    const year = 2026;
    const monthIndex = parseInt(selectedMes) - 1;
    const date = new Date(year, monthIndex, 1);
    const dias = [];

    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      if (diasSemana.includes(dayOfWeek)) {
        const dayNum = String(date.getDate()).padStart(2, '0');
        dias.push(`${year}-${selectedMes}-${dayNum}`);
      }
      date.setDate(date.getDate() + 1);
    }

    let totales = 0;
    let presentes = 0;
    let ausentes = 0;

    dias.forEach(dateStr => {
      const parte = partes.find(p => p.fecha === dateStr && p.curso === cursoEF);
      if (!parte || parte.huboClase === 'No') return;

      const state = parte.asistencia[alumno.dni];
      if (state === 'Presente') {
        totales++;
        presentes++;
      } else if (state === 'Ausente') {
        totales++;
        ausentes++;
      }
    });

    const porcentaje = totales > 0 ? Math.round((presentes / totales) * 100) : 100;
    return { presentes, ausentes, totalClasesGrabadas: totales, porcentaje };
  };

  // Obtener estado de asistencia histórico para un alumno
  const getAsistenciaEstado = (alumnoDni, fechaStr) => {
    const parte = partes.find(p => 
      p.fecha === fechaStr && 
      p.curso === selectedCurso
    );

    if (!parte) return '-';
    // Si no hubo clases, figura "-" pero con detalle en tema
    if (parte.huboClase === 'No') return '-';
    return parte.asistencia[alumnoDni] || '-';
  };

  // Calcular estadísticas acumuladas por alumno
  const calcularEstadisticasAlumno = (alumnoDni) => {
    let totales = 0;
    let presentes = 0;
    let ausentes = 0;

    diasClaseMes.forEach(d => {
      // Validar si hubo clase ese día para no distorsionar estadísticas si fue suspendida
      const parte = partes.find(p => p.fecha === d.dateStr && p.curso === selectedCurso);
      if (parte && parte.huboClase === 'No') return;

      const state = getAsistenciaEstado(alumnoDni, d.dateStr);
      if (state === 'Presente') {
        totales++;
        presentes++;
      } else if (state === 'Ausente') {
        totales++;
        ausentes++;
      }
    });

    const porcentaje = totales > 0 ? Math.round((presentes / totales) * 100) : 100;
    return { presentes, ausentes, totalClasesGrabadas: totales, porcentaje };
  };

  // Manejo de Carga de Solicitud de Parte
  const handleSolicitarSubmit = (e) => {
    e.preventDefault();
    setSolError('');
    setSolSuccess('');

    if (!solCurso || !solFecha) {
      setSolError('Por favor complete todos los campos.');
      return;
    }

    // Validar duplicado activo
    const duplicada = solicitudesFaltantes.some(
      s => s.curso === solCurso && s.fecha === solFecha && !s.completada
    );
    if (duplicada) {
      setSolError(`Ya existe una solicitud pendiente de parte faltante para el curso ${solCurso} en la fecha ${new Date(solFecha + 'T00:00:00').toLocaleDateString('es-AR')}.`);
      return;
    }

    agregarSolicitudParteFaltante(solCurso, solFecha, `${user.nombre} ${user.apellido}`, user.rol);
    setSolSuccess(`¡Solicitud enviada con éxito al docente del curso ${solCurso}!`);
    setSolFecha('');

    setTimeout(() => {
      setSolSuccess('');
    }, 4500);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            Planilla e Informes de Asistencia EF
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestión escolar de cursadas Educación Física, solicitudes de partes faltantes e incidencias de E.E.S N° 28.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-primary-500/10 border border-primary-500/20 text-primary-600 px-3.5 py-2 rounded-xl">
          <Clock size={14} />
          <span>Ciclo Lectivo Escolar 2026</span>
        </div>
      </div>

      {/* Tabs Menu Premium */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('planilla')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'planilla'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <BarChart3 size={16} />
          Planilla Mensual
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'solicitudes'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <Bell size={16} />
          Solicitudes de Partes {solicitudesFaltantes.filter(s=>!s.completada).length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {solicitudesFaltantes.filter(s=>!s.completada).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('informes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'informes'
              ? 'border-primary-500 text-primary-500 bg-primary-500/5'
              : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
          }`}
        >
          <FileText size={16} />
          Actas e Informes
        </button>
      </div>

      {/* Panel de Notificaciones Recientes (Cargas de Docentes) */}
      {misNotificaciones.length > 0 && (
        <div className="space-y-3 p-4 bg-white border border-primary-500/20 rounded-2xl shadow-sm animate-fade-in mb-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
            <Bell className="text-primary-500 animate-bounce" size={16} />
            <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider font-display">
              Novedades de Asistencia (Partes Recientes Cargados)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {misNotificaciones.map((n) => (
              <div
                key={n.id}
                className="relative overflow-hidden glass-panel bg-slate-50/50 border border-slate-200/80 p-3.5 rounded-xl shadow-xs flex items-start justify-between gap-4 animate-pulse-once"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                <div className="space-y-1">
                  <span className="inline-block bg-primary-500/10 border border-primary-500/25 text-primary-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Curso {n.curso}
                  </span>
                  <p className="text-xs text-slate-700 font-bold leading-normal">{n.mensaje}</p>
                  <span className="block text-[8px] text-slate-450 text-slate-500 font-medium font-mono">
                    Registrado: {new Date(n.fechaCreacion).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => marcarNotificacionLeida(n.id, user.dni)}
                  className="text-[9px] bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-650 font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs"
                >
                  Entendido
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Renderizado de Pestañas */}
      <div className="pt-2 animate-fade-in">
        
        {activeTab === 'planilla' && (
          <div className="space-y-8">
            {/* Barra de Filtros Premium Light */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md flex flex-wrap items-center gap-5 justify-between bg-white">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wide">
                <Filter size={18} />
                <span>Filtros de Folio:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 grow max-w-2xl">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mes de Consulta</label>
                  <select
                    value={selectedMes}
                    onChange={e => setSelectedMes(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all cursor-pointer font-semibold"
                  >
                    {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Curso EF Cursada</label>
                  <select
                    value={selectedCurso}
                    onChange={e => {
                      const cursoVal = e.target.value;
                      setSelectedCurso(cursoVal);
                      setSelectedTurno(cursoVal.endsWith('1°') ? 'Mañana' : 'Tarde');
                    }}
                    className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-850 focus:outline-none transition-all font-extrabold cursor-pointer"
                  >
                    {cursosVisibles.map(c => <option key={c} value={c}>Curso {c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Turno</label>
                  <select
                    value={selectedTurno}
                    onChange={e => setSelectedTurno(e.target.value)}
                    className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Mañana">Mañana (Lun y Mié)</option>
                    <option value="Tarde">Tarde (Mar y Jue)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grilla 1 - Alumnos Oficiales */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-850 font-display flex items-center gap-2">
                    <span className="text-slate-850">Grilla 1: Alumnos de Educación Física (Regulares + Externos)</span>
                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-650 font-bold px-2.5 py-0.5 rounded-full">
                      {alumnosRegulares.length} Estudiantes
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Listado de alumnos que realizan Educación Física en {selectedCurso}.</p>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase self-start sm:self-center">
                  <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-accent-50 text-accent-600 border border-accent-200 text-center text-[9px] font-extrabold leading-5">P</span> Presente</span>
                  <span className="flex items-center gap-1"><span className="w-5 h-5 rounded bg-red-50 text-red-600 border border-red-200 text-center text-[9px] font-extrabold leading-5">A</span> Ausente</span>
                  <span className="flex items-center gap-1"><span className="w-5 h-5 text-slate-400 text-center text-[10px] leading-5 font-bold">-</span> Sin Registrar</span>
                </div>
              </div>

              {alumnosRegulares.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-350 rounded-2xl bg-slate-50/50">
                  <AlertCircle size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500">No hay alumnos regulares registrados para este curso y turno.</p>
                </div>
              ) : (
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold">
                        <th className="py-3 px-3 w-60">Estudiante (Apellido, Nombre)</th>
                        <th className="py-3 px-2 font-mono text-slate-400">DNI</th>
                        {diasClaseMes.map(d => (
                          <th key={d.dateStr} className="py-3 px-1.5 text-center font-mono font-bold text-slate-500 select-none min-w-[50px]">
                            {d.label}
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold border-l border-slate-200">Pres.</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Aus.</th>
                        <th className="py-3 px-3 text-right bg-slate-100 text-primary-500 font-extrabold">% Asist.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {alumnosRegulares.map((al) => {
                        const stats = calcularEstadisticasAlumno(al.dni);
                        return (
                          <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800">
                              {al.apellido}, {al.nombre}
                              {al.cursoOrigen !== selectedCurso && (
                                <span className="ml-2 inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {al.cursoOrigen} (Externo)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>
                            
                            {diasClaseMes.map(d => {
                              const state = getAsistenciaEstado(al.dni, d.dateStr);
                              return (
                                <td key={d.dateStr} className="py-3 px-1.5 text-center font-bold">
                                  {state === 'Presente' && (
                                    <span className="inline-block w-6 h-6 rounded bg-accent-50 text-accent-600 border border-accent-200 text-center leading-6 text-[10px] font-extrabold">P</span>
                                  )}
                                  {state === 'Ausente' && (
                                    <span className="inline-block w-6 h-6 rounded bg-red-50 text-red-600 border border-red-200 text-center leading-6 text-[10px] font-extrabold">A</span>
                                  )}
                                  {state === '-' && (
                                    <span className="text-slate-300 text-center leading-6 font-normal">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Resumen */}
                            <td className="py-3 px-3 text-center bg-slate-50 text-slate-700 font-bold border-l border-slate-200">{stats.presentes}</td>
                            <td className="py-3 px-3 text-center bg-slate-50 text-red-650 font-bold">{stats.ausentes}</td>
                            <td className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${
                              stats.porcentaje >= 80 ? "text-accent-600" :
                              stats.porcentaje >= 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {stats.porcentaje}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Grilla 2 - Alumnos Reasignados */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-850 font-display flex items-center gap-2">
                    <span className="text-slate-850">Grilla 2: Alumnos Reasignados (EF en otro curso)</span>
                    <span className="text-xs bg-yellow-50 border border-yellow-250 text-yellow-750 font-bold px-2.5 py-0.5 rounded-full">
                      {alumnosReasignados.length} Estudiantes
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Alumnos pertenecientes originalmente a {selectedCurso} en el Turno {selectedTurno} pero que realizan Educación Física en una división diferente.</p>
                </div>
              </div>

              {alumnosReasignados.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-bold">No hay alumnos de este curso reasignados a otras divisiones.</p>
                </div>
              ) : (
                <div className="overflow-x-auto font-sans">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold">
                        <th className="py-3 px-3 w-60">Estudiante (Apellido, Nombre)</th>
                        <th className="py-3 px-2 text-slate-400 font-mono">DNI</th>
                        <th className="py-3 px-3 font-bold text-yellow-650">Curso de EF Destino</th>
                        <th className="py-3 px-3 font-bold text-slate-600">Turno y Horario</th>
                        <th className="py-3 px-3 font-bold text-slate-600">Días de Cursada</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Pres.</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Aus.</th>
                        <th className="py-3 px-3 text-right bg-slate-100 text-primary-500 font-extrabold">% Asist.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {alumnosReasignados.map((al) => {
                        const stats = calcularEstadisticasAlumnoReasignado(al);
                        const cursoConfig = cursosConfig[al.cursoEF];
                        const diasArray = cursoConfig ? cursoConfig.dias : (al.cursoEF.endsWith('1°') ? [1, 3] : [2, 4]);
                        const diasLabel = diasArray.map(d => 
                          d === 1 ? 'Lunes' : d === 2 ? 'Martes' : d === 3 ? 'Miércoles' : d === 4 ? 'Jueves' : 'Viernes'
                        ).join(' y ');
                        const horarioLabel = cursoConfig ? cursoConfig.horario : "13:30 - 15:00";
                        const turnoLabel = cursoConfig ? cursoConfig.turno : "Tarde";

                        return (
                          <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800">{al.apellido}, {al.nombre}</td>
                            <td className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>
                            <td className="py-3 px-3">
                              <span className="inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-2 py-0.5 rounded text-[10px] font-bold">
                                Curso {al.cursoEF}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-700">
                              {turnoLabel} ({horarioLabel})
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-semibold">{diasLabel}</td>
                            <td className="py-3 px-3 text-center bg-slate-50 text-slate-700 font-bold">{stats.presentes}</td>
                            <td className="py-3 px-3 text-center bg-slate-50 text-red-650 font-bold">{stats.ausentes}</td>
                            <td className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${
                              stats.porcentaje >= 80 ? "text-accent-600" :
                              stats.porcentaje >= 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {stats.porcentaje}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Información pedagógica */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
              <BarChart3 className="text-primary-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Planilla de Asistencia Mensual - E.E.S N° 28</h4>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Esta planilla consolida dinámicamente las firmas digitales de los partes escolares del mes.
                  Los casilleros vacíos representan días hábiles donde aún no se ha confeccionado un parte firmado por el docente.
                  La asistencia calculada sirve de insumo para la calificación trimestral del área de Educación Física.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'solicitudes' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulario */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-500">
                    <Bell size={20} className="animate-pulse-slow" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">Solicitar Parte Faltante</h2>
                </div>

                {solError && (
                  <div className="mb-4 p-3 bg-red-500/5 border border-red-500/15 text-red-750 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-red-600" />
                    <span>{solError}</span>
                  </div>
                )}

                {solSuccess && (
                  <div className="mb-4 p-3 bg-accent-500/5 border border-accent-500/15 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <Check size={14} className="shrink-0 text-accent-600 animate-bounce" />
                    <span>{solSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSolicitarSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Curso a Requerir</label>
                    <select
                      value={solCurso}
                      onChange={e => setSolCurso(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-extrabold cursor-pointer"
                    >
                      {cursosVisibles.map(c => <option key={c} value={c}>Curso {c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Fecha Faltante</label>
                    <input
                      type="date"
                      value={solFecha}
                      onChange={e => setSolFecha(e.target.value)}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none font-mono font-semibold"
                      required
                    />
                    
                    {/* Visualizador de días sin completar */}
                    <div className="mt-3.5">
                      {fechasSinCompletar.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                            Días sin completar detectados (Click para autocompletar):
                          </span>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
                            {fechasSinCompletar.map(f => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setSolFecha(f)}
                                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 font-mono font-extrabold text-[9px] px-2.5 py-1 rounded-lg transition-all cursor-pointer active:scale-95 shadow-xs"
                              >
                                {new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-accent-50/50 border border-accent-200 text-accent-700 text-[9px] rounded-xl font-bold flex items-center gap-1.5">
                          <Check size={12} className="shrink-0 text-accent-600" />
                          <span>¡Al día! No se detectan clases sin cargar en este mes.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed font-medium">
                    <span className="font-bold text-slate-700 block mb-0.5">Notificación Interactiva:</span>
                    Al guardar, se disparará una alerta en tiempo real en el portal docente. Al confeccionar el parte para dicho curso y fecha, se marcará automáticamente la solicitud como resuelta.
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white text-[10px] font-bold py-3 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans"
                  >
                    Enviar Notificación de Faltante
                  </button>
                </form>
              </div>
            </div>

            {/* Historial de Solicitudes */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Historial de Partes Requeridos</h3>
                <span className="text-[10px] bg-white border border-slate-200 text-slate-650 font-bold px-3 py-1 rounded-xl shadow-sm">
                  {solicitudesFaltantes.length} Solicitudes
                </span>
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-lg">
                {solicitudesFaltantes.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                    <AlertCircle size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-500">No se han registrado solicitudes de partes faltantes.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto font-sans">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                          <th className="py-3 px-3">Curso</th>
                          <th className="py-3 px-3">Fecha Requerida</th>
                          <th className="py-3 px-3">Solicitante</th>
                          <th className="py-3 px-3 font-mono text-slate-400">Fecha Solicitud</th>
                          <th className="py-3 px-3 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {solicitudesFaltantes.map((sol) => {
                          const completedParte = partes.find(p => p.curso === sol.curso && p.fecha === sol.fecha);
                          return (
                            <tr key={sol.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                              <td className="py-3 px-3 font-extrabold text-slate-900">{sol.curso}</td>
                              <td className="py-3 px-3 font-bold font-mono text-slate-750">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                              <td className="py-3 px-3 font-semibold text-slate-800">{sol.solicitanteNombre} <span className="text-[9px] text-slate-450 font-normal">({sol.solicitanteRol})</span></td>
                              <td className="py-3 px-3 font-mono text-slate-500">{new Date(sol.fechaSolicitud).toLocaleString()}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {sol.completada ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                        <Check size={10} />
                                        Completado
                                      </span>
                                      {completedParte && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedParteDetail(completedParte)}
                                          className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-xl transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                          Ver Reporte
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-750 border border-red-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                      <Clock size={10} />
                                      Pendiente
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'informes' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-850 font-display uppercase tracking-wider">Actas de Incidencias Consolidadas (Modo Lectura)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Historial completo de actas cargadas y firmadas digitalmente por los docentes del HOST 28.</p>
              </div>
              <span className="text-[10px] bg-white border border-slate-200 text-slate-650 font-bold px-3.5 py-1 rounded-xl shadow-sm">
                {informes.length} Actas
              </span>
            </div>

            {informes.length === 0 ? (
              <div className="glass-card py-16 text-center rounded-3xl border border-slate-200 bg-white shadow-md">
                <FileText className="mx-auto text-slate-400 mb-2" size={36} />
                <p className="text-slate-500 text-xs font-bold">No se han registrado actas de incidencias en el sistema.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {informes.map((inf) => (
                  <div key={inf.id} className="glass-panel rounded-2xl border border-slate-200 p-5 relative overflow-hidden bg-white shadow-md animate-pulse-once">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
                      <div>
                        <span className="inline-block bg-primary-500/10 border border-primary-500/25 text-primary-600 text-[9px] font-bold px-2 py-0.5 rounded">
                          Curso EF: {inf.curso}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 font-display mt-1.5">{inf.titulo}</h4>
                      </div>
                      
                      {/* Sello de Firma inmutable */}
                      <div className="badge-signed px-2.5 py-1 rounded-xl text-[8px] font-mono text-accent-700 font-bold self-start sm:self-center">
                        <span className="block font-black text-accent-600">FIRMA DOCENTE CONVALIDADA ✔</span>
                        <span className="text-[7px] text-slate-500">{new Date(inf.firmaDigital.fechaFirma).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans mb-3">
                      {inf.contenido}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold">
                        <Clock size={12} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-500 mr-1">Involucrados:</span>
                        {inf.estudiantes ? (
                          inf.estudiantes.map(est => (
                            <span key={est.dni} className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                              {est.nombre} <span className="text-slate-400 font-mono ml-1">({est.dni})</span>
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                            {inf.estudianteNombre} <span className="text-slate-400 font-mono ml-1">({inf.estudianteDni})</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-bold">
                        <span>Docente Firmante: <strong>Prof. {inf.docenteNombre}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL DETALLES DEL PARTE COMPLETADO */}
      {selectedParteDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 md:p-8 relative overflow-hidden animate-zoom-in max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 rounded-full uppercase">
                  Reporte Digital Confeccionado
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-display mt-1">
                  Parte de Clase: {selectedParteDetail.curso}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedParteDetail(null)}
                className="text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 text-left">
              {/* Grid de Datos Técnicos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Fecha Clase</span>
                  <span className="font-extrabold text-slate-800 font-mono">
                    {new Date(selectedParteDetail.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Turno y Horario</span>
                  <span className="font-bold text-slate-700 font-mono">
                    {selectedParteDetail.turno} ({selectedParteDetail.horario})
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Clase N° y Unidad</span>
                  <span className="font-bold text-slate-700 font-mono">
                    Clase {selectedParteDetail.claseNum} • U. {selectedParteDetail.unidad}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Estado Clase</span>
                  <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[10px] mt-0.5 ${
                    selectedParteDetail.huboClase === 'Sí'
                      ? 'bg-accent-50 text-accent-700 border border-accent-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {selectedParteDetail.huboClase === 'Sí' ? 'Dictada' : 'Suspendida'}
                  </span>
                </div>
              </div>

              {/* Tema / Contenido Abordado */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Tema Abordado (Contenido Curricular):
                </span>
                <div className="bg-primary-500/5 border border-primary-500/10 p-4 rounded-2xl text-xs text-slate-800 font-sans leading-relaxed font-semibold">
                  {selectedParteDetail.contenido}
                </div>
              </div>

              {/* Dinámica y Carácter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Carácter</span>
                  <span className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
                    {selectedParteDetail.caracter}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dinámica</span>
                  <span className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
                    {selectedParteDetail.dinamica}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Observaciones de Cursada:
                </span>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed italic">
                  {selectedParteDetail.observaciones || 'Sin observaciones registradas.'}
                </div>
              </div>

              {/* Firma del Profesor */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl"></div>
                <div>
                  <div className="flex items-center gap-1.5 text-primary-500 font-bold text-[10px] uppercase tracking-wide">
                    <FileSignature size={12} className="animate-pulse" />
                    <span>Firma Digital Convalidada</span>
                  </div>
                  <div className="mt-1.5">
                    <p className="text-xs font-bold text-slate-800">Prof. {selectedParteDetail.docenteNombre}</p>
                    <p className="text-[9px] text-slate-450 text-slate-500 font-mono">Registro: {new Date(selectedParteDetail.firmaDigital.fechaFirma).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-center font-mono text-[8px] text-slate-450 font-bold shadow-xs">
                  {selectedParteDetail.firmaDigital.correo}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-150 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedParteDetail(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreceptorDashboard;
