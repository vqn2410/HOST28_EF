import React, { useState, useMemo } from 'react';
import { useSchoolData } from '../context/SchoolDataContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp, CalendarRange, Download, Award, AlertCircle } from 'lucide-react';

const DEFAULT_CURSOS = [
  '1°1°', '1°2°', '1°3°',
  '2°1°', '2°2°', '2°3°',
  '3°1°', '3°2°',
  '4°1°', '4°2°',
  '5°1°', '5°2°',
  '6°1°', '6°2°'
];

const esFechaNoLectiva = (fecha, feriados) => feriados.some((feriado) =>
  feriado.fecha === fecha ||
  (feriado.tipo === 'RECESO_INVIERNO' && fecha >= feriado.fechaInicio && fecha <= feriado.fechaFin)
);

const MESES = [
  { value: "03", label: "Mar" },
  { value: "04", label: "Abr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Ago" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
];

const MESES_LARGOS = {
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre"
};

const colorPorMedia = (media) => {
  if (media === null || media === undefined) return 'text-slate-400';
  if (media >= 80) return 'text-accent-600';
  if (media >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const barColorClass = (media) => {
  if (media >= 80) return 'bg-accent-500/80 border-accent-400';
  if (media >= 60) return 'bg-yellow-500/80 border-yellow-400';
  return 'bg-red-500/80 border-red-400';
};

const computeCursoMonthStats = (curso, mes, { alumnos, partes, cursosConfig, feriados }) => {
  const config = cursosConfig[curso];
  const diasSemana = config?.dias || (curso.endsWith('1°') ? [2, 4] : [1, 3]);
  const alumnosCurso = alumnos.filter(al => (al.cursoEF === curso || (al.recursaCursos || []).includes(curso)) && !al.noCursaEF);

  const year = 2026;
  const monthIndex = parseInt(mes) - 1;
  const dias = [];
  const date = new Date(year, monthIndex, 1);

  while (date.getMonth() === monthIndex) {
    const dayOfWeek = date.getDay();
    const dateStr = `${year}-${mes}-${String(date.getDate()).padStart(2, '0')}`;
    if (diasSemana.includes(dayOfWeek) && !esFechaNoLectiva(dateStr, feriados)) {
      dias.push(dateStr);
    }
    date.setDate(date.getDate() + 1);
  }

  let totales = 0;
  let presentes = 0;
  let clasesComputadas = 0;

  dias.forEach(dateStr => {
    const parte = partes.find(p => p.fecha === dateStr && p.curso === curso);
    if (!parte || parte.huboClase === 'No') return;
    clasesComputadas++;

    const asistencia = parte.asistencia || {};
    alumnosCurso.forEach(al => {
      const state = asistencia[al.dni];
      if (state === 'Presente') {
        totales++;
        presentes++;
      } else if (state === 'Ausente') {
        totales++;
      }
    });
  });

  const alumnosConDatos = alumnosCurso.filter(al => {
    return dias.some(dateStr => {
      const parte = partes.find(p => p.fecha === dateStr && p.curso === curso);
      if (!parte || parte.huboClase === 'No') return false;
      const st = (parte.asistencia || {})[al.dni];
      return st === 'Presente' || st === 'Ausente';
    });
  }).length;

  const media = totales > 0 ? Math.round((presentes / totales) * 100) : null;

  return {
    mes,
    label: MESES_LARGOS[mes],
    media,
    presentes,
    totales,
    clasesComputadas,
    alumnosConDatos,
    estudiantesEquivalentes: media !== null ? Math.round((media / 100) * alumnosConDatos) : null
  };
};

const BarChartMensual = ({ data }) => {
  const maxBar = 150;
  return (
    <div className="flex items-end gap-2 sm:gap-3 mt-4 px-2">
      {data.map(d => {
        const hasValue = d.media !== null;
        const barHeight = hasValue ? Math.max((d.media / 100) * maxBar, 6) : 6;
        return (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-extrabold font-mono ${colorPorMedia(d.media)}`}>
              {hasValue ? `${d.media}%` : '·'}
            </span>
            <div
              title={hasValue
                ? `${MESES_LARGOS[d.mes]}: media ${d.media}% (≈ ${d.estudiantesEquivalentes} de ${d.alumnosConDatos} estudiantes)`
                : `${MESES_LARGOS[d.mes]}: sin datos registrados`}
              className={`w-full max-w-12 rounded-t-lg border ${hasValue ? barColorClass(d.media) : 'bg-slate-100 border-slate-200'}`}
              style={{ height: `${barHeight}px` }}
            />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const BarChartCursos = ({ data }) => (
  <div className="space-y-3 mt-4">
    {data.map(d => (
      <div key={d.curso} className="flex items-center gap-3">
        <span className="w-12 text-[10px] font-extrabold text-slate-700 uppercase truncate shrink-0">
          Curso {d.curso}
        </span>
        <div className="flex-1 bg-slate-100 rounded-full h-5 relative overflow-hidden">
          <div
            className={`h-full rounded-full ${d.media === null ? 'bg-slate-300' : barColorClass(d.media)}`}
            style={{ width: `${Math.max(d.media ?? 0, 2)}%` }}
          />
        </div>
        <span className={`w-10 text-[10px] font-extrabold font-mono text-right shrink-0 ${colorPorMedia(d.media)}`}>
          {d.media !== null ? `${d.media}%` : '·'}
        </span>
      </div>
    ))}
  </div>
);

const ReportesTab = ({ cursos: cursosProp = [] }) => {
  const { alumnos, partes, cursosConfig, feriados = [] } = useSchoolData();
  const { user } = useAuth();

  // Cursos según el rol del usuario (si no se pasa la lista como prop)
  const cursos = useMemo(() => {
    if (cursosProp.length > 0) return cursosProp;
    if (!user) return [];
    if (user.rol === "Preceptor" && user.cursosAsignados && user.cursosAsignados.length > 0) {
      return user.cursosAsignados;
    }
    if (user.rol === "Docente") {
      return Object.keys(cursosConfig).filter(
        curso => cursosConfig[curso].docenteDni === user.dni
      );
    }
    return DEFAULT_CURSOS;
  }, [cursosProp, user, cursosConfig]);

  const [selectedCurso, setSelectedCurso] = useState(() => cursos[0] || "");
  const [selectedMesComparativo, setSelectedMesComparativo] = useState(() => {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    return MESES.some(m => m.value === currentMonth) ? currentMonth : "05";
  });

  const dataCtx = { alumnos, partes, cursosConfig, feriados };

  React.useEffect(() => {
    if (cursos.length > 0 && !cursos.includes(selectedCurso)) {
      setSelectedCurso(cursos[0]);
    }
  }, [cursos, selectedCurso]);

  // Estadísticas mensuales del curso seleccionado (Marzo a Noviembre)
  const statsMensuales = useMemo(() => {
    if (!selectedCurso) return [];
    return MESES.map(m => computeCursoMonthStats(selectedCurso, m.value, dataCtx));
  }, [selectedCurso, alumnos, partes, cursosConfig, feriados]);

  // Resumen anual del curso seleccionado
  const resumenAnual = useMemo(() => {
    const conDatos = statsMensuales.filter(s => s.totales > 0);
    const totales = conDatos.reduce((acc, s) => acc + s.totales, 0);
    const presentes = conDatos.reduce((acc, s) => acc + s.presentes, 0);
    const media = totales > 0 ? Math.round((presentes / totales) * 100) : null;
    const alumnosConDatos = Math.max(...conDatos.map(s => s.alumnosConDatos), 0);

    return {
      media,
      totales,
      presentes,
      conDatos: alumnosConDatos,
      mesesConDatos: conDatos.length,
      estudiantesEquivalentes: media !== null ? Math.round((media / 100) * alumnosConDatos) : null
    };
  }, [statsMensuales]);

  // Estadísticas anuales por curso (comparativo)
  const statsAnualesCursos = useMemo(() => {
    return cursos.map(c => {
      const meses = MESES.map(m => computeCursoMonthStats(c, m.value, dataCtx));
      const conDatos = meses.filter(s => s.totales > 0);
      const totales = conDatos.reduce((acc, s) => acc + s.totales, 0);
      const presentes = conDatos.reduce((acc, s) => acc + s.presentes, 0);
      return {
        curso: c,
        media: totales > 0 ? Math.round((presentes / totales) * 100) : null,
        presentes,
        totales,
        mesesConDatos: conDatos.length
      };
    });
  }, [cursos, alumnos, partes, cursosConfig, feriados]);

  // Estadísticas del mes seleccionado por curso (comparativo)
  const statsMesComparativo = useMemo(() => {
    return cursos.map(c => {
      const s = computeCursoMonthStats(c, selectedMesComparativo, dataCtx);
      return { curso: c, media: s.media, alumnosConDatos: s.alumnosConDatos, totales: s.totales, presentes: s.presentes };
    });
  }, [cursos, selectedMesComparativo, alumnos, partes, cursosConfig, feriados]);

  const mejorCurso = useMemo(() => {
    const conDatos = statsAnualesCursos.filter(c => c.media !== null);
    if (conDatos.length === 0) return null;
    return conDatos.reduce((best, c) => (c.media > best.media ? c : best));
  }, [statsAnualesCursos]);

  const peorCurso = useMemo(() => {
    const conDatos = statsAnualesCursos.filter(c => c.media !== null);
    if (conDatos.length === 0) return null;
    return conDatos.reduce((worst, c) => (c.media < worst.media ? c : worst));
  }, [statsAnualesCursos]);

  const descargarReporteCSV = () => {
    if (!selectedCurso) return;

    const headers = ["Mes", "Clases Computadas", "Alumnos con Datos", "Presentes", "Registros", "Media %", "Est. Equivalentes"];
    const rows = statsMensuales.map(s => [
      s.label,
      s.clasesComputadas,
      s.alumnosConDatos,
      s.presentes,
      s.totales,
      s.media !== null ? s.media : "Sin datos",
      s.estudiantesEquivalentes !== null ? s.estudiantesEquivalentes : "-"
    ]);

    const csvContent = "\uFEFF" +
      [["Reporte de Asistencia - Curso " + selectedCurso + " - Ciclo 2026", ""],
        headers,
        ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_asistencia_curso_${selectedCurso.replace(/°/g, '').replace(/ /g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cursos.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-slate-300 rounded-3xl bg-slate-50">
        <AlertCircle size={40} className="mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-700">Sin cursos disponibles</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No se encontraron divisiones para generar reportes. Verifique la configuración de cursos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-gradient-to-br from-primary-500/5 via-white to-accent-500/5 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary-500 text-white shadow-md">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 font-display">Reportes de Asistencia por Curso</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5 max-w-xl">
                Gráficas mensuales de asistencia media por curso. No se computan feriados, clases suspendidas ni inasistencias docentes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={descargarReporteCSV}
            className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Download size={14} />
            Descargar CSV
          </button>
        </div>
      </div>

      {/* Resumen anual */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white text-center">
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Media Anual</span>
          <span className={`block text-3xl font-extrabold font-mono mt-1 ${colorPorMedia(resumenAnual.media)}`}>
            {resumenAnual.media !== null ? `${resumenAnual.media}%` : '·'}
          </span>
          {resumenAnual.estudiantesEquivalentes !== null && (
            <span className="block text-[9px] font-bold text-slate-500 mt-0.5">
              ≈ {resumenAnual.estudiantesEquivalentes} de {resumenAnual.conDatos} estudiantes
            </span>
          )}
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white text-center">
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Meses con Datos</span>
          <span className="block text-3xl font-extrabold font-mono text-slate-800 mt-1">{resumenAnual.mesesConDatos}/9</span>
          <span className="block text-[9px] font-bold text-slate-500 mt-0.5">Marzo - Noviembre</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white text-center">
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Clases Computadas</span>
          <span className="block text-3xl font-extrabold font-mono text-slate-800 mt-1">
            {statsMensuales.reduce((a, s) => a + s.clasesComputadas, 0)}
          </span>
          <span className="block text-[9px] font-bold text-slate-500 mt-0.5">Con parte firmado</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white text-center">
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Presentes</span>
          <span className="block text-3xl font-extrabold font-mono text-accent-600 mt-1">{resumenAnual.presentes}</span>
          <span className="block text-[9px] font-bold text-slate-500 mt-0.5">Acumulado anual</span>
        </div>
        <div className="glass-panel rounded-2xl p-4 border border-slate-200 shadow-md bg-white text-center">
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Registros Totales</span>
          <span className="block text-3xl font-extrabold font-mono text-slate-800 mt-1">{resumenAnual.totales}</span>
          <span className="block text-[9px] font-bold text-slate-500 mt-0.5">Presentes + Ausentes</span>
        </div>
      </div>

      {/* Selector de curso */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-200 shadow-md bg-white space-y-4">
        <div className="flex items-center gap-2 text-primary-500 font-extrabold text-sm uppercase tracking-wide">
          <TrendingUp size={18} />
          <span>Reportes por Curso:</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {cursos.map(c => {
            const isSelected = selectedCurso === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCurso(c)}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xs border cursor-pointer active:scale-95 ${
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

      {/* Gráfica mensual del curso seleccionado */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span className="text-primary-500"><BarChart3 size={18} /></span>
              Asistencia Media Mensual - Curso {selectedCurso}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evolución de la asistencia media a lo largo del ciclo lectivo 2026.
            </p>
          </div>
        </div>

        <BarChartMensual data={statsMensuales} />

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-bold uppercase">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-accent-500/80 inline-block" /> ≥ 80%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500/80 inline-block" /> 60% - 79%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/80 inline-block" /> &lt; 60%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Sin datos</span>
        </div>
      </div>

      {/* Tabla mensual detallada */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
        <h3 className="text-lg font-bold text-slate-900 font-display mb-4 flex items-center gap-2">
          <span className="text-primary-500"><CalendarRange size={18} /></span>
          Detalle Mensual - Curso {selectedCurso}
        </h3>
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse text-xs table-stack">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-650 font-bold uppercase">
                <th className="py-3 px-3">Mes</th>
                <th className="py-3 px-3 text-center">Clases Computadas</th>
                <th className="py-3 px-3 text-center">Alumnos con Datos</th>
                <th className="py-3 px-3 text-center">Presentes</th>
                <th className="py-3 px-3 text-center">Registros</th>
                <th className="py-3 px-3 text-right">Media</th>
                <th className="py-3 px-3 text-center">Est. Equivalentes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {statsMensuales.map(s => (
                <tr key={s.mes} className="hover:bg-slate-50 text-slate-700 transition-colors">
                  <td data-label="Mes" className="py-3 px-3 font-bold text-slate-800">{s.label}</td>
                  <td data-label="Clases Computadas" className="py-3 px-3 text-center font-mono text-slate-600">{s.clasesComputadas}</td>
                  <td data-label="Alumnos con Datos" className="py-3 px-3 text-center font-mono text-slate-600">{s.alumnosConDatos}</td>
                  <td data-label="Presentes" className="py-3 px-3 text-center font-bold text-accent-600">{s.presentes}</td>
                  <td data-label="Registros" className="py-3 px-3 text-center font-mono text-slate-600">{s.totales}</td>
                  <td data-label="Media" className={`py-3 px-3 text-right font-extrabold ${colorPorMedia(s.media)}`}>
                    {s.media !== null ? `${s.media}%` : 'Sin datos'}
                  </td>
                  <td data-label="Est. Equivalentes" className="py-3 px-3 text-center font-bold text-slate-600">
                    {s.estudiantesEquivalentes !== null ? `≈ ${s.estudiantesEquivalentes} de ${s.alumnosConDatos}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-extrabold">
                <td colSpan={5} className="py-3 px-3 font-bold text-slate-700 uppercase tracking-wide text-[11px]">
                  Media Anual del Curso {selectedCurso}
                </td>
                <td className={`py-3 px-3 text-right font-extrabold ${colorPorMedia(resumenAnual.media)}`}>
                  {resumenAnual.media !== null ? `${resumenAnual.media}%` : 'Sin datos'}
                </td>
                <td className="py-3 px-3 text-center font-bold text-slate-700">
                  {resumenAnual.estudiantesEquivalentes !== null
                    ? `≈ ${resumenAnual.estudiantesEquivalentes} de ${resumenAnual.conDatos}`
                    : '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Comparativo entre cursos */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span className="text-primary-500"><Award size={18} /></span>
              Comparativo entre Cursos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Media de asistencia por curso, anual y por mes seleccionado.
            </p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mes Comparativo</label>
            <select
              value={selectedMesComparativo}
              onChange={e => setSelectedMesComparativo(e.target.value)}
              className="bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none transition-all cursor-pointer font-semibold"
            >
              {MESES.map(m => <option key={m.value} value={m.value}>{MESES_LARGOS[m.value]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-primary-500" />
              Media Anual por Curso
            </h4>
            <BarChartCursos data={statsAnualesCursos} />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <CalendarRange size={13} className="text-primary-500" />
              Media por Curso - {MESES_LARGOS[selectedMesComparativo]}
            </h4>
            <BarChartCursos data={statsMesComparativo} />
          </div>
        </div>

        {(mejorCurso || peorCurso) && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mejorCurso && (
              <div className="bg-accent-50 border border-accent-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-500 text-white shadow-md shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-accent-700 uppercase tracking-wider">Curso con Mejor Asistencia Media Anual</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    Curso {mejorCurso.curso}: {mejorCurso.media}% ({mejorCurso.mesesConDatos} meses con datos)
                  </span>
                </div>
              </div>
            )}
            {peorCurso && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500 text-white shadow-md shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-red-700 uppercase tracking-wider">Curso con Menor Asistencia Media Anual</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    Curso {peorCurso.curso}: {peorCurso.media}% ({peorCurso.mesesConDatos} meses con datos)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesTab;