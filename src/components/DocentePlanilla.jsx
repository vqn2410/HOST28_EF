import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { Filter, BarChart3, AlertCircle, Clock, FileSignature, Table2, LayoutList } from 'lucide-react';

const esFechaNoLectiva = (fecha, feriados) => feriados.some((feriado) =>
  feriado.fecha === fecha ||
  (feriado.tipo === 'RECESO_INVIERNO' && fecha >= feriado.fechaInicio && fecha <= feriado.fechaFin)
);

const DocentePlanilla = () => {
  const { 
    alumnos, 
    partes, 
    cursosConfig,
    feriados = []
  } = useSchoolData();
  const { user } = useAuth();

  // Computar cursos asignados dinámicamente al docente
  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      (curso) => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  // Estados de Filtro
  const [selectedMes, setSelectedMes] = useState(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const mesesEscolares = ["03", "04", "05", "06", "07", "08", "09", "10", "11"];
    return mesesEscolares.includes(currentMonth) ? currentMonth : "05";
  });
  const [selectedCurso, setSelectedCurso] = useState(() => {
    return cursosAsignados.length > 0 ? cursosAsignados[0] : "";
  });
  const [selectedTurno, setSelectedTurno] = useState(() => {
    const defaultCurso = cursosAsignados.length > 0 ? cursosAsignados[0] : "";
    if (!defaultCurso) return 'Mañana';
    // Turno EF es el contrario al del colegio
    const schoolTurno = defaultCurso.endsWith('1°') ? 'Mañana' : 'Tarde';
    return schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana';
  });

  // Vista de la planilla: apilada (tarjetas por estudiante) o lista completa (tabla ancha con scroll horizontal).
  // El botón se muestra solo en mobile; se adapta automáticamente al ancho de pantalla.
  const [vistaCompleta, setVistaCompleta] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const tableClass = vistaCompleta ? '' : 'table-stack table-stack-all';

  useEffect(() => {
    const onResize = () => setVistaCompleta(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Corregir curso seleccionado si cambia la lista
  React.useEffect(() => {
    if (cursosAsignados.length > 0 && !cursosAsignados.includes(selectedCurso)) {
      const firstCurso = cursosAsignados[0];
      setSelectedCurso(firstCurso);
      const schoolTurno = firstCurso.endsWith('1°') ? 'Mañana' : 'Tarde';
      setSelectedTurno(schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana');
    }
  }, [cursosAsignados, selectedCurso]);

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

  // Regla de días de clase de EF
  const claseDiasSemana = useMemo(() => {
    if (!selectedCurso) return [];
    const config = cursosConfig[selectedCurso];
    // EF es el turno contrario
    return config ? config.dias : (selectedCurso.endsWith('1°') ? [2, 4] : [1, 3]);
  }, [cursosConfig, selectedCurso]);

  // Calcular todos los días del mes seleccionado en los que hay clase de EF (para el año 2026)
  const diasClaseMes = useMemo(() => {
    if (!selectedCurso) return [];
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
  }, [selectedMes, selectedCurso, claseDiasSemana, feriados]);

  // Calcular clases suspendidas en el mes para el curso seleccionado
  const clasesSuspendidas = useMemo(() => {
    if (!selectedCurso) return [];
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
    if (!selectedCurso) return [];
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
    if (!selectedCurso) return [];
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
    if (!selectedCurso) return [];
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

  // Obtener estado de asistencia histórico para un alumno
  const getAsistenciaEstado = (alumnoDni, fechaStr) => {
    const parte = partes.find(p => p.fecha === fechaStr && p.curso === selectedCurso);
    if (!parte || parte.huboClase === 'No') return '-';
    return parte.asistencia[alumnoDni] || '-';
  };

  // Calcular estadísticas acumuladas por alumno
  const calcularEstadisticasAlumno = (alumnoDni) => {
    let totales = 0;
    let presentes = 0;
    let ausentes = 0;

    diasClaseMes.forEach(d => {
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

  // Calcular estadísticas acumuladas por alumno reasignado
  const calcularEstadisticasAlumnoReasignado = (alumno) => {
    const cursoEF = alumno.cursoEF;
    const config = cursosConfig[cursoEF];
    const diasSemana = config ? config.dias : (cursoEF.endsWith('1°') ? [2, 4] : [1, 3]);

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

  if (cursosAsignados.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50">
        <AlertCircle size={40} className="mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-700">Sin Cursos Asignados</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Actualmente no cuenta con divisiones asignadas. Por favor, comuníquese con el Equipo de Conducción.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Botones de Selección de Cursos Asignados */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md bg-white space-y-4">
        <div className="flex items-center gap-2 text-primary-500 font-extrabold text-sm uppercase tracking-wide">
          <FileSignature size={18} />
          <span>Mis Cursos Asignados:</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {cursosAsignados.map(c => {
            const isSelected = selectedCurso === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setSelectedCurso(c);
                  const schoolTurno = c.endsWith('1°') ? 'Mañana' : 'Tarde';
                  setSelectedTurno(schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana');
                }}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs border cursor-pointer active:scale-95 ${
                  isSelected
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

      {/* Barra de Filtros Premium */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md flex flex-wrap items-center gap-5 justify-between bg-white">
        <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wide">
          <Filter size={18} />
          <span>Filtros de Consulta:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 grow max-w-xl">
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Turno EF</label>
            <select
              value={selectedTurno}
              disabled
              className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-not-allowed font-medium"
            >
              <option value="Mañana">Mañana (Lun y Mié)</option>
<option value="Tarde">Tarde (Mar y Jue)</option>
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

      {/* Grilla 1 - Alumnos Regulares + Externos */}
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
            <p className="text-sm font-bold text-slate-500">No hay alumnos registrados para este curso.</p>
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
                        className={`py-3 px-1.5 text-center font-mono font-bold select-none min-w-[50px] ${
                          noHuboClase ? 'bg-red-50 text-red-700 border-x border-red-200' : 'text-slate-500'
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
                          <span className="ml-2 inline-block bg-yellow-50 text-yellow-750 border border-yellow-255 px-1.5 py-0.5 rounded text-[9px] font-bold">
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
                            className={`py-3 px-1.5 text-center font-bold ${
                              noHuboClase ? 'bg-red-50/50 border-x border-red-100' : ''
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
                      <td data-label="% Asist." className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${
                        stats.porcentaje >= 80 ? "text-accent-600" :
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
            <p className="text-xs text-slate-500 mt-0.5">Alumnos pertenecientes originalmente a {selectedCurso} pero que realizan EF en una división diferente.</p>
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
                      const dayNum = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${selectedMes}-${dayNum}`;
                      if (diasSemana.includes(dayOfWeek) && !esFechaNoLectiva(dateStr, feriados)) {
                        dias.push({
                          dateStr,
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
                      <td data-label="DNI" className="py-3 px-2 text-slate-400 font-mono">{al.dni}</td>
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
                              className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                                det.state === 'Presente' ? 'bg-accent-50 text-accent-700 border-accent-200' :
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
                      <td data-label="% Asist." className={`py-3 px-3 text-right bg-slate-50 font-extrabold ${
                        stats.porcentaje >= 80 ? "text-accent-600" :
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
              <span className="text-slate-850">Grilla 3: Alumnos Exceptuados (No cursan EF)</span>
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
                    <td data-label="Estudiante" className="py-3 px-3 font-bold text-slate-855 line-through text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{al.nombre}</td>
                    <td data-label="DNI" className="py-3 px-2 font-mono text-slate-400">{al.dni}</td>
                    <td data-label="Estado" className="py-3 px-3">
                      <span className="inline-block bg-red-50 text-red-700 border border-red-250 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        Exceptuado / No cursa
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
  );
};

export default DocentePlanilla;
