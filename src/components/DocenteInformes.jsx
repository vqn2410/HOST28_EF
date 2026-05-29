import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { AlertOctagon, FileText, CheckCircle2, User, FileSignature } from 'lucide-react';

const DocenteInformes = () => {
  const { user } = useAuth();
  const { alumnos, informes, guardarInforme, cursosConfig } = useSchoolData();

  // Estados del Formulario
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [signedInforme, setSignedInforme] = useState(null);

  // Filtrar estudiantes elegibles que no estén ya seleccionados
  const estudiantesDisponibles = useMemo(() => {
    return estudiantesElegibles.filter(el => !selectedStudents.some(s => s.dni === el.dni));
  }, [estudiantesElegibles, selectedStudents]);

  // Computar dinámicamente los cursos asignados a este profesor desde la base de datos de administración
  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      (curso) => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  const estudiantesElegibles = useMemo(() => {
    return alumnos.filter(al => cursosAsignados.includes(al.cursoEF))
      .sort((a, b) => a.apellido.localeCompare(b.apellido));
  }, [alumnos, cursosAsignados]);

  const misInformes = useMemo(() => {
    return informes.filter(inf => inf.docenteNombre === `${user.nombre} ${user.apellido}`);
  }, [informes, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSignedInforme(null);

    if (selectedStudents.length === 0 || !titulo.trim() || !contenido.trim()) {
      setErrorMsg("Por favor, complete todos los campos obligatorios y agregue al menos un estudiante.");
      return;
    }

    // Firma Digital
    const firmaDigital = {
      apellido: user.apellido,
      nombre: user.nombre,
      cargo: "Prof. de Educación Física",
      correo: user.correo,
      fechaFirma: new Date().toISOString()
    };

    const nuevoInforme = {
      estudiantes: selectedStudents.map(est => ({
        dni: est.dni,
        nombre: `${est.apellido}, ${est.nombre}`
      })),
      estudianteDni: selectedStudents.map(est => est.dni).join(', '),
      estudianteNombre: selectedStudents.map(est => `${est.apellido}, ${est.nombre}`).join('; '),
      curso: selectedStudents[0]?.cursoEF || '',
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      docenteNombre: `${user.nombre} ${user.apellido}`,
      firmaDigital
    };

    guardarInforme(nuevoInforme);
    setSignedInforme(nuevoInforme);
    setSuccessMsg("¡Acta de Incidencia firmada y guardada con éxito!");

    setSelectedStudents([]);
    setTitulo('');
    setContenido('');

    setTimeout(() => {
      setSuccessMsg('');
      setSignedInforme(null);
    }, 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Formulario de Carga */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 shadow-lg relative bg-white">
          <div className="flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wider mb-6 font-display">
            <AlertOctagon size={16} />
            <span>Redactar Acta de Incidencia</span>
          </div>

          {successMsg && (
            <div className="mb-5 p-3.5 bg-accent-500/5 border border-accent-500/15 text-accent-700 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-accent-600 animate-bounce" />
              <div>
                <span className="font-bold block">{successMsg}</span>
                <span className="text-[10px] text-accent-600/80 font-normal">Sello de firma registrado.</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/5 border border-red-500/15 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertOctagon size={16} className="shrink-0 text-red-650" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Estudiantes Involucrados <span className="text-red-500">*</span>
              </label>
              <select
                value=""
                onChange={e => {
                  const student = estudiantesElegibles.find(s => s.dni === e.target.value);
                  if (student) {
                    setSelectedStudents(prev => [...prev, student]);
                  }
                }}
                className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3 py-2.5 text-xs text-slate-850 focus:outline-none transition-all cursor-pointer font-semibold"
              >
                <option value="">Seleccione estudiante para agregar...</option>
                {estudiantesDisponibles.map(el => (
                  <option key={el.dni} value={el.dni}>
                    {el.apellido}, {el.nombre} ({el.cursoEF} EF - {el.turno})
                  </option>
                ))}
              </select>

              {/* Listado de estudiantes agregados */}
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mt-2.5">
                  {selectedStudents.map(student => (
                    <span 
                      key={student.dni} 
                      className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-700 border border-primary-500/25 px-2.5 py-1 rounded-xl text-[10px] font-bold animate-pulse-once"
                    >
                      <span>{student.apellido}, {student.nombre}</span>
                      <button 
                        type="button" 
                        onClick={() => setSelectedStudents(prev => prev.filter(s => s.dni !== student.dni))}
                        className="text-primary-600 hover:text-red-650 transition-colors ml-1 font-bold text-xs select-none cursor-pointer"
                        title="Quitar"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Asunto / Título del Informe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Lesión durante práctica / Falta de conducta"
                className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-sans font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Detalles del Suceso / Acta <span className="text-red-500">*</span>
              </label>
              <textarea
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                placeholder="Escriba detalladamente el suceso, medidas tomadas y cualquier información de relevancia física o médica..."
                rows={5}
                className="w-full bg-white border border-slate-300 focus:border-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all leading-relaxed"
                required
              />
            </div>

            {/* Sello Firma digital */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600">
              <div className="flex items-center gap-1.5 text-primary-600 font-bold mb-1">
                <FileSignature size={12} />
                <span>Validación Digital de Identidad</span>
              </div>
              <p>Firmante: <strong className="text-slate-800">{user.nombre} {user.apellido}</strong> ({user.correo})</p>
              <p className="mt-0.5 text-[9px] text-slate-450 text-slate-500">Se aplicará la firma electrónica y la estampa de tiempo del sistema de inmediato.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <FileSignature size={14} />
              Guardar e Imprimir Firma
            </button>
          </form>
        </div>

        {/* JSON visualizador */}
        {signedInforme && (
          <div className="glass-panel p-4 rounded-2xl border border-accent-500/20 text-left animate-pulse-once bg-white shadow-sm">
            <span className="block text-[9px] uppercase font-bold text-accent-600 mb-2">JSON del Acta Firmada:</span>
            <pre className="text-[9px] font-mono text-slate-700 overflow-x-auto max-h-40 leading-tight">
              {JSON.stringify(signedInforme, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Historial de Informes */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Historial de Actas Redactadas</h3>
          <span className="text-[10px] bg-white border border-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded shadow-sm">
            {misInformes.length} Registros
          </span>
        </div>

        {misInformes.length === 0 ? (
          <div className="glass-card py-12 text-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <FileText className="mx-auto text-slate-400 mb-2" size={32} />
            <p className="text-slate-500 text-xs font-bold">Aún no has cargado actas o informes.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {misInformes.map(inf => (
              <div key={inf.id} className="glass-panel rounded-2xl border border-slate-200 p-5 relative overflow-hidden bg-white shadow-md">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[9px] font-bold text-primary-600 bg-primary-500/10 border border-primary-500/25 px-2 py-0.5 rounded">
                      Curso EF: {inf.curso}
                    </span>
                    <h4 className="text-sm font-bold text-slate-850 font-display mt-1.5 text-slate-800">{inf.titulo}</h4>
                  </div>
                  
                  {/* Sello de Firma */}
                  <div className="badge-signed px-2.5 py-1 rounded-xl text-[8px] font-mono text-accent-700 font-bold self-start sm:self-center">
                    <span className="block font-black">ACTA FIRMADA DIGITALMENTE</span>
                    <span className="text-[7px] text-slate-500">{new Date(inf.firmaDigital.fechaFirma).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans mb-3">
                  {inf.contenido}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                  <User size={12} className="text-slate-400 shrink-0" />
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
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DocenteInformes;
