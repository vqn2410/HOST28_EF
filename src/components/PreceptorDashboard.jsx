import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { Filter, BarChart3, AlertCircle, Clock, Bell, FileText, Check, Plus, Calendar, X, FileSignature, ChevronRight, ChevronDown, ChevronUp, BookOpen, Download, TrendingUp, Table2, LayoutList } from 'lucide-react';
import ReportesTab from './ReportesTab';

const esFechaNoLectiva = (fecha, feriados) => feriados.some((feriado) =>
  feriado.fecha === fecha ||
  (feriado.tipo === 'RECESO_INVIERNO' && fecha >= feriado.fechaInicio && fecha <= feriado.fechaFin)
);

const PreceptorDashboard = ({ activeTabInicial = 'planilla' }) => {
  const {
    alumnos,
    partes,
    cursosConfig,
    informes,
    solicitudesFaltantes,
    agregarSolicitudParteFaltante,
    notificaciones = [],
    marcarNotificacionLeida,
    setParteToEditGlobal,
    feriados = []
  } = useSchoolData();
  const { user } = useAuth();

  // Navegación de Pestañas
  const [activeTab, setActiveTab] = useState(activeTabInicial); // 'planilla' | 'solicitudes' | 'informes' | 'partes'
  const [selectedParteDetail, setSelectedParteDetail] = useState(null);
  const [showModalCurricular, setShowModalCurricular] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Estados para pestaña Partes
  const [selectedCursoPartes, setSelectedCursoPartes] = useState(() => {
    return user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
  });
  const [selectedMesPartes, setSelectedMesPartes] = useState("Todos"); // "Todos" | "03" | "04" ...



  // Estados del Formulario (Solicitud Parte Faltante)
  const [solCurso, setSolCurso] = useState(() => {
    return user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
  });
  const [solFecha, setSolFecha] = useState('');
  const [solComentario, setSolComentario] = useState('');
  const [solMes, setSolMes] = useState(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const mesesEscolares = ["02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    return mesesEscolares.includes(currentMonth) ? currentMonth : "05";
  });
  const [solError, setSolError] = useState('');
  const [solSuccess, setSolSuccess] = useState('');

  // Estado para filas expandidas del historial de partes requeridos
  const [expandedSolicitudes, setExpandedSolicitudes] = useState({});

  const toggleSolicitudDetalle = (id) => {
    setExpandedSolicitudes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
  const [selectedMes, setSelectedMes] = useState(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const mesesEscolares = ["03", "04", "05", "06", "07", "08", "09", "10", "11"];
    return mesesEscolares.includes(currentMonth) ? currentMonth : "05";
  });
  // Vista de la planilla: lista completa (tabla ancha con scroll) por defecto, como siempre se vio.
  // El toggle (solo visible en mobile) permite pasar a tarjetas apiladas por estudiante.
  const [vistaCompleta, setVistaCompleta] = useState(true);
  const tableClass = vistaCompleta ? '' : 'table-stack table-stack-all';
  const [selectedCurso, setSelectedCurso] = useState(() => {
    return user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
  });
  const [selectedTurno, setSelectedTurno] = useState(() => {
    const defaultCurso = user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0
      ? user.cursosAsignados[0]
      : "1°1°";
    return defaultCurso.endsWith('1°') ? 'Tarde' : 'Mañana';
  });

  // Escuchar y corregir el curso seleccionado si no coincide con los visibles
  React.useEffect(() => {
    if (cursosVisibles.length > 0 && !cursosVisibles.includes(selectedCurso)) {
      setSelectedCurso(cursosVisibles[0]);
      setSelectedTurno(cursosVisibles[0].endsWith('1°') ? 'Tarde' : 'Mañana');
    }
  }, [cursosVisibles, selectedCurso]);

  React.useEffect(() => {
    if (cursosVisibles.length > 0 && !cursosVisibles.includes(selectedCursoPartes)) {
      setSelectedCursoPartes(cursosVisibles[0]);
    }
  }, [cursosVisibles, selectedCursoPartes]);

  const partesFiltrados = useMemo(() => {
    return partes.filter(p => {
      const matchCurso = p.curso === selectedCursoPartes;
      const matchMes = selectedMesPartes === 'Todos' || p.fecha.split('-')[1] === selectedMesPartes;
      return matchCurso && matchMes;
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [partes, selectedCursoPartes, selectedMesPartes]);

  const obtenerTotalesParte = (parte) => {
    let presentes = 0;
    let ausentes = 0;
    let sinRegistro = 0;

    const asistencia = parte.asistencia || {};
    Object.values(asistencia).forEach(val => {
      if (val === 'Presente') presentes++;
      else if (val === 'Ausente') ausentes++;
      else sinRegistro++;
    });

    return {
      presentes,
      ausentes,
      sinRegistro,
      total: presentes + ausentes
    };
  };

  const descargarPartesExcel = (exportAll = false) => {
    const targetPartes = exportAll
      ? partes
      : partesFiltrados;

    const headers = [
      "ID Parte", "Fecha", "Curso", "Turno", "Horario", "Docente",
      "Hubo Clase", "Clase N°", "Unidad", "Carácter", "Dinámica",
      "Tema / Contenido", "Actividades desarrolladas", "Observaciones",
      "Motivo Suspensión", "Firma Docente", "Firma Autoridad",
      "Presentes", "Ausentes", "Total Asistencia", "Detalle Asistencia"
    ];

    const rows = targetPartes.map(p => {
      const totales = obtenerTotalesParte(p);

      const fd = p.firmaDigital;
      const firmaDocenteText = fd
        ? `${fd.apellido}, ${fd.nombre} (${fd.cargo} - ${fd.correo}) el ${new Date(fd.fechaFirma).toLocaleDateString('es-AR')}`
        : "No firmado";

      const fa = p.firmaAutoridad;
      const firmaAutoridadText = fa
        ? `${fa.apellido}, ${fa.nombre} (${fa.cargo} - ${fa.correo}) el ${new Date(fa.fechaFirma).toLocaleDateString('es-AR')}`
        : "Pendiente";

      const asistenciaDetalle = p.huboClase === 'Sí' && p.asistencia
        ? Object.entries(p.asistencia).map(([dni, estado]) => {
          const alumno = alumnos.find(a => a.dni === dni);
          const nombreAlumno = alumno ? alumno.nombre : "Desconocido";
          return `${nombreAlumno} (${dni}): ${estado}`;
        }).join(" | ")
        : (p.huboClase === 'No' ? 'Clase Suspendida' : '-');

      return [
        p.id,
        p.fecha,
        p.curso,
        p.turno || (cursosConfig[p.curso]?.turno || ''),
        p.horario || (cursosConfig[p.curso]?.horario || ''),
        p.docenteNombre || (cursosConfig[p.curso]?.docenteNombre || ''),
        p.huboClase,
        p.claseNum,
        p.unidad || '',
        p.caracter || '',
        p.dinamica || '',
        p.contenido || '',
        p.actividades || '',
        p.observaciones || '',
        p.motivoSuspension || '',
        firmaDocenteText,
        firmaAutoridadText,
        totales.presentes,
        totales.ausentes,
        totales.total,
        asistenciaDetalle
      ];
    });

    const csvContent = "\uFEFF" +
      [headers.join(";"), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const filename = exportAll
      ? "partes_emitidos_historico_completo.csv"
      : `partes_emitidos_curso_${selectedCursoPartes}_${selectedMesPartes}.csv`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MESES = [
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];

  // Regla de días de clase de EF: se leen dinámicamente de la configuración administrativa
  const claseDiasSemana = useMemo(() => {
    const config = cursosConfig[selectedCurso];
    return config ? config.dias : (selectedCurso.endsWith('1°') ? [2, 4] : [1, 3]);
  }, [cursosConfig, selectedCurso]);

  // Calcular todos los días del mes seleccionado en los que hay clase de EF (para el año 2026)
  const diasClaseMes = useMemo(() => {
    const year = 2026;
    const monthIndex = parseInt(selectedMes) - 1;
    const date = new Date(year, monthIndex, 1);
    const dias = [];

    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      const dayNum = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${selectedMes}-${dayNum}`;
      if (claseDiasSemana.includes(dayOfWeek) && !esFechaNoLectiva(formattedDate, feriados)) {
        const label = dayOfWeek === 1 ? `Lun ${date.getDate()}` :
          dayOfWeek === 2 ? `Mar ${date.getDate()}` :
            dayOfWeek === 3 ? `Mié ${date.getDate()}` : `Jue ${date.getDate()}`;
        dias.push({ dateStr: formattedDate, label });
      }
      date.setDate(date.getDate() + 1);
    }
    return dias;
  }, [selectedMes, claseDiasSemana, feriados]);

  // Calcular clases suspendidas en el mes para el curso seleccionado
  const clasesSuspendidas = useMemo(() => {
    return partes.filter(p =>
      p.curso === selectedCurso &&
      p.fecha.split('-')[1] === selectedMes &&
      p.huboClase === 'No'
    ).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [partes, selectedCurso, selectedMes]);

  // 1. Filtrar Alumnos Oficiales / Regulares (activos en EF en este curso, incluye recursantes)
  // Si el alumno fue dado de baja, solo figura mientras su fechaDeBaja caiga dentro del mes seleccionado (para conservar el histórico de asistencias)
  const inicioMes = `2026-${selectedMes}-01`;
  const esActivoEnMes = (al) => !al.fechaDeBaja || al.fechaDeBaja >= inicioMes;
  const alumnosRegulares = useMemo(() => {
    return alumnos
      .filter(al => (al.cursoEF === selectedCurso || (al.recursaCursos || []).includes(selectedCurso)) && !al.noCursaEF && esActivoEnMes(al))
      .sort((a, b) => {
        const isExternoA = a.cursoOrigen !== selectedCurso;
        const isExternoB = b.cursoOrigen !== selectedCurso;

        if (isExternoA && !isExternoB) return 1;
        if (!isExternoA && isExternoB) return -1;

        const nombreA = (a.nombre || '').trim().toLowerCase();
        const nombreB = (b.nombre || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
  }, [alumnos, selectedCurso, selectedMes]);

  // 2. Filtrar Alumnos Matriculados en este curso pero que hacen EF en otro curso (no exceptuados, no recursantes aquí)
  const alumnosReasignados = useMemo(() => {
    return alumnos
      .filter(al =>
        al.cursoOrigen === selectedCurso &&
        !(al.recursaCursos || []).includes(selectedCurso) &&
        al.cursoEF !== selectedCurso &&
        !al.noCursaEF &&
        esActivoEnMes(al)
      )
      .sort((a, b) => {
        const nombreA = (a.nombre || '').trim().toLowerCase();
        const nombreB = (b.nombre || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
  }, [alumnos, selectedCurso, selectedMes]);

  // 3. Filtrar Alumnos Exceptuados de EF
  const alumnosExceptuados = useMemo(() => {
    return alumnos
      .filter(al =>
        al.cursoOrigen === selectedCurso &&
        !!al.noCursaEF &&
        esActivoEnMes(al)
      )
      .sort((a, b) => {
        const nombreA = (a.nombre || '').trim().toLowerCase();
        const nombreB = (b.nombre || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
  }, [alumnos, selectedCurso, selectedMes]);

  // Días de clase de EF para el curso de la solicitud
  const solCursoDiasSemana = useMemo(() => {
    const config = cursosConfig[solCurso];
    return config ? config.dias : (solCurso.endsWith('1°') ? [2, 4] : [1, 3]);
  }, [cursosConfig, solCurso]);

  // Calcular fechas de clase del mes seleccionado para el curso elegido que NO tienen parte registrado ni solicitudes pendientes
  const fechasSinCompletar = useMemo(() => {
    const year = 2026;
    const monthIndex = parseInt(solMes) - 1;
    const date = new Date(year, monthIndex, 1);
    const faltantes = [];

    const hoyStr = new Date().toISOString().split('T')[0];

    while (date.getMonth() === monthIndex) {
      const dayOfWeek = date.getDay();
      const dayNum = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${solMes}-${dayNum}`;
      if (solCursoDiasSemana.includes(dayOfWeek) && !esFechaNoLectiva(formattedDate, feriados)) {

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
  }, [solMes, solCurso, solCursoDiasSemana, partes, solicitudesFaltantes, feriados]);

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
      if (diasSemana.includes(dayOfWeek) && !esFechaNoLectiva(`${year}-${selectedMes}-${String(date.getDate()).padStart(2, '0')}`, feriados)) {
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

  // Calcular la asistencia media de un grupo de alumnos (excluye automáticamente feriados, clases suspendidas e inasistencias docentes)
  const calcularMediaAsistencia = (listaAlumnos, fnStats) => {
    const conDatos = listaAlumnos
      .map(fnStats)
      .filter(stats => stats.totalClasesGrabadas > 0);

    if (conDatos.length === 0) {
      return { media: 100, conDatos: 0, presentes: 0, ausentes: 0, totales: 0, estudiantesEquivalentes: 0 };
    }

    const presentes = conDatos.reduce((acc, s) => acc + s.presentes, 0);
    const ausentes = conDatos.reduce((acc, s) => acc + s.ausentes, 0);
    const totales = conDatos.reduce((acc, s) => acc + s.totalClasesGrabadas, 0);
    const media = totales > 0 ? Math.round((presentes / totales) * 100) : 100;

    return {
      media,
      conDatos: conDatos.length,
      presentes,
      ausentes,
      totales,
      estudiantesEquivalentes: Math.round((media / 100) * conDatos.length)
    };
  };

  const mediaGrilla1 = calcularMediaAsistencia(alumnosRegulares, al => calcularEstadisticasAlumno(al.dni));

  const mediaGrilla2 = calcularMediaAsistencia(alumnosReasignados, al => calcularEstadisticasAlumnoReasignado(al));

  const mediaTotalCurso = {
    media: (mediaGrilla1.totales + mediaGrilla2.totales) > 0
      ? Math.round(((mediaGrilla1.presentes + mediaGrilla2.presentes) / (mediaGrilla1.totales + mediaGrilla2.totales)) * 100)
      : 100,
    conDatos: mediaGrilla1.conDatos + mediaGrilla2.conDatos,
    presentes: mediaGrilla1.presentes + mediaGrilla2.presentes,
    totales: mediaGrilla1.totales + mediaGrilla2.totales
  };
  mediaTotalCurso.estudiantesEquivalentes = Math.round((mediaTotalCurso.media / 100) * mediaTotalCurso.conDatos);

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

    agregarSolicitudParteFaltante(solCurso, solFecha, `${user.nombre} ${user.apellido}`, user.rol, solComentario);
    setSolSuccess(`¡Solicitud enviada con éxito al docente del curso ${solCurso}!`);
    setSolFecha('');
    setSolComentario('');

    setTimeout(() => {
      setSolSuccess('');
    }, 4500);
  };

  // Solicitar todos los partes faltantes del mes y curso seleccionados
  const handleSolicitarTodosFaltantes = () => {
    setSolError('');
    setSolSuccess('');

    if (fechasSinCompletar.length === 0) {
      setSolError('No hay días sin completar para solicitar en este mes y curso.');
      return;
    }

    fechasSinCompletar.forEach(fecha => {
      agregarSolicitudParteFaltante(solCurso, fecha, `${user.nombre} ${user.apellido}`, user.rol, solComentario);
    });

    setSolSuccess(`¡Se solicitaron ${fechasSinCompletar.length} partes faltantes al docente del curso ${solCurso} (${MESES.find(m => m.value === solMes)?.label || solMes})!`);
    setSolFecha('');
    setSolComentario('');

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
        <div className="flex items-center gap-4">
          {misNotificaciones.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>

              {/* Dropdown Notificaciones */}
              {showNotifications && (
                <div className="absolute -left-2 md:left-auto md:right-0 mt-2 w-[90vw] md:w-96 max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in origin-top-left md:origin-top-right">
                  <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                    <Bell className="text-primary-500" size={16} />
                    <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider font-display">
                      Novedades ({misNotificaciones.length})
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {misNotificaciones.map((n) => (
                      <div key={n.id} className="relative overflow-hidden bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex flex-col gap-2">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                        <div className="space-y-1">
                          <span className="inline-block bg-primary-500/10 text-primary-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Curso {n.curso}
                          </span>
                          <p className="text-xs text-slate-700 font-bold leading-normal">{n.mensaje}</p>
                          <span className="block text-[8px] text-slate-500 font-medium font-mono">
                            {new Date(n.fechaCreacion).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            marcarNotificacionLeida(n.id, user.dni);
                            if (misNotificaciones.length === 1) setShowNotifications(false);
                          }}
                          className="self-end text-[9px] bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-650 font-extrabold px-2 py-1 rounded transition-all cursor-pointer shadow-xs"
                        >
                          Entendido
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold bg-primary-500/10 border border-primary-500/20 text-primary-600 px-3.5 py-2 rounded-xl">
            <Clock size={14} />
            <span>Ciclo Lectivo Escolar 2026</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu Premium */}

      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('partes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeTab === 'partes'
            ? 'border-primary-500 text-primary-500 bg-primary-500/5'
            : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
            }`}
        >
          <FileSignature size={16} />
          Partes de Clase
        </button>
        <button
          onClick={() => setActiveTab('planilla')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeTab === 'planilla'
            ? 'border-primary-500 text-primary-500 bg-primary-500/5'
            : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
            }`}
        >
          <BarChart3 size={16} />
          Planilla Mensual
        </button>

        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeTab === 'reportes'
            ? 'border-primary-500 text-primary-500 bg-primary-500/5'
            : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
            }`}
        >
          <TrendingUp size={16} />
          Reportes
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeTab === 'solicitudes'
            ? 'border-primary-500 text-primary-500 bg-primary-500/5'
            : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
            }`}
        >
          <Bell size={16} />
          Solicitudes de Partes {solicitudesFaltantes.filter(s => !s.completada).length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
              {solicitudesFaltantes.filter(s => !s.completada).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('informes')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeTab === 'informes'
            ? 'border-primary-500 text-primary-500 bg-primary-500/5'
            : 'border-transparent text-slate-500 hover:text-primary-500 hover:bg-slate-100'
            }`}
        >
          <FileText size={16} />
          Actas e Informes
        </button>


      </div>

      {/* Se ha movido el panel de notificaciones a un icono desplegable en el encabezado */}

      {/* Renderizado de Pestañas */}
      <div className="pt-2 animate-fade-in">

        {activeTab === 'planilla' && (
          <div className="space-y-8">
            {/* Botones de Selección de Cursos Disponibles */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md bg-white space-y-4">
              <div className="flex items-center gap-2 text-primary-500 font-extrabold text-sm uppercase tracking-wide">
                <FileSignature size={18} />
                <span>Cursos Disponibles:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {cursosVisibles.map(c => {
                  const isSelected = selectedCurso === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCurso(c);
                        setSelectedTurno(c.endsWith('1°') ? 'Tarde' : 'Mañana');
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs border cursor-pointer active:scale-95 ${isSelected
                        ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      Curso {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Filtros Premium Light */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md flex flex-wrap items-center gap-5 justify-between bg-white">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wide">
                <Filter size={18} />
                <span>Otros Filtros de Folio:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 grow max-w-2xl">
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


              </div>
            </div>

            {/* Tarjeta de Asistencia Media del Curso */}
            <div className="glass-panel rounded-3xl p-6 border border-primary-500/30 shadow-lg bg-gradient-to-br from-primary-500/5 via-white to-accent-500/5 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl"></div>
              <div className="flex flex-wrap items-center justify-between gap-5 relative">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-2xl bg-primary-500 border border-primary-200 text-white shadow-md">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 font-display uppercase tracking-wide">
                      Asistencia Media del Curso {selectedCurso}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5 max-w-md">
                      Calculada automáticamente sobre la asistencia registrada. No se computan feriados, clases suspendidas ni inasistencias docentes.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Media de Asistencia</span>
                    <span className={`text-4xl font-extrabold font-mono ${mediaTotalCurso.media >= 80 ? 'text-accent-600' : mediaTotalCurso.media >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {mediaTotalCurso.media}%
                    </span>
                    <span className="block text-[10px] font-bold text-slate-600 mt-0.5">
                      ≈ {mediaTotalCurso.estudiantesEquivalentes} de {mediaTotalCurso.conDatos} estudiantes
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Presentes</span>
                    <span className="text-2xl font-extrabold text-slate-800">{mediaTotalCurso.presentes}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Registros</span>
                    <span className="text-2xl font-extrabold text-slate-800">{mediaTotalCurso.totales}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alumnos con Datos</span>
                    <span className="text-2xl font-extrabold text-slate-800">{mediaTotalCurso.conDatos}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle (solo mobile): vista apilada vs lista completa */}
            <button
              type="button"
              onClick={() => setVistaCompleta(v => !v)}
              className={`md:hidden w-full flex items-center justify-center gap-2 py-3 rounded-2xl border font-extrabold text-[11px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                vistaCompleta
                  ? 'bg-white border-slate-300 text-slate-700 shadow-xs hover:border-primary-400'
                  : 'bg-primary-500 border-primary-500 text-white shadow-md'
              }`}
            >
              {vistaCompleta ? <LayoutList size={16} /> : <Table2 size={16} />}
              {vistaCompleta ? 'Vista compacta (tarjetas por estudiante)' : 'Vista de lista completa (todas las columnas)'}
            </button>

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
                  <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold">
                        <th className="py-3 px-3 w-60 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estudiante (Apellido, Nombre)</th>
                        <th className="py-3 px-2 font-mono text-slate-400">DNI</th>
                        {diasClaseMes.map(d => {
                          const parte = partes.find(p => p.fecha === d.dateStr && p.curso === selectedCurso);
                          const noHuboClase = parte && parte.huboClase === 'No';
                          return (
                            <th
                              key={d.dateStr}
                              className={`py-3 px-1.5 text-center font-mono font-bold select-none min-w-[50px] ${noHuboClase ? 'bg-red-50 text-red-700 border-x border-red-200' : 'text-slate-500'
                                }`}
                            >
                              {d.label}
                            </th>
                          );
                        })}
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold border-l border-slate-200">Pres.</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Aus.</th>
                        <th className="py-3 px-3 text-right bg-slate-100 text-primary-500 font-extrabold">% Asist.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {alumnosRegulares.map((al) => {
                        const stats = calcularEstadisticasAlumno(al.dni);
                        return (
                          <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors group">
                            <td data-label="Estudiante" className="py-3 px-3 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              {al.nombre}
                              {al.fechaDeBaja && (
                                <span className="ml-2 inline-block bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  Baja {new Date(al.fechaDeBaja + 'T00:00:00').toLocaleDateString('es-AR')}
                                </span>
                              )}
                              {al.cursoOrigen !== selectedCurso && (
                                <span className="ml-2 inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  {al.cursoOrigen} (Externo)
                                </span>
                              )}
                            </td>
                            <td data-label="DNI" className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>

                            {diasClaseMes.map(d => {
                              const parte = partes.find(p => p.fecha === d.dateStr && p.curso === selectedCurso);
                              const noHuboClase = parte && parte.huboClase === 'No';
                              const state = getAsistenciaEstado(al.dni, d.dateStr);
                              return (
                                <td
                                  key={d.dateStr}
                                  data-label={d.label}
                                  className={`py-3 px-1.5 text-center font-bold ${noHuboClase ? 'bg-red-50/50 border-x border-red-100' : ''
                                    }`}
                                >
                                  {noHuboClase ? (
                                    <span
                                      className="inline-block w-6 h-6 rounded bg-red-100 text-red-700 border border-red-200 text-center leading-6 text-[10px] font-extrabold cursor-help"
                                      title={`Clase Suspendida: ${parte.motivoSuspension || 'Sin especificar'}`}
                                    >
                                      S
                                    </span>
                                  ) : (
                                    <>
                                      {state === 'Presente' && (
                                        <span className="inline-block w-6 h-6 rounded bg-accent-50 text-accent-600 border border-accent-200 text-center leading-6 text-[10px] font-extrabold">P</span>
                                      )}
                                      {state === 'Ausente' && (
                                        <span className="inline-block w-6 h-6 rounded bg-red-50 text-red-600 border border-red-200 text-center leading-6 text-[10px] font-extrabold">A</span>
                                      )}
                                      {state === '-' && (
                                        <span className="text-slate-300 text-center leading-6 font-normal">-</span>
                                      )}
                                    </>
                                  )}
                                </td>
                              );
                            })}

                            {/* Resumen */}
                            <td data-label="Pres." className="py-3 px-3 text-center bg-slate-50 text-slate-700 font-bold border-l border-slate-200">{stats.presentes}</td>
                            <td data-label="Aus." className="py-3 px-3 text-center bg-slate-50 text-red-650 font-bold">{stats.ausentes}</td>
                            <td data-label="% Asist." className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${stats.porcentaje >= 80 ? "text-accent-600" :
                              stats.porcentaje >= 60 ? "text-yellow-600" : "text-red-600"
                              }`}>
                              {stats.porcentaje}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-extrabold">
                        <td colSpan={diasClaseMes.length + 2} className="py-3 px-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                          Asistencia Media del Curso (Regulares + Externos)
                          <span className="block text-[9px] text-slate-500 font-bold normal-case">
                            ≈ {mediaGrilla1.estudiantesEquivalentes} de {mediaGrilla1.conDatos} estudiantes presentes en promedio
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 font-extrabold">{mediaGrilla1.presentes}</td>
                        <td className="py-3 px-3 text-center text-red-600 font-extrabold">{mediaGrilla1.ausentes}</td>
                        <td className={`py-3 px-3 text-right font-extrabold ${mediaGrilla1.media >= 80 ? "text-accent-600" : mediaGrilla1.media >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {mediaGrilla1.media}%
                        </td>
                      </tr>
                    </tfoot>
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
                  <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold">
                        <th className="py-3 px-3 w-60 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estudiante (Apellido, Nombre)</th>
                        <th className="py-3 px-2 text-slate-400 font-mono">DNI</th>
                        <th className="py-3 px-3 font-bold text-yellow-650">Curso de EF Destino</th>
                        <th className="py-3 px-3 font-bold text-slate-600">Turno y Horario</th>
                        <th className="py-3 px-3 font-bold text-slate-600">Días de Cursada</th>
                        <th className="py-3 px-3 font-bold text-slate-600 w-80">Asistencia Diaria (Clases EF)</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Pres.</th>
                        <th className="py-3 px-3 text-center bg-slate-100 text-slate-700 font-bold">Aus.</th>
                        <th className="py-3 px-3 text-right bg-slate-100 text-primary-500 font-extrabold">% Asist.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {alumnosReasignados.map((al) => {
                        const stats = calcularEstadisticasAlumnoReasignado(al);
                        const cursoConfig = cursosConfig[al.cursoEF];
                        const diasArray = cursoConfig ? cursoConfig.dias : (al.cursoEF.endsWith('1°') ? [2, 4] : [1, 3]);
                        const diasLabel = diasArray.map(d =>
                          d === 1 ? 'Lunes' : d === 2 ? 'Martes' : d === 3 ? 'Miércoles' : d === 4 ? 'Jueves' : 'Viernes'
                        ).join(' y ');
                        const horarioLabel = cursoConfig ? cursoConfig.horario : "13:30 - 15:00";
                        const turnoLabel = cursoConfig ? cursoConfig.turno : "Tarde";

                        // Calcular detalle diario
                        const getDetalleAsistenciaReasignado = (alumno) => {
                          const cEF = alumno.cursoEF;
                          const config = cursosConfig[cEF];
                          const diasSemana = config ? config.dias : (cEF.endsWith('1°') ? [2, 4] : [1, 3]);

                          const year = 2026;
                          const monthIndex = parseInt(selectedMes) - 1;
                          const date = new Date(year, monthIndex, 1);
                          const dias = [];

                          while (date.getMonth() === monthIndex) {
                            const dayOfWeek = date.getDay();
                            if (diasSemana.includes(dayOfWeek) && !esFechaNoLectiva(`${year}-${selectedMes}-${String(date.getDate()).padStart(2, '0')}`, feriados)) {
                              const dayNum = String(date.getDate()).padStart(2, '0');
                              dias.push({
                                dateStr: `${year}-${selectedMes}-${dayNum}`,
                                label: `${date.getDate()}/${selectedMes}`
                              });
                            }
                            date.setDate(date.getDate() + 1);
                          }

                          return dias.map(d => {
                            const parte = partes.find(p => p.fecha === d.dateStr && p.curso === cEF);
                            if (!parte) return { label: d.label, state: '-', dateStr: d.dateStr };
                            if (parte.huboClase === 'No') return { label: d.label, state: 'Susp.', dateStr: d.dateStr };
                            return {
                              label: d.label,
                              state: parte.asistencia[alumno.dni] || '-',
                              dateStr: d.dateStr
                            };
                          });
                        };

                        const detalleAsist = getDetalleAsistenciaReasignado(al);

                        return (
                          <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors group">
                            <td data-label="Estudiante" className="py-3 px-3 font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                              {al.nombre}
                              {al.fechaDeBaja && (
                                <span className="ml-2 inline-block bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                  Baja {new Date(al.fechaDeBaja + 'T00:00:00').toLocaleDateString('es-AR')}
                                </span>
                              )}
                            </td>
                            <td data-label="DNI" className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>
                            <td data-label="Curso de EF Destino" className="py-3 px-3">
                              <span className="inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-2 py-0.5 rounded text-[10px] font-bold">
                                Curso {al.cursoEF}
                              </span>
                            </td>
                            <td data-label="Turno y Horario" className="py-3 px-3 font-semibold text-slate-700">
                              {turnoLabel} ({horarioLabel})
                            </td>
                            <td data-label="Días de Cursada" className="py-3 px-3 text-slate-500 font-semibold">{diasLabel}</td>
                            <td data-label="Asistencia Diaria" className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {detalleAsist.map(det => (
                                  <span
                                    key={det.dateStr}
                                    title={`Fecha: ${det.label} - Asistencia: ${det.state}`}
                                    className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${det.state === 'Presente' ? 'bg-accent-50 text-accent-700 border-accent-200' :
                                      det.state === 'Ausente' ? 'bg-red-50 text-red-700 border-red-200' :
                                        det.state === 'Susp.' ? 'bg-slate-100 text-slate-450 border-slate-200 line-through' :
                                          'bg-slate-50 text-slate-350 border-slate-200'
                                      }`}
                                  >
                                    {det.label}:{det.state === 'Presente' ? 'P' : det.state === 'Ausente' ? 'A' : det.state === 'Susp.' ? 'S' : '-'}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td data-label="Pres." className="py-3 px-3 text-center bg-slate-50 text-slate-700 font-bold">{stats.presentes}</td>
                            <td data-label="Aus." className="py-3 px-3 text-center bg-slate-50 text-red-650 font-bold">{stats.ausentes}</td>
                            <td data-label="% Asist." className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${stats.porcentaje >= 80 ? "text-accent-600" :
                              stats.porcentaje >= 60 ? "text-yellow-600" : "text-red-600"
                              }`}>
                              {stats.porcentaje}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-extrabold">
                        <td colSpan={6} className="py-3 px-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                          Asistencia Media del Curso (Reasignados)
                          <span className="block text-[9px] text-slate-500 font-bold normal-case">
                            ≈ {mediaGrilla2.estudiantesEquivalentes} de {mediaGrilla2.conDatos} estudiantes presentes en promedio
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-800 font-extrabold">{mediaGrilla2.presentes}</td>
                        <td className="py-3 px-3 text-center text-red-600 font-extrabold">{mediaGrilla2.ausentes}</td>
                        <td className={`py-3 px-3 text-right font-extrabold ${mediaGrilla2.media >= 80 ? "text-accent-600" : mediaGrilla2.media >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                          {mediaGrilla2.media}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Grilla 3 - Alumnos Exceptuados */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-850 font-display flex items-center gap-2">
                    <span className="text-slate-850">Grilla 3: Alumnos que no cursan EF</span>
                    <span className="text-xs bg-red-50 border border-red-200 text-red-700 font-bold px-2.5 py-0.5 rounded-full">
                      {alumnosExceptuados.length} Estudiantes
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Alumnos pertenecientes originalmente a {selectedCurso} que están eximidos o no cursan la materia.</p>
                </div>
              </div>

              {alumnosExceptuados.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 font-bold">No hay alumnos exceptuados en esta división.</p>
                </div>
              ) : (
                <div className="overflow-x-auto font-sans">
                  <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                        <th className="py-3 px-3 w-60 sticky left-0 bg-slate-50 z-20 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Estudiante (Apellido, Nombre)</th>
                        <th className="py-3 px-2 text-slate-400 font-mono">DNI</th>
                        <th className="py-3 px-3 font-bold text-red-750">Estado</th>
                        <th className="py-3 px-3 font-bold text-slate-600">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {alumnosExceptuados.map((al) => (
                        <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors group">
                          <td data-label="Estudiante" className="py-3 px-3 font-bold text-slate-850 line-through sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{al.nombre}</td>
                          <td data-label="DNI" className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>
                          <td data-label="Estado" className="py-3 px-3">
                            <span className="inline-block bg-red-50 text-red-700 border border-red-250 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              No cursa
                            </span>
                          </td>
                          <td data-label="Observaciones" className="py-3 px-3 text-slate-500 italic">No registra cómputo de asistencia para EF.</td>
                        </tr>
                      ))}
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

            {/* Registro de Clases Suspendidas del Mes */}
            {clasesSuspendidas.length > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-red-200 shadow-lg bg-red-50/10 animate-fade-in">
                <div className="flex items-center gap-2 mb-4 border-b border-red-100 pb-3">
                  <AlertCircle className="text-red-500" size={20} />
                  <h3 className="text-lg font-bold text-red-800 font-display">Clases Suspendidas - Registro de Motivos</h3>
                </div>
                <div className="overflow-x-auto font-sans">
                  <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
                    <thead>
                      <tr className="border-b border-red-200 bg-red-50 text-red-700 font-bold">
                        <th className="py-2.5 px-3 w-32">Fecha</th>
                        <th className="py-2.5 px-3 w-24">Clase N°</th>
                        <th className="py-2.5 px-3 w-48">Docente</th>
                        <th className="py-2.5 px-3">Motivo de Suspensión</th>
                        <th className="py-2.5 px-3 w-40 text-center">Firma Digital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 text-slate-700">
                      {clasesSuspendidas.map((clase) => (
                        <tr key={clase.id} className="hover:bg-red-50/30">
                          <td data-label="Fecha" className="py-2.5 px-3 font-mono font-bold text-red-750">
                            {clase.dia || clase.fecha.split('-')[2]} de {clase.mes || 'Mayo'}
                          </td>
                          <td data-label="Clase N°" className="py-2.5 px-3 font-mono font-bold">
                            #{clase.claseNum || '1'}
                          </td>
                          <td data-label="Docente" className="py-2.5 px-3 font-semibold">
                            {clase.docenteNombre}
                          </td>
                          <td data-label="Motivo de Suspensión" className="py-2.5 px-3 font-bold text-red-800 italic">
                            {clase.motivoSuspension || "Licencia Médica"}
                          </td>
                          <td data-label="Firma Digital" className="py-2.5 px-3 text-center">
                            <span className="inline-block bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200">
                              FIRMADO DOCENTE ✔
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'reportes' && (
          <ReportesTab cursos={cursosVisibles} />
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
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Mes de Consulta</label>
                    <select
                      value={solMes}
                      onChange={e => {
                        setSolMes(e.target.value);
                        setSolFecha('');
                      }}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none font-extrabold cursor-pointer"
                    >
                      {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <p className="text-[9px] text-slate-400 font-semibold mt-1">
                      Permite solicitar partes faltantes de meses anteriores.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Fecha Faltante</label>
                    <input
                      type="date"
                      min={`2026-${solMes}-01`}
                      max={new Date().toISOString().split('T')[0]}
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

                  <button
                    type="button"
                    onClick={handleSolicitarTodosFaltantes}
                    disabled={fechasSinCompletar.length === 0}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-[10px] font-bold py-3 px-4 rounded-xl transition-all uppercase tracking-wider cursor-pointer font-sans flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Solicitar todos los faltantes ({fechasSinCompletar.length})
                  </button>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Motivo / Notas de la Solicitud (Opcional)</label>
                    <textarea
                      value={solComentario}
                      onChange={e => setSolComentario(e.target.value)}
                      placeholder="Ej: Registrar con urgencia por cierre de promedios, recuperar clase feriado, etc..."
                      rows={2}
                      className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-sans"
                    />
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
                    <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
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
                          const isExpanded = !!expandedSolicitudes[sol.id];
                          const config = cursosConfig[sol.curso];
                          return (
                            <React.Fragment key={sol.id}>
                              <tr className="hover:bg-slate-50 text-slate-700 transition-colors">
                                <td data-label="Curso" className="py-3 px-3 font-extrabold text-slate-900">{sol.curso}</td>
                                <td data-label="Fecha Requerida" className="py-3 px-3 font-bold font-mono text-slate-750">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                <td data-label="Solicitante" className="py-3 px-3 font-semibold text-slate-800">{sol.solicitanteNombre} <span className="text-[9px] text-slate-450 font-normal">({sol.solicitanteRol})</span></td>
                                <td data-label="Fecha Solicitud" className="py-3 px-3 font-mono text-slate-500">{new Date(sol.fechaSolicitud).toLocaleString()}</td>
                                <td data-label="Estado" className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleSolicitudDetalle(sol.id)}
                                      className="text-slate-450 hover:text-slate-750 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 text-[10px] font-extrabold"
                                    >
                                      <span>Detalle</span>
                                      {isExpanded ? <ChevronDown size={11} className="text-slate-500" /> : <ChevronRight size={11} className="text-slate-500" />}
                                    </button>
                                    {sol.completada ? (
                                      <>
                                        <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                          <Check size={10} />
                                          Completado
                                        </span>
                                        {completedParte && (
                                          <div className="flex items-center gap-1.5">
                                            {user?.rol === 'Equipo de Conducción' && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setParteToEditGlobal(completedParte);
                                                  window.location.hash = '#/admin/partes_crear';
                                                }}
                                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[9px] px-2.5 py-1 rounded-xl transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap border border-slate-200"
                                              >
                                                Editar
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => { setSelectedParteDetail(completedParte); setShowModalCurricular(false); }}
                                              className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-xl transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                                            >
                                              Ver Reporte
                                            </button>
                                          </div>
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
                              {isExpanded && (
                                <tr className="bg-slate-50/30">
                                  <td colSpan={5} className="p-4 border-t border-slate-150">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-xs space-y-3 animate-fade-in">
                                      {sol.completada && completedParte ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                          <div className="space-y-2">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                              <span className="w-1.5 h-1.5 rounded-full bg-accent-500"></span>
                                              Información del Parte Confeccionado
                                            </h4>
                                            <p className="text-slate-600">
                                              <strong>Docente:</strong> Prof. {completedParte.docenteNombre || `${completedParte.firmaDigital?.nombre} ${completedParte.firmaDigital?.apellido}`}
                                            </p>
                                            <p className="text-slate-600">
                                              <strong>Clase:</strong> {completedParte.huboClase === 'Sí' ? `Clase N° ${completedParte.claseNum} • Unidad ${completedParte.unidad}` : 'Clase Suspendida'}
                                            </p>
                                            <p className="text-slate-600">
                                              <strong>Horario:</strong> {completedParte.horario || config?.horario} ({completedParte.turno || config?.turno})
                                            </p>
                                            {completedParte.huboClase === 'No' && (
                                              <p className="text-red-700 bg-red-50 border border-red-150 px-2.5 py-1.5 rounded-xl font-bold italic">
                                                Motivo Suspensión: {completedParte.motivoSuspension || 'Sin especificar'}
                                              </p>
                                            )}
                                            {sol.comentario && (
                                              <p className="text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-medium mt-2">
                                                <strong>Nota de la solicitud:</strong> {sol.comentario}
                                              </p>
                                            )}
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                              Detalle Curricular y Asistencia
                                            </h4>
                                            <div className="text-slate-600">
                                              <strong>Tema:</strong>
                                              <p className="mt-0.5 text-slate-700 italic font-medium bg-slate-50/50 p-2 border border-slate-150 rounded-lg">{completedParte.contenido || completedParte.temaAbordado || 'Sin cargar.'}</p>
                                            </div>
                                            <div className="text-slate-600 mt-2">
                                              <strong>Actividades:</strong>
                                              <p className="mt-0.5 text-slate-700 italic font-medium bg-slate-50/50 p-2 border border-slate-150 rounded-lg">{completedParte.actividades || '-'}</p>
                                            </div>
                                            {completedParte.huboClase === 'Sí' && (
                                              <div className="flex gap-2.5 mt-1.5">
                                                <span className="bg-accent-50 text-accent-700 border border-accent-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                  Presentes: {Object.values(completedParte.asistencia || {}).filter(a => a === 'Presente').length}
                                                </span>
                                                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                                  Ausentes: {Object.values(completedParte.asistencia || {}).filter(a => a === 'Ausente').length}
                                                </span>
                                              </div>
                                            )}
                                            {completedParte.observaciones && (
                                              <p className="text-slate-500 italic mt-1.5 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <strong>Obs:</strong> {completedParte.observaciones}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                          <div className="space-y-2">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                              Parte Pendiente de Carga
                                            </h4>
                                            <p className="text-slate-600">
                                              <strong>Curso:</strong> {sol.curso}
                                            </p>
                                            <p className="text-slate-600">
                                              <strong>Docente a cargo:</strong> {config ? `Prof. ${config.docenteNombre}` : 'No asignado'}
                                            </p>
                                            {sol.comentario && (
                                              <p className="text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl font-medium mt-2">
                                                <strong>Nota de la solicitud:</strong> {sol.comentario}
                                              </p>
                                            )}
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                              Planificación Horaria
                                            </h4>
                                            <p className="text-slate-600">
                                              <strong>Horario habitual:</strong> {config ? `${config.horario} (${config.turno})` : 'No configurado'}
                                            </p>
                                            <p className="text-slate-500 italic mt-2">
                                              Al cargar el parte para la fecha {new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')} en la sección del docente, el estado cambiará automáticamente a completado y se visualizará el desglose en esta sección.
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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

        {activeTab === 'partes' && (
          <div className="space-y-8">
            {/* Botones de Selección de Cursos Disponibles */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md bg-white space-y-4">
              <div className="flex items-center gap-2 text-primary-500 font-extrabold text-sm uppercase tracking-wide">
                <FileSignature size={18} />
                <span>Seleccionar Curso para Historial de Partes:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {cursosVisibles.map(c => {
                  const isSelected = selectedCursoPartes === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCursoPartes(c);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs border cursor-pointer active:scale-95 ${isSelected
                        ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      Curso {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md flex flex-wrap items-center gap-5 justify-between bg-white">
              <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wide">
                <Filter size={18} />
                <span>Otros Filtros:</span>
              </div>
              <div className="w-full sm:w-72">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filtrar por Mes</label>
                <select
                  value={selectedMesPartes}
                  onChange={e => setSelectedMesPartes(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all cursor-pointer font-semibold"
                >
                  <option value="Todos">Todos los Meses</option>
                  {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* Listado de Partes */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-slate-850 font-display flex items-center gap-2">
                    <span>Partes Disponibles - Curso {selectedCursoPartes}</span>
                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-650 font-bold px-2.5 py-0.5 rounded-full">
                      {partesFiltrados.length} Registros
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Historial y reporte de temas dictados, asistencia y novedades.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    onClick={() => descargarPartesExcel(false)}
                    className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Exportar Filtrados (Excel)</span>
                  </button>
                  <button
                    onClick={() => descargarPartesExcel(true)}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Exportar Todo (Excel)</span>
                  </button>
                </div>
              </div>

              {partesFiltrados.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-350 rounded-2xl bg-slate-50/50">
                  <AlertCircle size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500">No hay partes de clase registrados para este curso en el período seleccionado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {partesFiltrados.map((parte) => {
                    const totales = obtenerTotalesParte(parte);
                    const isSuspended = parte.huboClase === 'No';
                    return (
                      <div
                        key={parte.id}
                        className={`glass-panel border rounded-2xl p-5 bg-white shadow-md flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative overflow-hidden group border-slate-200 ${isSuspended ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary-500'
                          }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                            <div>
                              <span className="text-[10px] font-mono text-slate-450 font-bold uppercase block">
                                {new Date(parte.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                              <h3 className="text-base font-bold text-slate-800 font-display mt-1">
                                {isSuspended ? 'Clase Suspendida' : `Clase N° ${parte.claseNum} • Unidad ${parte.unidad}`}
                              </h3>
                            </div>
                            <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${!isSuspended
                              ? 'bg-accent-50 text-accent-700 border-accent-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                              {!isSuspended ? 'Dictada' : 'Suspendida'}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="text-xs text-slate-650 leading-relaxed font-semibold">
                              <strong>Contenido/Tema:</strong>
                              <p className="mt-1 text-slate-600 font-normal line-clamp-2" title={parte.contenido || parte.temaAbordado}>
                                {parte.contenido || parte.temaAbordado}
                              </p>
                            </div>
                            <div className="text-xs text-slate-650 leading-relaxed font-semibold mt-1">
                              <strong>Actividades:</strong>
                              <p className="mt-1 text-slate-600 font-normal line-clamp-2" title={parte.actividades || '-'}>
                                {parte.actividades || '-'}
                              </p>
                            </div>
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 font-semibold pt-1 border-t border-dashed border-slate-100">
                              <span><strong>Docente:</strong> Prof. {parte.docenteNombre}</span>
                              <span><strong>Horario:</strong> {parte.horario}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-3">
                          {/* Totales de Asistencia */}
                          <div className="flex items-center gap-2">
                            {!isSuspended ? (
                              <>
                                <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-700 border border-accent-100 px-2 py-0.5 rounded text-[9px] font-bold shadow-xs">
                                  P: {totales.presentes}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-[9px] font-bold shadow-xs">
                                  A: {totales.ausentes}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">Matrícula: {totales.total}</span>
                              </>
                            ) : (
                              <span className="text-[9px] bg-red-50 text-red-750 font-extrabold px-2 py-0.5 rounded border border-red-200 shadow-xs truncate max-w-[180px]" title={parte.motivoSuspension || 'Clase Suspendida'}>
                                {parte.motivoSuspension || 'Clase Suspendida'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {user?.rol === 'Equipo de Conducción' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setParteToEditGlobal(parte);
                                  window.location.hash = '#/admin/partes_crear';
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1 border border-slate-200"
                                title="Editar parte en el Panel de Administración"
                              >
                                <span>Editar</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setSelectedParteDetail(parte); setShowModalCurricular(false); }}
                              className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <span>Detalle</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                onClick={() => { setSelectedParteDetail(null); setShowModalCurricular(false); }}
                className="text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 p-2 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 text-left">
              {/* Grid de Datos Técnicos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
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
                  <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Docente a cargo</span>
                  <span className="font-bold text-slate-700 font-sans">
                    Prof. {selectedParteDetail.docenteNombre}
                  </span>
                </div>
              </div>

              {/* Desglose de Asistencia y Detalle de Estudiantes (Prioritario) */}
              <div className="space-y-4">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Desglose de Asistencia y Estudiantes:
                </span>

                {/* Panel de Totales */}
                {selectedParteDetail.huboClase === 'Sí' ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-accent-50 border border-accent-200 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-accent-700">Presentes</span>
                      <span className="text-xl font-extrabold text-accent-800">
                        {Object.values(selectedParteDetail.asistencia || {}).filter(a => a === 'Presente').length}
                      </span>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-red-700">Ausentes</span>
                      <span className="text-xl font-extrabold text-red-800">
                        {Object.values(selectedParteDetail.asistencia || {}).filter(a => a === 'Ausente').length}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center shadow-xs">
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-slate-500">Matrícula EF</span>
                      <span className="text-xl font-extrabold text-slate-700">
                        {Object.values(selectedParteDetail.asistencia || {}).filter(a => a === 'Presente' || a === 'Ausente').length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl text-center shadow-xs">
                    <span className="text-xs text-red-850 font-bold block">CLASE NO DICTADA</span>
                    <span className="text-[10px] text-red-700">La carga de asistencias individuales fue omitida.</span>
                  </div>
                )}

                {/* Tabla de Estudiantes */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-sm">
                  <table className={`w-full text-left border-collapse text-xs ${tableClass}`}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-3">Estudiante (Apellido, Nombre)</th>
                        <th className="py-2.5 px-2 text-slate-400 font-mono">DNI</th>
                        <th className="py-2.5 px-2 text-center w-28">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alumnos
                        .filter(al => al.cursoEF === selectedParteDetail.curso || (al.recursaCursos || []).includes(selectedParteDetail.curso) || Object.keys(selectedParteDetail.asistencia || {}).includes(al.dni))
                        .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' }))
                        .map(al => {
                          const state = selectedParteDetail.asistencia[al.dni] || '-';
                          const esExterno = al.cursoOrigen !== selectedParteDetail.curso;
                          return (
                            <tr key={al.dni} className="hover:bg-slate-50 text-slate-700 transition-colors">
                              <td data-label="Estudiante" className="py-2.5 px-3 font-semibold text-slate-800">
                                {al.nombre}
                                {esExterno && (
                                  <span className="ml-2 inline-block bg-yellow-50 text-yellow-750 border border-yellow-250 px-1.5 py-0.2 rounded text-[8px] font-bold">
                                    {al.cursoOrigen} (Externo)
                                  </span>
                                )}
                              </td>
                              <td data-label="DNI" className="py-2.5 px-2 font-mono text-slate-400">{al.dni}</td>
                              <td data-label="Estado" className="py-2.5 px-2 text-center">
                                {selectedParteDetail.huboClase === 'No' ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-400 border border-slate-200 line-through">
                                    S
                                  </span>
                                ) : state === 'Presente' ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-accent-50 text-accent-700 border border-accent-200">
                                    Presente
                                  </span>
                                ) : state === 'Ausente' ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                                    Ausente
                                  </span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-350 border border-slate-200">
                                    -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {alumnos.filter(al => al.cursoEF === selectedParteDetail.curso || (al.recursaCursos || []).includes(selectedParteDetail.curso) || Object.keys(selectedParteDetail.asistencia || {}).includes(al.dni)).length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-4 text-center text-slate-400 italic">
                            No hay alumnos registrados para este curso de Educación Física.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detalle Curricular Acordeón (Temas, Unidad, etc. - Contraído por defecto) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowModalCurricular(!showModalCurricular)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-all font-bold text-slate-700 text-xs uppercase tracking-wide cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-primary-500 animate-pulse-once" />
                    <span>Detalle Curricular (Temas, Unidad, Actividades, Obs.)</span>
                  </div>
                  {showModalCurricular ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showModalCurricular && (
                  <div className="p-4 border-t border-slate-200 space-y-4 bg-white text-left animate-fade-in text-xs">
                    {/* Clase N° y Unidad */}
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Clase N° y Unidad</span>
                        <span className="font-bold text-slate-700 font-mono text-xs">
                          Clase {selectedParteDetail.claseNum} • U. {selectedParteDetail.unidad}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Estado de Clase</span>
                        <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[10px] mt-0.5 ${selectedParteDetail.huboClase === 'Sí'
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
                        {selectedParteDetail.contenido || selectedParteDetail.temaAbordado || 'Sin cargar.'}
                      </div>
                    </div>

                    {/* Actividades que se desarrollan */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Actividades que se desarrollan:
                      </span>
                      <div className="bg-primary-500/5 border border-primary-500/10 p-4 rounded-2xl text-xs text-slate-800 font-sans leading-relaxed font-semibold">
                        {selectedParteDetail.actividades || '-'}
                      </div>
                    </div>

                    {/* Dinámica y Carácter */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Carácter de Clase</span>
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
                        Observaciones:
                      </span>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed italic">
                        {selectedParteDetail.observaciones || 'Sin observaciones registradas.'}
                      </div>
                    </div>
                  </div>
                )}
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
                onClick={() => { setSelectedParteDetail(null); setShowModalCurricular(false); }}
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
