import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { Filter, CheckCircle2, AlertCircle, FileText, Printer, Download } from 'lucide-react';

const DocenteLibroTemas = () => {
  const { user, usuarios } = useAuth();
  const { partes, firmarAutoridadParte, cursosConfig } = useSchoolData();

  // Estados de Filtro
  const [selectedCurso, setSelectedCurso] = useState('1°A');
  const [selectedMes, setSelectedMes] = useState('Todos');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const ALL_CURSOS = useMemo(() => [
    '1°1°', '1°2°', '1°3°',
    '2°1°', '2°2°', '2°3°',
    '3°1°', '3°2°',
    '4°1°', '4°2°',
    '5°1°', '5°2°',
    '6°1°', '6°2°'
  ], []);
  const MESES = [
    { value: "Todos", label: "Todos los Meses" },
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

  // Permisos de Cursos: computar dinámicamente según la asignación administrativa
  const cursosVisibles = useMemo(() => {
    if (user.rol === "Docente") {
      return Object.keys(cursosConfig).filter(
        (curso) => cursosConfig[curso].docenteDni === user.dni
      );
    }
    return ALL_CURSOS;
  }, [user, cursosConfig]);

  React.useEffect(() => {
    if (user.rol === "Docente" && !cursosVisibles.includes(selectedCurso)) {
      setSelectedCurso(cursosVisibles[0] || '1°A');
    }
  }, [cursosVisibles, selectedCurso, user]);

  // Filtrar partes
  const partesFiltrados = useMemo(() => {
    return partes
      .filter(parte => {
        const matchesCurso = parte.curso === selectedCurso;
        const matchesMes = selectedMes === 'Todos' || parte.fecha.split('-')[1] === selectedMes;
        return matchesCurso && matchesMes;
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }, [partes, selectedCurso, selectedMes]);

  // Firma Autoridad
  const handleFirmaAutoridad = (parteId) => {
    const firmaAutoridadObj = {
      apellido: user.apellido,
      nombre: user.nombre,
      cargo: user.rol === "Equipo de Conducción" ? "Directora" : "Autoridad",
      correo: user.correo,
      fechaFirma: new Date().toISOString()
    };
    firmarAutoridadParte(parteId, firmaAutoridadObj);
    setShowSuccessModal(true);
  };

  // Datos de encabezado
  const headerInfo = useMemo(() => {
    const config = cursosConfig[selectedCurso];
    const primerParte = partesFiltrados[0];

    // Buscar situación de revista del docente asignado al curso
    const docenteDni = config ? config.docenteDni : "333";
    const docenteObj = usuarios.find(u => u.dni === docenteDni);
    const situacion = docenteObj?.situacionRevista || "Titular";
    const docenteNombre = config ? config.docenteNombre : (primerParte ? primerParte.docenteNombre : "Roberto Fernández");

    // Obtener días del curso
    const diasArray = config ? config.dias : (selectedCurso.endsWith('1°') ? [1, 3] : [2, 4]);
    const diasLabel = diasArray.map(d =>
      d === 1 ? 'Lunes' : d === 2 ? 'Martes' : d === 3 ? 'Miércoles' : d === 4 ? 'Jueves' : 'Viernes'
    ).join(' y ');

    // Buscar preceptor asignado al curso en la lista de usuarios
    const preceptorObj = usuarios.find(
      u => u.rol === "Preceptor" && u.cursosAsignados?.includes(selectedCurso)
    );
    const preceptorNombre = preceptorObj 
      ? `${preceptorObj.nombre} ${preceptorObj.apellido}`
      : "Sin asignar";

    return {
      profesor: docenteNombre,
      situacion: situacion,
      preceptor: preceptorNombre,
      turno: config ? config.turno : (selectedCurso.endsWith('1°') ? 'Mañana' : 'Tarde'),
      horario: config ? config.horario : (selectedCurso.endsWith('1°') ? '08:00 - 09:30' : '13:30 - 15:00'),
      dias: diasLabel
    };
  }, [partesFiltrados, selectedCurso, cursosConfig, usuarios]);

  const descargarExcelLibroTemas = () => {
    // Generar cabeceras institucionales como filas preliminares para que se vea como el encabezado del folio en Excel!
    const headerRows = [
      ["E.E.S N° 28 - Gustavo Cerati", "", "", "Nivel: Secundario", "Orientación: Arte-Música"],
      ["Curso:", selectedCurso, "", "Turno:", headerInfo.turno],
      ["Asignatura:", "Educación Física", "", "Ciclo Lectivo:", "2026"],
      ["Días y Horarios:", headerInfo.dias, "", "Horario:", headerInfo.horario],
      ["Preceptor:", headerInfo.preceptor, "", "Docente:", `${headerInfo.profesor} (${headerInfo.situacion})`],
      [], // Fila vacía
    ];
    
    const tableHeaders = [
      "Día", "Mes", "Clase N°", "Unidad", "Carácter", 
      "Tema Abordado (Contenido)", "Actividades desarrolladas", 
      "Dinámica", "Firma Profesor", "Observaciones", "Firma Autoridad"
    ];
    
    const dataRows = partesFiltrados.map(p => {
      const fd = p.firmaDigital;
      const firmaProf = fd ? `${fd.apellido}, ${fd.nombre[0]}. (VERIFICADA ✔)` : "No firmado";
      
      const fa = p.firmaAutoridad;
      const firmaAut = fa ? `${fa.apellido}, ${fa.nombre[0]}. (APROBADO)` : "Pendiente";
      
      return [
        p.dia || p.fecha.split('-')[2],
        p.mes || 'Mayo',
        p.claseNum || '1',
        p.unidad || 'I',
        p.caracter || 'Práctica',
        p.contenido || '',
        p.actividades || '-',
        p.dinamica || 'Grupal',
        firmaProf,
        p.observaciones || 'Sin observaciones.',
        firmaAut
      ];
    });
    
    const allRows = [
      ...headerRows,
      tableHeaders,
      ...dataRows
    ];
    
    const csvContent = "\uFEFF" + 
      allRows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const filename = `libro_de_temas_${selectedCurso}_${selectedMes}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-display mb-1">Visualización Oficial del Libro de Temas</h2>
          <p className="text-slate-500 text-xs">Planilla oficial integrada que replica la estructura del documento físico escolar.</p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={descargarExcelLibroTemas}
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Descargar Libro de Temas (Excel)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Printer size={14} />
            <span>Imprimir Folio Oficial</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros Light */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between bg-white">
        <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wider">
          <Filter size={14} />
          <span>Filtro de Folio:</span>
        </div>
        <div className="flex flex-wrap gap-3 grow max-w-xl justify-end">
          <div>
            <select
              value={selectedCurso}
              onChange={e => setSelectedCurso(e.target.value)}
              className="bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-1.5 text-xs text-slate-850 focus:outline-none transition-all w-32 font-bold cursor-pointer"
            >
              {cursosVisibles.map(c => <option key={c} value={c}>Curso {c}</option>)}
            </select>
          </div>

          <div>
            <select
              value={selectedMes}
              onChange={e => setSelectedMes(e.target.value)}
              className="bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-1.5 text-xs text-slate-850 focus:outline-none transition-all w-36 cursor-pointer"
            >
              {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* REPLICA VISUAL DEL LIBRO DE TEMAS */}
      <div className="bg-white text-slate-950 p-6 md:p-8 rounded-3xl shadow-lg overflow-x-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none libro-temas-print-area">
        <div className="min-w-[1000px] space-y-6">

          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-wide uppercase font-serif border-b-2 border-slate-900 pb-1 inline-block text-slate-950">
              Libro de Temas
            </h1>
          </div>

          {/* Encabezado del Folio adaptado a E.E.S N° 28 - "Gustavo Cerati" */}
          <table className="w-full border-collapse border border-slate-900 text-[10px] font-sans text-slate-900">
            <tbody>
              <tr>
                <td className="border border-slate-900 p-2.5 font-extrabold w-[35%] text-[11px] text-slate-950">
                  E.E.S N° 28 - "Gustavo Cerati"
                </td>
                <td className="border border-slate-900 p-2 w-[15%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">SEDE</span>
                </td>
                <td className="border border-slate-900 p-2 w-[15%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Nivel:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">Secundario</span>
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Orientación:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">Arte-Música</span>
                </td>
                <td className="border border-slate-900 p-2 w-[15%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Curso:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">{selectedCurso}</span>
                </td>
                <td className="border border-slate-900 p-2 w-[20%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Turno:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">{headerInfo.turno}</span>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2 w-[35%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Asignatura:</span>
                  <span className="font-extrabold text-[11px] text-slate-950">Educación Física</span>
                </td>
                <td className="border border-slate-900 p-2 w-[15%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Ciclo Lectivo:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">2026</span>
                </td>
                <td className="border border-slate-900 p-2 w-[30%]" colSpan={2}>
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Días y Horarios:</span>
                  <span className="font-extrabold text-[10px] font-mono text-slate-950">{headerInfo.dias} • {headerInfo.horario}</span>
                </td>
                <td className="border border-slate-900 p-2 w-[20%]">
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Preceptor:</span>
                  <span className="font-extrabold text-[10px] text-slate-950">{headerInfo.preceptor}</span>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 p-2" colSpan={5}>
                  <span className="font-bold block text-[8px] text-slate-500 uppercase">Docente a Cargo (Situación de Revista):</span>
                  <span className="font-extrabold text-[11px] text-slate-950">Prof. {headerInfo.profesor} ({headerInfo.situacion})</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabla de Registros */}
          {partesFiltrados.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50">
              <FileText className="mx-auto text-slate-400 mb-2" size={36} />
              <p className="text-slate-600 font-bold text-sm">No hay registros de clases cargados en el Folio {selectedCurso} para el mes seleccionado.</p>
              <p className="text-slate-450 text-slate-500 text-xs mt-1">Los docentes deben firmar un parte diario en esta sección para poblar el libro.</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-slate-900 text-[10px] font-sans text-slate-900">
              <thead>
                <tr className="bg-slate-100 text-center font-bold text-[9px] border-b border-slate-900 uppercase">
                  <th className="border border-slate-900 py-2.5 px-1.5 w-[4%]">Día</th>
                  <th className="border border-slate-900 py-2.5 px-1.5 w-[6%]">Mes</th>
                  <th className="border border-slate-900 py-2.5 px-1.5 w-[4%]">Clase N°</th>
                  <th className="border border-slate-900 py-2.5 px-1.5 w-[4%]">Unidad</th>
                  <th className="border border-slate-900 py-2.5 px-2 w-[8%]">Carácter</th>
                  <th className="border border-slate-900 py-2.5 px-3 w-[18%] text-left">Tema Abordado (Contenido)</th>
                  <th className="border border-slate-900 py-2.5 px-3 w-[18%] text-left">Actividades que se desarrollan</th>
                  <th className="border border-slate-900 py-2.5 px-2 w-[8%] text-left">Dinámica</th>
                  <th className="border border-slate-900 py-2.5 px-2 w-[10%]">Firma del Profesor</th>
                  <th className="border border-slate-900 py-2.5 px-2 w-[10%] text-left">Observaciones</th>
                  <th className="border border-slate-900 py-2.5 px-2 w-[10%]">Firma Autoridad</th>
                </tr>
              </thead>
              <tbody>
                {partesFiltrados.map((parte) => (
                  <tr key={parte.id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="border border-slate-900 py-3 px-1 text-center font-mono font-bold text-[10px] text-slate-950">
                      {parte.dia || parte.fecha.split('-')[2]}
                    </td>
                    <td className="border border-slate-900 py-3 px-1 text-center font-bold text-slate-900">
                      {parte.mes || 'Mayo'}
                    </td>
                    <td className="border border-slate-900 py-3 px-1 text-center font-mono font-bold text-slate-900">
                      {parte.claseNum || '1'}
                    </td>
                    <td className="border border-slate-900 py-3 px-1 text-center font-mono font-bold text-slate-900">
                      {parte.unidad || 'I'}
                    </td>
                    <td className="border border-slate-900 py-3 px-2 text-center text-[9px] font-bold text-slate-700">
                      {parte.caracter || 'Práctica'}
                    </td>
                    <td className="border border-slate-900 py-3 px-3 text-left leading-relaxed text-slate-950 text-[10px] font-sans font-bold">
                      {parte.contenido}
                    </td>
                    <td className="border border-slate-900 py-3 px-3 text-left leading-relaxed text-slate-850 text-[10px] font-sans font-semibold">
                      {parte.actividades || '-'}
                    </td>
                    <td className="border border-slate-900 py-3 px-2 text-left text-[9px] text-slate-800 font-bold leading-normal">
                      {parte.dinamica || 'Grupal'}
                    </td>
                    <td className="border border-slate-900 py-2 px-1 text-center">
                      <div className="bg-accent-50 border border-accent-300 rounded p-1 text-[8px] font-mono text-accent-850 font-bold leading-tight">
                        <span className="block font-black text-accent-700">VERIFICADA ✔</span>
                        <span>{parte.firmaDigital.apellido}, {parte.firmaDigital.nombre[0]}.</span>
                      </div>
                    </td>
                    <td className="border border-slate-900 py-3 px-2 text-left text-[9px] text-slate-700 font-bold leading-normal italic">
                      {parte.observaciones || 'Sin observaciones.'}
                    </td>
                    <td className="border border-slate-900 py-2 px-1 text-center">
                      {parte.firmaAutoridad ? (
                        <div className="bg-primary-50 border border-primary-200 rounded p-1 text-[7px] font-mono text-primary-850 font-bold leading-tight">
                          <span className="block font-black text-primary-700">APROBADO</span>
                          <span>{parte.firmaAutoridad.apellido}, {parte.firmaAutoridad.nombre[0]}.</span>
                          <span className="block text-[6px] text-slate-450 mt-0.5 font-semibold">
                            {new Date(parte.firmaAutoridad.fechaFirma).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      ) : (
                        user.rol === "Equipo de Conducción" ? (
                          <button
                            type="button"
                            onClick={() => handleFirmaAutoridad(parte.id)}
                            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-[8px] uppercase px-1.5 py-1 rounded border border-primary-700 hover:border-primary-600 shadow-sm active:scale-95 transition-all w-full cursor-pointer"
                          >
                            Firmar Folio
                          </button>
                        ) : (
                          <span className="inline-block bg-slate-100 text-slate-400 text-[8px] font-bold px-1.5 py-1.5 rounded w-full">
                            Pendiente
                          </span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* Guía */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-slate-500 shadow-sm">
        <AlertCircle className="text-primary-500 shrink-0 mt-0.5" size={16} />
        <div>
          <span className="font-bold block text-slate-800 uppercase tracking-wide text-[10px]">Firma de Autoridad - E.E.S N° 28:</span>
          <p className="mt-0.5 leading-relaxed">
            Como autoridad del Equipo de Conducción, puedes estampar tu firma de folio digital en el casillero correspondiente del Libro de Temas de **E.E.S N° 28 - "Gustavo Cerati"** para autorizar la validez pedagógica de la clase.
          </p>
        </div>
      </div>
      {/* MODAL ÉXITO AL FIRMAR FOLIO */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 relative overflow-hidden animate-zoom-in text-center animate-fade-in">
            {/* Glowing background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-xl -mr-6 -mt-6"></div>

            {/* Check/Success Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-accent-50 border border-accent-200 flex items-center justify-center text-accent-600 mb-4 shadow-sm">
              <CheckCircle2 size={32} className="animate-pulse" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 font-display">
              Parte visado con éxito
            </h3>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-semibold text-center">
              La firma digital de la autoridad ha sido convalidada y estampada con éxito en el Libro de Temas.
            </p>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-accent-500/10 cursor-pointer active:scale-95 uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteLibroTemas;
