import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchoolData } from '../context/SchoolDataContext';
import { Check, X, FileSignature, CheckCircle2, ChevronRight, AlertCircle, AlertOctagon, Bell, Calendar } from 'lucide-react';

const DocenteAsistencia = () => {
  const { user } = useAuth();
  const { alumnos, guardarParteEF, cursosConfig, solicitudesFaltantes } = useSchoolData();

  // Estados del Formulario
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState('08:00 - 09:30');
  
  // ¿Hubo clases? (Sí / No)
  const [huboClase, setHuboClase] = useState('Sí');
  const [motivoSuspension, setMotivoSuspension] = useState('Licencia Médica');
  const [otroMotivoText, setOtroMotivoText] = useState('');

  // Campos del Libro de Temas (solo obligatorios si hubo clases)
  const [claseNum, setClaseNum] = useState('');
  const [unidad, setUnidad] = useState('');
  const [caracter, setCaracter] = useState('Práctica');
  const [dinamica, setDinamica] = useState('Grupal');
  const [observaciones, setObservaciones] = useState('');
  const [temaAbordado, setTemaAbordado] = useState('');
  
  const [asistenciaState, setAsistenciaState] = useState({}); // { [dni]: 'Presente' | 'Ausente' | '-' }
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [signedParte, setSignedParte] = useState(null);

  const CARACTERES = ['Práctica', 'Teórica', 'Teórica-Práctica', 'Evaluativa', 'Recreativa'];
  const SUSPENSION_MOTIVOS = ['Licencia Médica', 'Causas climáticas', 'Otros'];

  // Computar cursos asignados dinámicamente
  const cursosAsignados = useMemo(() => {
    return Object.keys(cursosConfig).filter(
      (curso) => cursosConfig[curso].docenteDni === user.dni
    );
  }, [cursosConfig, user.dni]);

  const alumnosFiltrados = useMemo(() => {
    if (!selectedCurso) return [];
    return alumnos
      .filter(al => al.cursoOrigen === selectedCurso || al.cursoEF === selectedCurso)
      .sort((a, b) => {
        const isExternoA = a.cursoOrigen !== selectedCurso;
        const isExternoB = b.cursoOrigen !== selectedCurso;

        if (isExternoA && !isExternoB) return 1;
        if (!isExternoA && isExternoB) return -1;

        const nombreA = (a.nombre || '').trim().toLowerCase();
        const nombreB = (b.nombre || '').trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
      });
  }, [alumnos, selectedCurso]);

  // Filtrar notificaciones de partes faltantes pendientes para este docente
  const notificacionesFaltantes = useMemo(() => {
    return solicitudesFaltantes.filter(
      sol => cursosAsignados.includes(sol.curso) && !sol.completada
    );
  }, [solicitudesFaltantes, cursosAsignados]);

  // Al seleccionar un curso o atender una solicitud de parte faltante
  const handleSelectCurso = (curso, fechaSolicitud = null) => {
    setSelectedCurso(curso);
    setSuccessMsg('');
    setErrorMsg('');
    setSignedParte(null);
    
    // Configurar fecha
    if (fechaSolicitud) {
      setFecha(fechaSolicitud);
    } else {
      setFecha(new Date().toISOString().split('T')[0]);
    }

    setHuboClase('Sí');
    setMotivoSuspension('Licencia Médica');
    setOtroMotivoText('');
    setClaseNum('');
    setUnidad('I');
    setCaracter('Práctica');
    setDinamica('Grupal');
    setObservaciones('');
    setTemaAbordado('');
    
    const schoolTurno = curso.endsWith('1°') ? 'Mañana' : 'Tarde';
    const turnoDetectado = schoolTurno === 'Mañana' ? 'Tarde' : 'Mañana';
    const config = cursosConfig[curso];
    const horarioEstimado = config ? config.horario : (turnoDetectado === "Mañana" ? "08:00 - 09:30" : "13:30 - 15:00");
    setHorario(horarioEstimado);

    // Inicializar asistencia (solo alumnos que cursan EF activamente en esta división)
    const initialAsistencia = {};
    alumnos.filter(al => al.cursoEF === curso && !al.noCursaEF).forEach(al => {
      initialAsistencia[al.dni] = 'Presente';
    });
    setAsistenciaState(initialAsistencia);
  };

  const handleAsistenciaChange = (dni, estado) => {
    setAsistenciaState(prev => ({ ...prev, [dni]: estado }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSignedParte(null);

    // Determinar valores según si HUBO clase o NO
    let temaAbordadoFinal = '';
    let observacionesFinal = observaciones.trim() || 'Sin observaciones.';
    let asistenciaFinal = { ...asistenciaState };
    let claseNumFinal = claseNum.trim();
    let unidadFinal = unidad.trim();
    let caracterFinal = caracter;
    let dinamicaFinal = dinamica.trim();

    if (huboClase === 'No') {
      // ANULAR carga de asistencias (motivos de la anulación)
      const motivoCompleto = motivoSuspension === 'Otros' ? `Otros: ${otroMotivoText.trim()}` : motivoSuspension;
      
      if (motivoSuspension === 'Otros' && !otroMotivoText.trim()) {
        setErrorMsg("Por favor, especifique el motivo de la suspensión de clases.");
        return;
      }

      temaAbordadoFinal = `[CLASE NO DICTADA] - Motivo: ${motivoCompleto}`;
      observacionesFinal = `Clase suspendida. Motivo: ${motivoCompleto}`;
      claseNumFinal = '-';
      unidadFinal = '-';
      caracterFinal = '-';
      dinamicaFinal = '-';

      // Marcar a todos los alumnos activos en este curso con "-" (no se tomó asistencia porque no hubo clases)
      alumnosFiltrados.filter(al => al.cursoEF === selectedCurso && !al.noCursaEF).forEach(al => {
        asistenciaFinal[al.dni] = '-';
      });
    } else {
      // Validaciones si HUBO clases
      if (!claseNum.trim()) {
        setErrorMsg("El número de Clase es obligatorio.");
        return;
      }
      if (!unidad.trim()) {
        setErrorMsg("La Unidad es obligatoria.");
        return;
      }
      if (!temaAbordado.trim()) {
        setErrorMsg("El Tema Abordado es obligatorio.");
        return;
      }
      temaAbordadoFinal = temaAbordado.trim();
    }

    const dateObj = new Date(fecha + 'T00:00:00');
    const diaString = String(dateObj.getDate()).padStart(2, '0');
    const mesesNombres = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const mesString = mesesNombres[dateObj.getMonth()];
    const turno = (selectedCurso.endsWith('2°') || selectedCurso.endsWith('3°')) ? "Tarde" : "Mañana";

    // Firma digital
    const firmaDigital = {
      apellido: user.apellido,
      nombre: user.nombre,
      cargo: "Prof. de Educación Física",
      correo: user.correo,
      fechaFirma: new Date().toISOString()
    };

    const nuevoParte = {
      fecha,
      dia: diaString,
      mes: mesString,
      claseNum: claseNumFinal,
      unidad: unidadFinal,
      caracter: caracterFinal,
      dinamica: dinamicaFinal,
      observaciones: observacionesFinal,
      curso: selectedCurso,
      turno,
      horario,
      docenteNombre: `${user.nombre} ${user.apellido}`,
      huboClase, // Sí o No
      motivoSuspension: huboClase === 'No' ? (motivoSuspension === 'Otros' ? otroMotivoText.trim() : motivoSuspension) : "",
      asistencia: asistenciaFinal,
      contenido: temaAbordadoFinal,
      firmaDigital,
      firmaAutoridad: null
    };

    guardarParteEF(nuevoParte);
    setSignedParte(nuevoParte);
    setSuccessMsg(
      huboClase === 'Sí' 
        ? "¡Parte firmado y registrado en el Libro de Temas!" 
        : "¡Parte registrado como CLASE SUSPENDIDA con firma digital!"
    );

    setTimeout(() => {
      setSelectedCurso(null);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {!selectedCurso ? (
        // PANTALLA 1: Listado de Cursos + Solicitudes Faltantes
        <div className="space-y-6">
          
          {/* Panel de Notificaciones de Solicitudes Faltantes */}
          {notificacionesFaltantes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-5 shadow-sm relative overflow-hidden animate-pulse-once">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl"></div>
              
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm uppercase tracking-wider mb-4">
                <Bell className="animate-bounce" size={16} />
                <span>Solicitudes de Partes Faltantes Pendientes</span>
              </div>
              
              <div className="space-y-3">
                {notificacionesFaltantes.map((sol) => (
                  <div 
                    key={sol.id} 
                    className="bg-white border border-red-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <span className="inline-block bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-red-200">
                        FALTA PARTE DIARIO
                      </span>
                      <div className="mt-1.5 text-xs text-slate-800 font-bold">
                        Curso: {sol.curso} EF • Fecha Requerida: <span className="font-mono text-primary-500">{new Date(sol.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Solicitado por: <strong>{sol.solicitanteNombre} ({sol.solicitanteRol})</strong> el {new Date(sol.fechaSolicitud).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCurso(sol.curso, sol.fecha)}
                      className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-center"
                    >
                      Confeccionar Parte Faltante
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos Asignados */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-display mb-4">Cursos Asignados</h2>
            <p className="text-slate-500 text-xs mb-6">Selecciona una de tus clases para confeccionar el Parte Diario y registrar contenidos del Libro de Temas.</p>
            
            {cursosAsignados.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-white">
                <AlertOctagon className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-500 font-bold text-sm">No tienes ningún curso asignado en la consola administrativa.</p>
                <p className="text-slate-400 text-xs mt-1">Pídele a un Director o Preceptor que te asigne cursos en la sección de administración.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {cursosAsignados.map((curso) => {
                  const cantidad = alumnos.filter(al => al.cursoEF === curso).length;
                  const config = cursosConfig[curso];
                  const turno = config ? config.turno : (curso.endsWith('1°') ? 'Mañana' : 'Tarde');
                  
                  return (
                    <button
                      key={curso}
                      onClick={() => handleSelectCurso(curso)}
                      className="glass-panel text-left p-6 rounded-2xl border border-slate-200 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all duration-300 group relative overflow-hidden bg-white cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-primary-500/10 transition-all"></div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-display font-extrabold text-3xl text-slate-800 tracking-tight">{curso}</span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                          {turno}
                        </span>
                      </div>

                      <div className="space-y-2 mt-6">
                        <div className="text-xs text-slate-500 font-medium">
                          Estudiantes Totales: <strong className="text-slate-850 font-bold">{cantidad}</strong>
                        </div>
                        <div className="text-[10px] text-primary-500 flex items-center gap-1 font-bold">
                          <span>Confeccionar Parte</span>
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // PANTALLA 2: Formulario del Parte
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl relative bg-white">
          
          <div className="flex items-center justify-between border-b border-slate-150 pb-5 mb-6">
            <div>
              <span className="text-[10px] font-bold text-primary-600 bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 rounded-full uppercase">
                Parte e Inyección en Libro de Temas
              </span>
              <h2 className="text-2xl font-bold text-slate-900 font-display mt-1.5">Confección de Clase: {selectedCurso}</h2>
            </div>
            <button
              onClick={() => setSelectedCurso(null)}
              className="text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer font-bold"
            >
              Cancelar
            </button>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-accent-500/10 border border-accent-500/20 text-accent-700 text-sm rounded-2xl flex items-center gap-3 animate-pulse-once font-semibold">
              <CheckCircle2 className="text-accent-600 shrink-0" size={20} />
              <div>
                <span className="font-bold block">{successMsg}</span>
                <span className="text-[11px] text-accent-600/80 font-normal">Redirigiendo al panel de cursos...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/5 border border-red-500/15 text-red-700 text-sm rounded-2xl flex items-center gap-3 font-semibold">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PREGUNTA CRÍTICA: ¿HUBO CLASES HOY? */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-3 text-center">
                ¿Hubo clases de Educación Física el día de hoy? <span className="text-red-500">*</span>
              </span>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setHuboClase('Sí')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    huboClase === 'Sí'
                      ? 'bg-accent-500 border-accent-600 text-white shadow-md shadow-accent-500/10'
                      : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200'
                  }`}
                >
                  <Check size={16} />
                  SÍ, hubo clases
                </button>
                <button
                  type="button"
                  onClick={() => setHuboClase('No')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    huboClase === 'No'
                      ? 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/10'
                      : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200'
                  }`}
                >
                  <X size={16} />
                  NO hubo clases
                </button>
              </div>
            </div>

            {/* Cabecera / Configuración del Parte */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Profesor Interino</label>
                <input
                  type="text"
                  value={`${user.nombre} ${user.apellido}`}
                  disabled
                  className="w-full bg-white border border-slate-250 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed border-slate-200 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Fecha del Parte</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Turno Cursada</label>
                <input
                  type="text"
                  value={(selectedCurso.endsWith('2°') || selectedCurso.endsWith('3°')) ? "Tarde" : "Mañana"}
                  disabled
                  className="w-full bg-white border border-slate-250 text-slate-500 rounded-xl px-3 py-2 text-xs font-semibold cursor-not-allowed border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Días y Horarios EF</label>
                <input
                  type="text"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-mono"
                />
              </div>
            </div>

            {/* RENDERIZADO DINÁMICO CONDICIONAL: SI HUBO CLASE (Formulario completo) */}
            {huboClase === 'Sí' ? (
              <div className="space-y-6 animate-pulse-once">
                
                {/* Campos Libro de Temas */}
                <div className="bg-primary-500/5 p-5 rounded-2xl border border-primary-500/10 space-y-4">
                  <span className="text-[11px] font-bold text-primary-600 block uppercase tracking-wider mb-2 font-display">
                    Campos del Libro de Temas (Estructura Oficial)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Clase N° <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={claseNum}
                        onChange={(e) => setClaseNum(e.target.value)}
                        placeholder="Ej. 1"
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unidad <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={unidad}
                        onChange={(e) => setUnidad(e.target.value)}
                        placeholder="Ej. I / II"
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Carácter de la Clase</label>
                      <select
                        value={caracter}
                        onChange={(e) => setCaracter(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-bold cursor-pointer"
                      >
                        {CARACTERES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Dinámica de Clase</label>
                      <input
                        type="text"
                        value={dinamica}
                        onChange={(e) => setDinamica(e.target.value)}
                        placeholder="Grupal, Parejas, Estaciones..."
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tema Abordado <span className="text-red-500">*</span></label>
                      <textarea
                        value={temaAbordado}
                        onChange={(e) => setTemaAbordado(e.target.value)}
                        placeholder="Describa el contenido específico de la clase..."
                        rows={2}
                        required
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-sans leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones</label>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Incidentes, conducta, justificaciones, etc. (Opcional)"
                        rows={2}
                        className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabla de Asistencia */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 font-display">Tabla de Asistencia (Matrícula + Externos)</h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                          <th className="py-2.5 px-4">Estudiante (Apellido, Nombre)</th>
                          <th className="py-2.5 px-3">DNI</th>
                          <th className="py-2.5 px-3">Curso Origen</th>
                          <th className="py-2.5 px-4 text-center w-48">Control de Asistencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alumnosFiltrados.map((al) => {
                          const esExterno = al.cursoOrigen !== selectedCurso;
                          const esInactivoEnEsteCurso = al.noCursaEF || (al.cursoEF !== selectedCurso && al.cursoOrigen === selectedCurso);
                          const controlValue = asistenciaState[al.dni] || 'Presente';
                          
                          return (
                            <tr key={al.dni} className="hover:bg-slate-50 text-slate-700">
                              <td className="py-3 px-4 font-semibold">
                                <span className={
                                  al.noCursaEF 
                                    ? 'text-red-600 line-through' 
                                    : esInactivoEnEsteCurso 
                                      ? 'text-slate-400 line-through' 
                                      : 'text-slate-800'
                                }>
                                  {al.nombre}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500">{al.dni}</td>
                              <td className="py-3 px-3 font-medium">
                                {al.noCursaEF ? (
                                  <span className="inline-block bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                                    NO CURSA EF
                                  </span>
                                ) : al.cursoEF !== selectedCurso ? (
                                  <span className="inline-block bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                    Cursa en {al.cursoEF}
                                  </span>
                                ) : esExterno ? (
                                  <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] font-bold">
                                    Externo (desde {al.cursoOrigen})
                                  </span>
                                ) : (
                                  <span className="text-slate-500">{al.cursoOrigen}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {al.noCursaEF ? (
                                  <div className="text-center font-extrabold text-[9px] text-red-700 uppercase select-none py-1.5 bg-red-50 rounded-lg border border-red-200">
                                    NO CURSA EF
                                  </div>
                                ) : esInactivoEnEsteCurso ? (
                                  <div className="text-center font-bold text-[9px] text-slate-400 uppercase select-none py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                    Sin Registro
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAsistenciaChange(al.dni, 'Presente')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${
                                        controlValue === 'Presente'
                                          ? 'bg-accent-50 text-accent-700 border-accent-300 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <Check size={10} />
                                      Presente
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleAsistenciaChange(al.dni, 'Ausente')}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-lg border font-bold text-[10px] transition-all cursor-pointer ${
                                        controlValue === 'Ausente'
                                          ? 'bg-red-50 text-red-700 border-red-300 shadow-sm'
                                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <X size={10} />
                                      Ausente
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              // RENDERIZADO DINÁMICO CONDICIONAL: SI NO HUBO CLASES
              <div className="bg-red-50/50 border border-red-200 p-6 rounded-3xl space-y-4 animate-pulse-once">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="text-red-500 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="text-base font-bold text-red-800 font-display">Clase No Dictada (Carga de Asistencias Anulada)</h3>
                    <p className="text-xs text-red-650 text-red-700 mt-1 leading-relaxed">
                      Ha indicado que no hubo clases el día de hoy. El sistema ha **bloqueado y anulado** la carga de asistencia individual de los alumnos. Por favor, establezca los motivos de la suspensión escolar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Motivo de Suspensión de Clases <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={motivoSuspension}
                      onChange={(e) => setMotivoSuspension(e.target.value)}
                      className="w-full bg-white border border-slate-350 focus:border-red-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none transition-all font-bold cursor-pointer border-slate-300"
                    >
                      {SUSPENSION_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Campo para especificar en caso de "Otros" */}
                  {motivoSuspension === 'Otros' && (
                    <div className="animate-pulse-once">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Especifique el Motivo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={otroMotivoText}
                        onChange={(e) => setOtroMotivoText(e.target.value)}
                        placeholder="Describa el motivo específico (ej: Jornada Institucional)..."
                        required
                        className="w-full bg-white border border-red-500/30 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Observaciones de Suspensión (Opcional)</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Agregue información de respaldo sobre la suspensión de clases si es necesario..."
                    rows={2}
                    className="w-full bg-white border border-slate-300 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-all font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Visualizador de Sello de Firma */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
              
              <div>
                <div className="flex items-center gap-2 text-primary-500 font-bold text-xs uppercase tracking-wide">
                  <FileSignature size={14} className="animate-pulse" />
                  <span>Sello de Firma Digital Automática</span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-bold text-slate-800">{user.nombre} {user.apellido}</p>
                  <p className="text-[10px] text-slate-500 font-mono font-semibold">Prof. de Educación Física • {user.correo}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-center self-start sm:self-center font-mono text-[9px] text-slate-500 shadow-sm font-bold">
                <span className="block font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-0.5">Sello Digital</span>
                <span>SECURE_AUTH_VERIFIED_EES28</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider text-xs ${
                huboClase === 'Sí' 
                  ? 'bg-primary-500 hover:bg-primary-600 shadow-primary-500/10' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
              }`}
            >
              <FileSignature size={18} />
              {huboClase === 'Sí' ? 'Firmar y Registrar en Libro de Temas' : 'Firmar Acta de Clase Suspendida'}
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default DocenteAsistencia;
